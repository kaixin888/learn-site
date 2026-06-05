'use client';
import Link from 'next/link';
import type { Note } from '@/types';

export default function CornellCard({ note }: { note: Note }) {
  // Parse note content into blocks (numbered sections with bullet points)
  function parseNoteBlocks(content: string): { title: string; items: string[] }[] {
    const blocks: { title: string; items: string[] }[] = [];
    const lines = content.split('\n');
    let currentBlock: { title: string; items: string[] } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Numbered heading: "1. xxx" or "2. xxx"
      const headingMatch = trimmed.match(/^(\d+\.\s*)(.+)$/);
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { title: headingMatch[2].trim(), items: [] };
        continue;
      }

      // Bullet item: "- xxx" or "* xxx"
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch && currentBlock) {
        currentBlock.items.push(bulletMatch[1].trim());
        continue;
      }

      // Plain text line — treat as a standalone item if no current block
      if (!currentBlock) {
        currentBlock = { title: '', items: [] };
      }
      currentBlock.items.push(trimmed);
    }
    if (currentBlock) blocks.push(currentBlock);

    // Fallback: if no structured blocks found, put all lines as one block
    if (blocks.length === 0 && content.trim()) {
      blocks.push({ title: '', items: content.split('\n').map(l => l.trim()).filter(Boolean) });
    }
    return blocks;
  }

  // Render inline bold markers
  function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  const noteBlocks = parseNoteBlocks(note.content_md || note.content_html || '');

  return (
    <Link href={`/note/${note.slug}`} className="block group">
      <article className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Main body: left cue + right note, flex equal-height */}
        <div className="flex flex-col md:flex-row min-h-[200px]">
          {/* Left: Cue zone (35%) */}
          <div className="md:w-[35%] bg-slate-50 p-5 md:pr-4 border-b md:border-b-0 md:border-r border-dashed border-gray-200 flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
              🔍 线索栏
            </div>
            <div className="text-[13.5px] font-semibold leading-snug text-slate-800">
              {note.cue_text || '暂无线索'}
            </div>
          </div>

          {/* Right: Note zone (65%) */}
          <div className="md:w-[65%] bg-white p-5 md:pl-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
              📝 笔记栏
            </div>
            {noteBlocks.length > 0 ? (
              <div className="space-y-4">
                {noteBlocks.map((block, idx) => (
                  <div key={idx}>
                    {block.title && (
                      <div className="text-[14px] font-bold text-slate-700 mb-2">{block.title}</div>
                    )}
                    <ul className="list-none space-y-1.5">
                      {block.items.map((item, iIdx) => (
                        <li key={iIdx} className="text-[13px] text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-sky-400 before:font-bold before:text-base before:-top-px">
                          {renderInline(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-wrap">
                {(note.content_md || note.content_html || '').slice(0, 300)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Summary zone */}
        {note.summary_text && (
          <div className="bg-green-50 border-t border-green-200 px-6 py-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-2 flex items-center gap-1">
              ✅ 总结栏
            </div>
            <div className="text-[13px] font-semibold leading-snug text-green-800">
              {note.summary_text}
            </div>
          </div>
        )}

        {/* Footer: category + tags */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1.5">
              {note.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
