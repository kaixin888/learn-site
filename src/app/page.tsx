'use client';
import { useState, useEffect, useMemo } from "react";
import { type Note, type Category, DEFAULT_CATEGORIES } from "@/types";
import SearchBar from "@/components/SearchBar";
import CategoryNav from "@/components/CategoryNav";
import CornellCard from "@/components/CornellCard";
import NoteDetail from "@/components/NoteDetail";

export default function HomePage() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [activeNode, setActiveNode] = useState<Category | null>(null); // null = 全部
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const activeId = activeNode?.id ?? "";

  // 加载分类
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    }).catch(() => {});
  }, []);

  // 加载全部笔记（不分页，前端过滤分类）
  useEffect(() => {
    setLoading(true);
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllNotes(data); })
      .catch(() => setAllNotes([]))
      .finally(() => setLoading(false));
  }, []);

  // 节点 id -> 该节点子树内所有「叶子类目名」集合（卡片 category 存的是叶子名）
  const nodeLeafNames = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const collect = (node: Category): Set<string> => {
      const names = new Set<string>();
      if (!node.children || node.children.length === 0) {
        names.add(node.name); // 叶子：自身即类目名
      } else {
        node.children.forEach(c => collect(c).forEach(n => names.add(n)));
      }
      map.set(node.id, names);
      return names;
    };
    categories.forEach(collect);
    return map;
  }, [categories]);

  // 节点 id -> 聚合卡片数（含全部后代）
  const nodeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    // 先统计每个叶子类目名的卡片数
    const byName = new Map<string, number>();
    allNotes.forEach(n => byName.set(n.category, (byName.get(n.category) || 0) + 1));
    nodeLeafNames.forEach((names, id) => {
      let sum = 0;
      names.forEach(name => { sum += byName.get(name) || 0; });
      counts.set(id, sum);
    });
    return counts;
  }, [allNotes, nodeLeafNames]);

  // 按选中节点过滤（匹配该节点子树所有叶子类目）
  const filteredNotes = useMemo(() => {
    if (!activeNode) return allNotes;
    const names = nodeLeafNames.get(activeNode.id);
    if (!names) return allNotes.filter(n => n.category === activeNode.name);
    return allNotes.filter(n => names.has(n.category));
  }, [allNotes, activeNode, nodeLeafNames]);

  // 搜索过滤
  const displayedNotes = useMemo(() => {
    if (!search) return filteredNotes;
    const q = search.toLowerCase();
    return filteredNotes.filter(
      n => n.title.toLowerCase().includes(q) || n.cue_text.toLowerCase().includes(q)
    );
  }, [filteredNotes, search]);

  // 选中节点（来自导航）
  function handleSelect(node: Category | null) {
    setActiveNode(node);
    setSearch("");
  }

  // 按类目名定位节点（详情页点击 category 标签时用），找不到则构造一个虚拟叶子节点
  function selectByName(name: string) {
    let found: Category | null = null;
    const walk = (n: Category) => {
      if (found) return;
      if (n.name === name) { found = n; return; }
      n.children?.forEach(walk);
    };
    categories.forEach(walk);
    setActiveNode(found ?? { id: `__name__:${name}`, name, parent_id: null, children: [] });
    setSelectedIdx(-1);
  }

  // 选中卡片
  function handleSelectNote(note: Note) {
    const idx = displayedNotes.findIndex(n => n.id === note.id);
    setSelectedIdx(idx);
  }

  // 左右导航
  function handlePrev() {
    if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  }
  function handleNext() {
    if (selectedIdx < displayedNotes.length - 1) setSelectedIdx(selectedIdx + 1);
  }

  const activeLabel = activeNode?.name ?? "";

  // 详情页
  if (selectedIdx >= 0 && selectedIdx < displayedNotes.length) {
    const note = displayedNotes[selectedIdx];
    const prevNote = selectedIdx > 0 ? displayedNotes[selectedIdx - 1] : null;
    const nextNote = selectedIdx < displayedNotes.length - 1 ? displayedNotes[selectedIdx + 1] : null;

    return (
      <div>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <button onClick={() => setSelectedIdx(-1)} className="text-blue-600 text-sm font-medium hover:underline">
              返回列表
            </button>
            <span className="text-xs text-gray-400">
              {selectedIdx + 1} / {displayedNotes.length}
            </span>
            <div className="flex-1" />
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{note.category}</span>
          </div>
        </header>
        <NoteDetail
          note={note}
          prevNote={prevNote}
          nextNote={nextNote}
          onPrev={handlePrev}
          onNext={handleNext}
          onCategoryClick={(cat) => selectByName(cat)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-4">clowand 学习笔记</h1>
          <div className="flex gap-2">
            <div className="flex-1"><SearchBar value={search} onSearch={setSearch} /></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* 侧边栏分类 */}
        <aside className="w-60 flex-shrink-0 hidden lg:block">
          <CategoryNav
            activeId={activeId}
            onSelect={handleSelect}
            categories={categories}
            counts={nodeCounts}
            total={allNotes.length}
          />
        </aside>

        {/* 移动端分类 */}
        <div className="lg:hidden w-full mb-4">
          <CategoryNav
            activeId={activeId}
            onSelect={handleSelect}
            categories={categories}
            counts={nodeCounts}
            total={allNotes.length}
          />
        </div>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              加载中...
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">{activeLabel ? `「${activeLabel}」暂无笔记` : '暂无笔记'}</p>
              <p className="text-sm mt-2">去管理端粘贴 Markdown 内容发布笔记吧</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {activeLabel ? `「${activeLabel}」` : '全部'} · {displayedNotes.length} 条笔记
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedNotes.map((n) => (
                  <CornellCard key={n.id} note={n} onClick={() => handleSelectNote(n)} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
