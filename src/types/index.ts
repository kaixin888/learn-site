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

export const CATEGORIES = [
  '前端开发', '后端开发', '数据库', 'DevOps',
  'AI / 机器学习', '产品设计', '项目管理',
  '跨境电商', '通用知识', '其他',
] as const;

export type Category = typeof CATEGORIES[number];
