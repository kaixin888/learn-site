'use client';
import { useState, useEffect, useCallback } from "react";
import { type Note, type Category, DEFAULT_CATEGORIES } from "@/types";
import SearchBar from "@/components/SearchBar";
import CategoryNav from "@/components/CategoryNav";
import CornellCard from "@/components/CornellCard";
import NoteDetail from "@/components/NoteDetail";

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Note|null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    }).catch(() => {});
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch("/api/notes?" + params.toString());
      const data = await res.json();
      if (Array.isArray(data)) setNotes(data);
      else setNotes([]);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  function handleSearch(q: string) { setSearch(q); }
  function handleSearchSubmit() { fetchNotes(); }

  if (selected) {
    return <NoteDetail note={selected} onBack={() => setSelected(null)} />;
  }

  // Build a set of category names to match (parent + all its children)
  const matchCategories = new Set<string>();
  if (category) {
    matchCategories.add(category);
    const parent = categories.find(c => c.name === category);
    if (parent?.children) {
      for (const child of parent.children) matchCategories.add(child.name);
    }
  }

  const filtered = notes.filter(n => {
    const matchCat = matchCategories.size === 0 || matchCategories.has(n.category);
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.cue_text.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-4">学习笔记</h1>
          <div className="flex gap-2">
            <div className="flex-1"><SearchBar value={search} onSearch={handleSearch} /></div>
            <button onClick={handleSearchSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">搜索</button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CategoryNav active={category} onChange={(c)=>{setCategory(c);setSearch("");}} categories={categories} />
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">暂无笔记</p>
            <p className="text-sm mt-2">去管理端粘贴 Markdown 内容发布第一篇笔记吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filtered.map(n => <CornellCard key={n.id} note={n} onClick={() => setSelected(n)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
