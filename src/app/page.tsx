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
  const [category, setCategory] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

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

  // 按分类过滤
  const filteredNotes = useMemo(() => {
    let result = allNotes;
    if (category) {
      result = result.filter(n => n.category === category);
    }
    return result;
  }, [allNotes, category]);

  // 搜索过滤
  const displayedNotes = useMemo(() => {
    if (!search) return filteredNotes;
    const q = search.toLowerCase();
    return filteredNotes.filter(
      n => n.title.toLowerCase().includes(q) || n.cue_text.toLowerCase().includes(q)
    );
  }, [filteredNotes, search]);

  // 分类变化时清空搜索
  function handleCategoryChange(c: string) {
    setCategory(c);
    setSearch("");
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
          onCategoryClick={(cat) => { setCategory(cat); setSelectedIdx(-1); }}
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
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <CategoryNav active={category} onChange={handleCategoryChange} categories={categories} />
        </aside>

        {/* 移动端分类 */}
        <div className="lg:hidden w-full mb-4">
          <CategoryNav active={category} onChange={handleCategoryChange} categories={categories} />
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
              <p className="text-lg">{category ? `「${category}」暂无笔记` : '暂无笔记'}</p>
              <p className="text-sm mt-2">去管理端粘贴 Markdown 内容发布笔记吧</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {category ? `「${category}」` : '全部'} · {displayedNotes.length} 条笔记
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
