'use client';

export default function SearchBar({ onSearch, value }: { onSearch: (q: string) => void; value: string }) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" value={value} onChange={(e) => onSearch(e.target.value)} placeholder="搜索笔记..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
    </div>
  );
}
