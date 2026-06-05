'use client';
import type { Category } from '@/types';

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
      ? 'px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white shadow-sm'
      : 'px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200';

  const childBtn = (isActive: boolean) =>
    isActive
      ? 'px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700'
      : 'px-3 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 hover:bg-gray-100';

  return (
    <div className="space-y-2">
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
      {/* Row 2: children of active parent (only when a parent with children is selected) */}
      {activeParent && activeParent.children && activeParent.children.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            onClick={() => onChange(activeParent!.name)}
            className={childBtn(active === activeParent!.name)}
          >
            全部
          </button>
          {activeParent.children.map((child) => (
            <button
              key={child.id}
              onClick={() => onChange(child.name)}
              className={childBtn(active === child.name)}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
