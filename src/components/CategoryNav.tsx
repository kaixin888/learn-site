'use client';
import { useState } from 'react';
import type { Category } from '@/types';

interface Props {
  active: string;
  onChange: (c: string) => void;
  categories: Category[];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function CategoryNav({ active, onChange, categories }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 max-h-[calc(100vh-180px)] overflow-y-auto">
      <button
        onClick={() => onChange('')}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-2 transition-all duration-200 ${
          active === ''
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        全部笔记
      </button>

      {categories.map((top) => (
        <TopGroup key={top.id} top={top} active={active} onChange={onChange} />
      ))}

      {categories.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">暂无分类</p>
      )}
    </div>
  );
}

function TopGroup({ top, active, onChange }: { top: Category; active: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
      >
        <Chevron open={open} />
        {top.name}
        <span className="ml-auto text-[10px] text-gray-400 font-normal">
          {top.children?.length || 0}类
        </span>
      </button>

      {open && top.children && (
        <div className="ml-3 border-l-2 border-gray-100 pl-2">
          {top.children.map((l1) => (
            <L1Group key={l1.id} l1={l1} active={active} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function L1Group({ l1, active, onChange }: { l1: Category; active: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);

  const isActive = l1.children?.some((l2) => l2.name === active);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${
          isActive ? 'text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Chevron open={open} />
        <span className="truncate">{l1.name}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-4 border-l border-gray-100 pl-2 py-0.5">
          {l1.children?.map((l2) => (
            <button
              key={l2.id}
              onClick={() => onChange(l2.name)}
              className={`w-full text-left px-2 py-1 rounded text-[11px] transition-all duration-200 ${
                active === l2.name
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l2.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
