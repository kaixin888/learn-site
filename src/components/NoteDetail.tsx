'use client';
import { type Note } from '@/types';

export default function NoteDetail({ note, onBack }: { note: Note; onBack: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back */}
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-8 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          返回列表
        </button>

        {/* Title */}
        <h1 className="text-[22px] font-bold text-stone-800 leading-snug mb-3 tracking-tight">
          {note.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-10 text-xs text-stone-400">
          <span className="px-2.5 py-1 bg-stone-200/60 text-stone-500 rounded-md font-medium">{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1.5">
              {note.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-stone-100 text-stone-400 rounded-full text-[11px]">#{t}</span>
              ))}
            </div>
          )}
          <span className="ml-auto">{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
        </div>

        {/* Cornell Card */}
        <div className="rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden" style={{ background: '#fffdf9' }}>
          {/* Main body */}
          <div className="flex flex-col md:flex-row">
            {/* Left: Cue zone */}
            <div className="md:w-[30%] p-8 md:pr-6 md:border-r border-stone-100" style={{ background: '#f9f7f2' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]" style={{ background: '#e8e4dc' }}>🔍</div>
                <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-stone-500">线索栏</span>
              </div>
              <div className="text-[14px] font-medium leading-[1.65] text-stone-700 whitespace-pre-wrap">
                {note.cue_text || '暂无线索'}
              </div>
            </div>

            {/* Right: Note zone */}
            <div className="md:w-[70%] p-8 md:pl-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]" style={{ background: '#e8e4dc' }}>📝</div>
                <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-stone-500">笔记栏</span>
              </div>
              {note.content_html ? (
                <div
                  className="max-w-none"
                  style={{ fontSize: '14px', lineHeight: '1.7', color: '#44403c' }}
                  dangerouslySetInnerHTML={{
                    __html: note.content_html
                      .replace(/<strong([^>]*)>/g, '<strong$1 style="background:linear-gradient(180deg,transparent 55%,#fde68a 55%);font-weight:600;color:#44403c;padding:0 2px;border-radius:2px;">')
                      .replace(/<ul>/g, '<ul style="list-style:disc;padding-left:1.25rem;margin:0.75rem 0;">')
                      .replace(/<ol>/g, '<ol style="list-style:decimal;padding-left:1.25rem;margin:0.75rem 0;">')
                      .replace(/<li>/g, '<li style="margin-bottom:0.5rem;line-height:1.7;color:#57534e;">')
                      .replace(/<h(\d)([^>]*)>/g, '<h$1$2 style="font-size:15px;font-weight:700;color:#292524;margin:1.25rem 0 0.5rem;">')
                      .replace(/<p>/g, '<p style="margin-bottom:0.75rem;line-height:1.7;color:#57534e;">')
                  }}
                />
              ) : (
                <div className="text-[14px] text-stone-500 leading-[1.7] whitespace-pre-wrap">
                  {note.content_md || '暂无笔记内容'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Summary zone */}
          {note.summary_text && (
            <div className="px-8 py-6 border-t" style={{ background: '#faf6ed', borderColor: '#ede8da' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]" style={{ background: '#e8dcc8' }}>✅</div>
                <span className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: '#92784a' }}>总结栏</span>
              </div>
              <div className="text-[14px] font-medium leading-[1.65] whitespace-pre-wrap" style={{ color: '#6b5b3e' }}>
                {note.summary_text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
