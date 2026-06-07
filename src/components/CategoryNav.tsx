'use client';
import { useState, useEffect } from 'react';
import type { Category } from '@/types';

/**
 * 分类导航（树形）。
 *
 * 交互设计（借鉴 VSCode / Notion 侧边栏范式）：
 * - 每行分两个热区：左侧三角 = 仅展开/收起；行主体 = 选中该节点并筛选。
 * - 任意层级（顶层 / 中层 / 叶子）点击行主体都会筛选「该节点及其所有后代」的卡片，
 *   解决「点一级类目没反应」的问题。
 * - 选中项高亮；选中后自动展开其祖先路径。
 * - 每个节点显示聚合后的真实卡片数（含全部后代）。
 *
 * 选中标识用节点 id（`activeId`），而非类目名，从而支持非叶子节点选中。
 */

interface Props {
  activeId: string;            // 当前选中的节点 id（'' = 全部）
  onSelect: (node: Category | null) => void; // 选中节点（null = 全部）
  categories: Category[];
  counts: Map<string, number>; // 节点 id -> 聚合卡片数
  total: number;               // 全部笔记数
}

function Triangle({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function CategoryNav({ activeId, onSelect, categories, counts, total }: Props) {
  return (
    <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 max-h-[calc(100vh-180px)] overflow-y-auto select-none">
      {/* 全部笔记 */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold mb-1 transition-colors ${
          activeId === ''
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        全部笔记
        <span className={`ml-auto text-xs font-normal ${activeId === '' ? 'text-blue-100' : 'text-gray-400'}`}>
          {total}
        </span>
      </button>

      {categories.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          activeId={activeId}
          onSelect={onSelect}
          counts={counts}
        />
      ))}

      {categories.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">暂无分类</p>
      )}
    </nav>
  );
}

function TreeNode({
  node, depth, activeId, onSelect, counts,
}: {
  node: Category;
  depth: number;
  activeId: string;
  onSelect: (node: Category) => void;
  counts: Map<string, number>;
}) {
  const hasChildren = !!node.children && node.children.length > 0;
  const selected = activeId === node.id;
  const count = counts.get(node.id) ?? 0;

  // 选中项位于本节点子树内时，自动展开本节点
  const containsActive = hasChildren && subtreeIds(node).has(activeId);
  const [open, setOpen] = useState(depth === 0);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  // 不同层级的视觉权重
  const sizeCls =
    depth === 0 ? 'text-sm font-semibold' :
    depth === 1 ? 'text-[13px] font-medium' :
    'text-xs';

  return (
    <div>
      <div
        className={`group flex items-center rounded-lg transition-colors ${
          selected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: depth * 12 }}
      >
        {/* 展开/收起热区（仅有子节点时可点） */}
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? '收起' : '展开'}
            className="p-1.5 text-gray-400 hover:text-gray-700"
          >
            <Triangle open={open} />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        {/* 选中/筛选热区（占满剩余宽度） */}
        <button
          onClick={() => onSelect(node)}
          className={`flex-1 min-w-0 flex items-center gap-2 pr-2 py-1.5 text-left ${sizeCls} ${
            selected ? 'text-blue-700' : 'text-gray-700'
          }`}
        >
          <span className="truncate">{node.name}</span>
          <span className={`ml-auto text-[11px] font-normal shrink-0 ${
            selected ? 'text-blue-500' : 'text-gray-400'
          }`}>
            {count}
          </span>
        </button>
      </div>

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            open ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
              counts={counts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 收集一个节点子树内所有节点 id（含自身）。 */
function subtreeIds(node: Category): Set<string> {
  const ids = new Set<string>();
  const walk = (n: Category) => {
    ids.add(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return ids;
}
