'use client';
import type { Note } from '@/types';

export default function CornellCard({ note, onClick }: { note: Note; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border-shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 min-h-[220px] flex flex-col">
      <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">{note.title}</h3>
      <div className="flex gap-3 flex-1 min-h-0">
        <div className="w-[35%] bg-blue-50 rounded-lg p-3 text-xs text-blue-800 leading-relaxed overflow-hidden">
          <div className="text-[10px] font-semibold text-blue-400 uppercase mb-1 tracking-wider">提示</div>
          <p className="line-clamp-4">{note.cue_text}</p>
        </div>
        <div className="w-[65%] bg-gray-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed overflow-hidden">
          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wider">笔记</div>
          <div className="prose prose-xs maw-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: note.content_html }} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {note.tags.slice(0,3).map((t:string) => (<span key={t} className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{t}</span>))}
            </div>
          )}
        </div>
        {note.summary_text && <p className="text-[11px] text-gray-400 line-clamp-1 italic">{note.summary_text}</p>}
      </div>
    </div>
  );
}
