'use client';
import { type Note } from '@/types';

export default function NoteDetail({ note, onBack }: { note: Note; onBack: () => void })
{  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <button onClick={onBack} className="mb-4 text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        返回列表
      </button>
      <article className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xs bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full">{note.category}</span>
          {note.tags && note.tags.map((t: string) => (<span key={t} className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">{t}</span>))}
          <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-[30%] bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3">提示</h3>
              <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{note.cue_text}</div>
            </div>
            <div className="md:w-[70%] p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">笔记</h3>
              <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: note.content_html }} />
            </div>
          </div>
          {note.summary_text && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">总结</h3>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{note.summary_text}</div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
