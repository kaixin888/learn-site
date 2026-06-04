'use client';
import type { Category } from '@/types';

export default function CategoryNav({ active, onChange, categories }: { active: string; onChange: (c: string) => void; categories: Category[] }) {
  const btnStyle = (isActive: boolean) =>
    isActive
      ? 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-blue-600 text-white shadow-sm'
      : 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button onClick={() => onChange('')} className={btnStyle(active === '')}>全部</button>
      {categories.map((cat) => (
        <button key={cat.id} onClick={() => onChange(cat.name)} className={btnStyle(active === cat.name)}>{cat.name}</button>
      ))}
    </div>
  );
}
