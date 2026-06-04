import { notFound } from "next/navigation";
import Link from "next/link";

export default async function NotePage({ params }: { params: { id: string } }) {
  let note;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(baseUrl + "/api/notes/" + params.id, { cache: "no-store" });
    if (!res.ok) notFound();
    note = await res.json();
  } catch { notFound(); }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
          &larr; 返回列表
        </Link>
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{note.category}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{note.title}</h1>
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-blue-50 border-r border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase">提示 / 问题</h2>
              <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.cue_text}</div>
            </div>
            <div className="w-full md:w-2/3 p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase">笔记 / 答案</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: note.content_html }} />
            </div>
          </div>
          {note.summary_text && (
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase">总结</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{note.summary_text}</p>
            </div>
          )}
          {note.tags && note.tags.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-3 flex flex-wrap gap-2">
              {note.tags.map((t:string) => <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{t}</span>)}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
