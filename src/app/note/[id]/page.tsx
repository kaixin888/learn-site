import { notFound } from "next/navigation";
import Link from "next/link";

export default async function NotePage({ params }: { params: { id: string } }) {
  let note;
  try {
    // Use Supabase directly in server component to avoid self-fetch issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('notes').select('*').eq('id', params.id).single();
    if (error || !data) notFound();
    note = data;
  } catch { notFound(); }

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
            <div className="md:w-[35%] bg-slate-50 p-6 md:pr-5 border-b md:border-b-0 md:border-r border-dashed border-gray-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                🔍 线索栏
              </div>
              <div className="text-[14px] font-medium leading-relaxed text-slate-800 whitespace-pre-wrap">
                {note.cue_text || '暂无线索'}
              </div>
            </div>

            {/* Right: Note zone — use pre-rendered HTML */}
            <div className="md:w-[65%] bg-white p-6 md:pl-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                📝 笔记栏
              </div>
              {note.content_html ? (
                <div
                  className="prose prose-sm max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-li:leading-relaxed prose-strong:text-slate-800 prose-headings:text-slate-700 prose-headings:font-bold prose-ul:list-disc prose-ul:pl-5"
                  dangerouslySetInnerHTML={{ __html: note.content_html }}
                />
              ) : (
                <div className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {note.content_md || '暂无笔记内容'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Summary zone */}
          {note.summary_text && (
            <div className="bg-green-50 border-t border-green-200 px-8 py-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-2.5">
                ✅ 总结栏
              </div>
              <div className="text-[13.5px] font-medium leading-snug text-green-800 whitespace-pre-wrap">
                {note.summary_text}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
