'use client';
import { useState, useEffect, useCallback } from 'react';
import { type Note } from '@/types';

interface Props {
  note: Note;
  prevNote: Note | null;
  nextNote: Note | null;
  onPrev: () => void;
  onNext: () => void;
  onCategoryClick: (cat: string) => void;
}

export default function NoteDetail({ note, prevNote, nextNote, onPrev, onNext, onCategoryClick }: Props) {
  const [animating, setAnimating] = useState<'none' | 'left' | 'right'>('none');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { onPrev(); }
    else if (e.key === 'ArrowRight') { onNext(); }
  }, [onPrev, onNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 卡片切换动效重置
  useEffect(() => {
    setAnimating('none');
  }, [note.id]);

  function goNext() {
    if (nextNote && nextNote.category !== note.category) {
      setAnimating('right');
      setTimeout(() => { onNext(); setAnimating('none'); }, 180);
    } else {
      onNext();
    }
  }

  function goPrev() {
    if (prevNote && prevNote.category !== note.category) {
      setAnimating('left');
      setTimeout(() => { onPrev(); setAnimating('none'); }, 180);
    } else {
      onPrev();
    }
  }

  const isFirst = !prevNote;
  const isLast = !nextNote;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* 顶部导航条 */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
            isFirst
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm active:scale-95'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一张
        </button>

        <button
          onClick={() => onCategoryClick(note.category)}
          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors font-medium"
          title={`查看「${note.category}」全部笔记`}
        >
          {note.category}
        </button>

        <button
          onClick={goNext}
          disabled={isLast}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
            isLast
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm active:scale-95'
          }`}
        >
          下一张
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="text-xs text-gray-400 ml-auto">键盘 ← → 也可切换</span>
      </div>

      {/* 跨分类提示条 */}
      {(prevNote && prevNote.category !== note.category) && (
        <div className="max-w-4xl mx-auto mb-4 text-center">
          <span className={`inline-block text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full animate-fade-in ${
            animating === 'left' ? 'animate-slide-out-left' : ''
          }`}>
            上一分类：{prevNote.category}
          </span>
        </div>
      )}
      {(nextNote && nextNote.category !== note.category) && (
        <div className="max-w-4xl mx-auto mb-4 text-center">
          <span className={`inline-block text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full animate-fade-in ${
            animating === 'right' ? 'animate-slide-out-right' : ''
          }`}>
            下一分类：{nextNote.category}
          </span>
        </div>
      )}

      {/* 卡片内容 */}
      <article
        key={note.id}
        className={`max-w-4xl mx-auto transition-all duration-200 ${
          animating === 'left' ? 'animate-slide-in-left' : animating === 'right' ? 'animate-slide-in-right' : ''
        }`}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{note.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {note.tags && note.tags.map((t: string) => (
                <span key={t} className="text-[11px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(note.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            <div className="md:w-[30%] bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3">提示</h3>
              <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{note.cue_text}</div>
            </div>
            <div className="md:w-[70%] p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">笔记</h3>
              <div
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: note.content_html }}
              />
            </div>
          </div>

          {note.summary_text && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">总结</h3>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {note.summary_text}
              </div>
            </div>
          )}
        </div>

        {/* 底部切换按钮 */}
        <div className="flex justify-between items-center mt-6 max-w-4xl">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isFirst
                ? 'text-gray-300 cursor-not-allowed'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-95'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {prevNote ? prevNote.title.slice(0, 20) + (prevNote.title.length > 20 ? '...' : '') : '没有了'}
          </button>

          <button
            onClick={goNext}
            disabled={isLast}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isLast
                ? 'text-gray-300 cursor-not-allowed'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-95'
            }`}
          >
            {nextNote ? nextNote.title.slice(0, 20) + (nextNote.title.length > 20 ? '...' : '') : '没有了'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </article>
    </div>
  );
}
