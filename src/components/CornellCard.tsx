'use client';
import Link from 'next/link';
import type { Note } from '@/types';

export default function CornellCard({ note }: { note: Note }) {
  return (
    <Link href={`/note/${note.id}`} className="block group">
      <article className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Compact preview: cue + summary only */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-[14px] font-bold text-slate-800 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
            {note.title}
          </h3>

          {/* Cue zone */}
          <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 mb-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
              🔍 线索
            </div>
            <div className="text-[12.5px] font-medium leading-snug text-slate-700 line-clamp-3">
              {note.cue_text || '暂无线索'}
            </div>
          </div>

          {/* Summary zone */}
          {note.summary_text && (
            <div className="bg-green-50 rounded-lg px-3.5 py-2.5 border border-green-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1 flex items-center gap-1">
                ✅ 总结
              </div>
              <div className="text-[12.5px] font-medium leading-snug text-green-800 line-clamp-2">
                {note.summary_text}
              </div>
            </div>
          )}
        </div>

        {/* Footer: category + tags */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1">
              {note.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
