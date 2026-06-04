'use client';
import { useState, useEffect } from 'react';
import { CATEGORIES, type Note } from '@/types';
import { parseCornellMarkdown } from '@/lib/parseMarkdown';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [category, setCategory] = useState('前端开发');
  const [tags, setTags] = useState('');
  const [md, setMd] = useState('');
  const [preview, setPreview] = useState<{ title: string; cue: string; content: string; summary: string } | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loggedIn) fetchNotes(); }, [loggedIn]);

  async function fetchNotes() {
    const res = await fetch('/api/notes');
    const data = await res.json();
    if (Array.isArray(data)) setNotes(data);
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
    const parsed = parseCornellMarkdown(md);
    const tagArr = tags.split(/[,，\s]+/).filter(Boolean);
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: parsed.title, content_md: md, category, tags: tagArr }),
    });
    if (res.ok) { setMsg('发布成功！'); setMd(''); setPreview(null); fetchNotes(); }
    else { const err = await res.json(); setMsg('发布失败: ' + err.error); }
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
          {/* 发布区 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold mb-4">粘贴 Markdown 内容</h2>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl mb-3">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="标签（逗号分隔）" className="w-full p-2.5 border rounded-xl mb-3" />
            <textarea value={md} onChange={e => { setMd(e.target.value); }} placeholder={'粘贴 AI 生成的 Markdown 内容...\n\n格式示例：\n# 标题\n## 提示\n提示内容...\n## 笔记\n笔记内容...\n## 总结\n总结内容...'}
              className="w-full h-64 p-3 border rounded-xl text-sm font-mono resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={handlePreview} className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200">预览</button>
              <button onClick={handlePublish} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">发布</button>
            </div>
            {preview && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm">
                <div className="font-bold mb-1">预览: {preview.title}</div>
                <div className="text-blue-700 mb-1">提示: {preview.cue.slice(0, 100)}</div>
                <div className="text-gray-700">笔记: {preview.content.slice(0, 150)}...</div>
              </div>
            )}
          </div>
          {/* 已发布列表 */}
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
      </div>
    </div>
  );
}
