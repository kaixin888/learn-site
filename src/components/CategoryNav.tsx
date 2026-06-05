'use client';
import type { Category } from '@/types';

// Stable pastel palette — each child gets a color by index, deterministic
const CHILD_COLORS = [
  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200' },
  { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  { bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200' },
];

export default function CategoryNav({
  active,
  onChange,
  categories,
}: {
  active: string;
  onChange: (c: string) => void;
  categories: Category[];
}) {
  // Determine which parent is currently active
  let activeParent: Category | null = null;
  for (const cat of categories) {
    if (cat.name === active) { activeParent = cat; break; }
    if (cat.children) {
      for (const child of cat.children) {
        if (child.name === active) { activeParent = cat; break; }
      }
    }
    if (activeParent) break;
  }

  const parentBtn = (isActive: boolean) =>
    isActive
      ? 'px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-sm transition-colors'
      : 'px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors';

  return (
    <div className="space-y-3">
      {/* Row 1: parent categories */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={() => onChange('')} className={parentBtn(active === '')}>全部</button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.name)}
            className={parentBtn(activeParent?.id === cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Row 2: children of active parent */}
      {activeParent && activeParent.children && activeParent.children.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center pt-1 border-t border-gray-100">
          {/* "All" button for the parent scope */}
          <button
            onClick={() => onChange(activeParent!.name)}
            className={
              active === activeParent!.name
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm transition-colors'
                : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors'
            }
          >
            全部
          </button>
          {activeParent.children.map((child, idx) => {
            const color = CHILD_COLORS[idx % CHILD_COLORS.length];
            const isActive = active === child.name;
            return (
              <button
                key={child.id}
                onClick={() => onChange(child.name)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : `${color.bg} ${color.text} ${color.border} hover:opacity-80`,
                ].join(' ')}
              >
                {child.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
