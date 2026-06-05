export interface Note {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  cue_text: string;
  content_md: string;
  content_html: string;
  summary_text: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedCornell {
  title: string;
  cue: string;
  content: string;
  summary: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  children?: Category[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-1', name: '前端开发', parent_id: null, sort_order: 1, created_at: '' },
  { id: 'default-2', name: '后端开发', parent_id: null, sort_order: 2, created_at: '' },
  { id: 'default-3', name: '数据库', parent_id: null, sort_order: 3, created_at: '' },
  { id: 'default-4', name: 'DevOps', parent_id: null, sort_order: 4, created_at: '' },
  { id: 'default-5', name: 'AI / 机器学习', parent_id: null, sort_order: 5, created_at: '' },
  { id: 'default-6', name: '产品设计', parent_id: null, sort_order: 6, created_at: '' },
  { id: 'default-7', name: '项目管理', parent_id: null, sort_order: 7, created_at: '' },
  { id: 'default-8', name: '跨境电商', parent_id: null, sort_order: 8, created_at: '' },
  { id: 'default-9', name: '通用知识', parent_id: null, sort_order: 9, created_at: '' },
  { id: 'default-10', name: '其他', parent_id: null, sort_order: 10, created_at: '' },
];
