'use client';
import Link from 'next/link';
import type { Note } from '@/types';

export default function CornellCard({ note }: { note: Note }) {
  return (
    <Link href={`/note/${note.id}`} className="block group">
      <article
        className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: '#fffdf9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)';
        }}
      >
        {/* Compact preview: cue + summary */}
        <div className="p-5">
          {/* Cue zone */}
          <div className="rounded-xl px-4 py-3 mb-3" style={{ background: '#f9f7f2' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]" style={{ background: '#e8e4dc' }}>🔍</div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400">线索</span>
            </div>
            <div className="text-[13px] font-medium leading-[1.6] text-stone-700 line-clamp-3">
              {note.cue_text || '暂无线索'}
            </div>
          </div>

          {/* Summary zone */}
          {note.summary_text && (
            <div className="rounded-xl px-4 py-3 border" style={{ background: '#faf6ed', borderColor: '#ede8da' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]" style={{ background: '#e8dcc8' }}>✅</div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: '#92784a' }}>总结</span>
              </div>
              <div className="text-[13px] font-medium leading-[1.6] line-clamp-2" style={{ color: '#6b5b3e' }}>
                {note.summary_text}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f0eeea' }}>
          <span className="text-[11px] text-stone-400">{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1">
              {note.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#f0eeea', color: '#78716c' }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
