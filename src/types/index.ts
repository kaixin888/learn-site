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
  sort_order?: number;
  created_at?: string;
  children: Category[];
}

export const DEFAULT_CATEGORIES: Category[] = [];
