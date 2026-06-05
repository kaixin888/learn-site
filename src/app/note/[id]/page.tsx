import { notFound } from "next/navigation";
import Link from "next/link";

function renderInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>');
}

function parseNoteBlocks(content: string): { title: string; items: string[] }[] {
  const blocks: { title: string; items: string[] }[] = [];
  const lines = content.split('\n');
  let currentBlock: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(\d+\.\s*)(.+)$/);
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { title: headingMatch[2].trim(), items: [] };
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && currentBlock) {
      currentBlock.items.push(bulletMatch[1].trim());
      continue;
    }

    if (!currentBlock) {
      currentBlock = { title: '', items: [] };
    }
    currentBlock.items.push(trimmed);
  }
  if (currentBlock) blocks.push(currentBlock);

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ title: '', items: content.split('\n').map(l => l.trim()).filter(Boolean) });
  }
  return blocks;
}

export default async function NotePage({ params }: { params: { id: string } }) {
  let note;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(baseUrl + "/api/notes/" + params.id, { cache: "no-store" });
    if (!res.ok) notFound();
    note = await res.json();
  } catch { notFound(); }

  const noteBlocks = parseNoteBlocks(note.content_md || note.content_html || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
          ← 返回列表
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{note.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6 text-xs text-gray-400">
          <span>{note.category}</span>
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1.5">
              {note.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
              ))}
            </div>
          )}
          <span>{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
        </div>

        {/* Cornell Card */}
        <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Main body */}
          <div className="flex flex-col md:flex-row min-h-[240px]">
            {/* Left: Cue zone */}
            <div className="md:w-[35%] bg-slate-50 p-6 md:pr-5 border-b md:border-b-0 md:border-r border-dashed border-gray-200 flex flex-col">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                🔍 线索栏 (提问自测)
              </div>
              <div className="text-[14px] font-semibold leading-snug text-slate-800 whitespace-pre-wrap">
                {note.cue_text || '暂无线索'}
              </div>
            </div>

            {/* Right: Note zone */}
            <div className="md:w-[65%] bg-white p-6 md:pl-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                📝 笔记栏 (核心知识点)
              </div>
              {noteBlocks.length > 0 ? (
                <div className="space-y-5">
                  {noteBlocks.map((block, idx) => (
                    <div key={idx}>
                      {block.title && (
                        <div className="text-[15px] font-bold text-slate-700 mb-2.5">{block.title}</div>
                      )}
                      <ul className="list-none space-y-2">
                        {block.items.map((item: string, iIdx: number) => (
                          <li key={iIdx} className="text-[13.5px] text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-sky-400 before:font-bold before:text-base before:-top-px"
                            dangerouslySetInnerHTML={{ __html: renderInline(item) }}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {note.content_md || note.content_html || '暂无笔记内容'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Summary zone */}
          {note.summary_text && (
            <div className="bg-green-50 border-t border-green-200 px-8 py-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-2.5 flex items-center gap-1">
                ✅ 总结栏 (精简口诀)
              </div>
              <div className="text-[13.5px] font-semibold leading-snug text-green-800 whitespace-pre-wrap">
                {note.summary_text}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
