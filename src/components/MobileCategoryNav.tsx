'use client';
import { useState, useEffect } from 'react';
import type { Category } from '@/types';

/**
 * 移动端分类导航 - 折叠式下拉。
 *
 * 行为：
 * - 默认折叠，显示一个按钮（显示当前选中分类名或「全部分类」）
 * - 点击按钮展开全屏遮罩层，内嵌完整树形导航
 * - 选中分类后自动关闭遮罩层
 */

interface Props {
  activeId: string;
  onSelect: (node: Category | null) => void;
  categories: Category[];
  counts: Map<string, number>;
  total: number;
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

/** 查找节点名称（按 id） */
function findNodeName(categories: Category[], id: string): string {
  for (const n of categories) {
    if (n.id === id) return n.name;
    if (n.children) {
      const r = findNodeName(n.children, id);
      if (r) return r;
    }
  }
  return '';
}

export default function MobileCategoryNav({ activeId, onSelect, categories, counts, total }: Props) {
  const [open, setOpen] = useState(false);

  // 当前选中分类标签
  const label = activeId ? findNodeName(categories, activeId) || '分类' : '全部分类';
  const activeCount = activeId ? (counts.get(activeId) ?? 0) : total;

  // 打开时禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleSelect(node: Category | null) {
    onSelect(node);
    setOpen(false);
  }

  return (
    <>
      {/* 触发按钮 - 仅 lg 以下显示 */}
      <div className="lg:hidden w-full mb-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm active:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 12h18M3 20h18" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activeCount}</span>
        </button>
      </div>

      {/* 遮罩 + 侧滑面板 */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* 半透明遮罩 */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          {/* 抽屉面板 - 从左侧滑入 */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl animate-slide-in-left overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">分类导航</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* 树形导航内容 */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* 全部笔记 */}
              <button
                onClick={() => handleSelect(null)}
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
                  onSelect={handleSelect}
                  counts={counts}
                />
              ))}

              {categories.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">暂无分类</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

  const containsActive = hasChildren && subtreeIds(node).has(activeId);
  const [open, setOpen] = useState(depth === 0);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

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
            open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
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

function subtreeIds(node: Category): Set<string> {
  const ids = new Set<string>();
  const walk = (n: Category) => {
    ids.add(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return ids;
}
