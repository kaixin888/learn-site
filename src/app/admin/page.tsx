'use client';
import { useState, useEffect } from 'react';
import { type Note, type Category, DEFAULT_CATEGORIES } from '@/types';
import { parseCornellMarkdown } from '@/lib/parseMarkdown';

// Flatten tree to list for display
function flattenTree(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const c of cats) {
    result.push(c);
    if (c.children) {
      for (const child of c.children) {
        result.push({ ...child, parent_id: c.id });
      }
    }
  }
  return result;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedParentCat, setSelectedParentCat] = useState('');
  const [selectedChildCat, setSelectedChildCat] = useState('');
  const [tags, setTags] = useState('');
  const [md, setMd] = useState('');
  const [preview, setPreview] = useState<{ title: string; cue: string; content: string; summary: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState<string | null>(null); // null = top-level
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [catMsg, setCatMsg] = useState('');

  useEffect(() => { if (loggedIn) { fetchNotes(); fetchCategories(); } }, [loggedIn]);

  async function fetchNotes() {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (Array.isArray(data)) setNotes(data);
    } catch {}
  }
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        // Auto-select first parent
        if (!selectedParentCat && data.length > 0) {
          setSelectedParentCat(data[0].name);
        }
      }
    } catch {}
  }

  // Get flat list of all category names for the notes API (stores flat name)
  function getFullCategoryName(): string {
    if (selectedChildCat) return selectedChildCat;
    return selectedParentCat;
  }

  async function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) { setCatMsg('请输入分类名称'); return; }
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_id: newCatParent }),
    });
    if (res.ok) { setNewCatName(''); setCatMsg(''); fetchCategories(); }
    else { const { error } = await res.json(); setCatMsg(error || '新增失败'); }
  }

  async function handleUpdateCategory() {
    if (!editingCat) return;
    const name = editingCat.name.trim();
    if (!name) { setCatMsg('分类名称不能为空'); return; }
    const res = await fetch('/api/categories/' + editingCat.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { setEditingCat(null); setCatMsg(''); fetchCategories(); }
    else { const err = await res.json(); setCatMsg('修改失败: ' + err.error); }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('确认删除该分类？')) return;
    const res = await fetch('/api/categories/' + id, { method: 'DELETE' });
    if (res.ok) { setCatMsg(''); fetchCategories(); }
    else { const err = await res.json(); setCatMsg('删除失败: ' + err.error); }
  }

  // Move category up/down within its level
  async function handleMoveCategory(catId: string, direction: 'up' | 'down') {
    const allFlat = flattenTree(categories);
    const cat = allFlat.find(c => c.id === catId);
    if (!cat) return;
    const parentId = cat.parent_id;
    const siblings = allFlat.filter(c => c.parent_id === parentId);
    const idx = siblings.findIndex(c => c.id === catId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblings.length) return;

    // Swap sort_order
    const swapWith = siblings[newIdx];
    await fetch('/api/categories/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { id: catId, sort_order: swapWith.sort_order || newIdx },
        { id: swapWith.id, sort_order: cat.sort_order || idx },
      ]),
    });
    fetchCategories();
  }

  async function handleCleanupDupes() {
    if (!confirm('将删除所有重复分类（保留最早创建的一条），确认？')) return;
    const res = await fetch('/api/categories/cleanup', { method: 'DELETE' });
    if (res.ok) {
      const result = await res.json();
      setCatMsg('已清理 ' + (result.deleted || 0) + ' 条重复分类');
      fetchCategories();
    } else {
      const err = await res.json();
      setCatMsg('清理失败: ' + err.error);
    }
  }

  function handleLogin() {
    if (password.trim() === 'clowand888') { setLoggedIn(true); setMsg(''); }
    else setMsg('密码错误');
  }

  function handlePreview() {
    if (!md.trim()) return;
    const parsed = parseCornellMarkdown(md);
    setPreview(parsed);
  }

  async function handlePublish() {
    if (!md.trim()) { setMsg('请输入内容'); return; }
    if (!selectedParentCat) { setMsg('请选择分类'); return; }
    if (publishing) return;
    setPublishing(true);
    setMsg('发布中...');
    try {
      const parsed = parseCornellMarkdown(md);
      const tagArr = tags.split(/[,，\s]+/).filter(Boolean);
      const category = getFullCategoryName();
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: parsed.title, content_md: md, category, tags: tagArr }),
      });
      if (res.ok) {
        setMsg('发布成功！');
        setMd('');
        setPreview(null);
        fetchNotes();
      } else {
        let detail = '未知错误';
        try { const err = await res.json(); detail = err.error || JSON.stringify(err); }
        catch { detail = 'HTTP ' + res.status; }
        setMsg('发布失败: ' + detail);
      }
    } catch (e) {
      setMsg('发布失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    await fetch('/api/notes/' + id, { method: 'DELETE' });
    fetchNotes();
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center">管理登录</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码"
            className="w-full p-3 border rounded-xl mb-4" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700">登录</button>
          {msg && <p className="text-red-500 text-sm mt-3 text-center">{msg}</p>}
        </div>
      </div>
    );
  }

  // Selected parent's children
  const selectedParent = categories.find(c => c.name === selectedParentCat);
  const childCategories = selectedParent?.children || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">学习笔记管理</h1>
        {msg && (
          <div className={'mb-4 p-3 rounded-xl text-sm text-center ' + (msg.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {msg}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publish area */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold mb-4">粘贴 Markdown 内容</h2>
            {/* Cascade category select */}
            <div className="flex gap-2 mb-3">
              <select value={selectedParentCat} onChange={e => { setSelectedParentCat(e.target.value); setSelectedChildCat(''); }} className="flex-1 p-2.5 border rounded-xl text-sm">
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {childCategories.length > 0 && (
                <select value={selectedChildCat} onChange={e => setSelectedChildCat(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-sm">
                  <option value="">-- 选择二级分类 --</option>
                  {childCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
            </div>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="标签（逗号分隔）" className="w-full p-2.5 border rounded-xl mb-3" />
            <textarea value={md} onChange={e => { setMd(e.target.value); }} placeholder={'粘贴 AI 生成的 Markdown 内容...\n\n推荐格式（康奈尔三栏）：\n# 笔记标题\n### 🔍 线索栏（提问自测）\n线索/问题内容...\n### 📝 笔记栏（核心知识点）\n笔记正文...\n### ✅ 总结栏（精简口诀）\n总结口诀...'}
              className="w-full h-64 p-3 border rounded-xl text-sm font-mono resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={handlePreview} className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200">预览</button>
              <button onClick={handlePublish} disabled={publishing} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{publishing ? '发布中...' : '发布'}</button>
            </div>
            {preview && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm space-y-2">
                <div className="font-bold">预览: {preview.title}</div>
                {preview.cue && (
                  <div><span className="font-semibold text-blue-700">🔍 线索栏：</span><span className="whitespace-pre-wrap text-gray-700">{preview.cue}</span></div>
                )}
                {preview.content && (
                  <div><span className="font-semibold text-green-700">📝 笔记栏：</span><span className="whitespace-pre-wrap text-gray-700">{preview.content}</span></div>
                )}
                {preview.summary && (
                  <div><span className="font-semibold text-amber-700">✅ 总结栏：</span><span className="whitespace-pre-wrap text-gray-700">{preview.summary}</span></div>
                )}
              </div>
            )}
          </div>
          {/* Published list */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold mb-4">已发布笔记 ({notes.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notes.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{n.title}</span>
                    <span className="text-xs text-gray-400">{n.category}</span>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="ml-3 text-red-500 text-xs hover:underline">删除</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category management panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mt-6">
          <h2 className="font-bold mb-4">分类管理
            <button onClick={handleCleanupDupes} className="ml-3 text-xs text-red-500 hover:underline font-normal">清理重复</button>
          </h2>
          {catMsg && (
            <div className={'mb-3 p-3 rounded-xl text-sm ' + (catMsg.includes('失败') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
              {catMsg}
            </div>
          )}
          {/* Tree display: parent categories with children */}
          <div className="space-y-3 mb-4">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="border border-gray-200 rounded-lg">
                {/* Parent category row */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-t-lg text-sm">
                  <span className="text-gray-400 text-xs w-6 text-center">{idx + 1}</span>
                  <span className="font-medium flex-1">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleMoveCategory(cat.id, 'up')} disabled={idx === 0} className="text-gray-400 text-xs hover:text-blue-500 disabled:opacity-30" title="上移">↑</button>
                    <button onClick={() => handleMoveCategory(cat.id, 'down')} disabled={idx === categories.length - 1} className="text-gray-400 text-xs hover:text-blue-500 disabled:opacity-30" title="下移">↓</button>
                    <button onClick={() => setEditingCat({ id: cat.id, name: cat.name })} className="text-blue-500 text-xs hover:underline">编辑</button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 text-xs hover:underline">删除</button>
                  </div>
                </div>
                {/* Children */}
                {cat.children && cat.children.length > 0 && (
                  <div className="p-2 pl-10 bg-white rounded-b-lg">
                    {cat.children.map((child, cIdx) => (
                      <div key={child.id} className="flex items-center gap-2 py-1.5 text-sm">
                        <span className="text-gray-300 text-xs w-6 text-center">└ {cIdx + 1}</span>
                        <span className="flex-1 text-gray-700">{child.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => handleMoveCategory(child.id, 'up')} disabled={cIdx === 0} className="text-gray-400 text-xs hover:text-blue-500 disabled:opacity-30" title="上移">↑</button>
                          <button onClick={() => handleMoveCategory(child.id, 'down')} disabled={cIdx === cat.children!.length - 1} className="text-gray-400 text-xs hover:text-blue-500 disabled:opacity-30" title="下移">↓</button>
                          <button onClick={() => setEditingCat({ id: child.id, name: child.name })} className="text-blue-500 text-xs hover:underline">编辑</button>
                          <button onClick={() => handleDeleteCategory(child.id)} className="text-red-400 text-xs hover:underline">删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Edit inline */}
          {editingCat && (
            <div className="flex gap-2 mb-3 p-3 bg-yellow-50 rounded-xl">
              <input
                value={editingCat.name}
                onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleUpdateCategory(); if (e.key === 'Escape') setEditingCat(null); }}
                className="flex-1 p-2 border rounded text-sm"
                autoFocus
              />
              <button onClick={handleUpdateCategory} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">保存</button>
              <button onClick={() => setEditingCat(null)} className="px-3 py-1.5 bg-gray-200 rounded-lg text-sm">取消</button>
            </div>
          )}
          {/* Add category: choose parent or top-level */}
          <div className="flex gap-2 flex-wrap">
            <select value={newCatParent || ''} onChange={e => setNewCatParent(e.target.value || null)} className="p-2.5 border rounded-xl text-sm">
              <option value="">一级分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>└ {c.name}</option>)}
            </select>
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入分类名称"
              className="flex-1 max-w-xs p-2.5 border rounded-xl text-sm"
            />
            <button onClick={handleAddCategory} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">+ 新增</button>
          </div>
        </div>
      </div>
    </div>
  );
}
