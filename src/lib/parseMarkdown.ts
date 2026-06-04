import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import type { ParsedCornell } from '@/types';

export function parseCornellMarkdown(md: string): ParsedCornell {
  const lines = md.trim().split('\n');
  let title = '';
  let cue = '';
  let content = '';
  let summary = '';
  let section: 'none' | 'cue' | 'content' | 'summary' = 'none';

  for (const line of lines) {
    if (/^#\s+/.test(line)) { title = line.replace(/^#\s+/, '').trim(); continue; }
    if (/^##\s*提示/i.test(line) || /^##\s*Cue/i.test(line) || /^##\s*问题/i.test(line)) { section = 'cue'; continue; }
    if (/^##\s*笔记/i.test(line) || /^##\s*内容/i.test(line) || /^##\s*Notes/i.test(line)) { section = 'content'; continue; }
    if (/^##\s*总结/i.test(line) || /^##\s*Summary/i.test(line)) { section = 'summary'; continue; }
    if (/^##\s+/.test(line)) { section = 'content'; content += line + '\n'; continue; }
    if (section === 'cue') cue += line + '\n';
    else if (section === 'content') content += line + '\n';
    else if (section === 'summary') summary += line + '\n';
    else if (section === 'none' && line.trim()) content += line + '\n';
  }

  if (!content.trim() && !cue.trim() && !summary.trim()) {
    content = md.replace(/^#\s+.*$/m, '').trim();
  }

  return {
    title: title || '未命名笔记',
    cue: cue.trim(),
    content: content.trim(),
    summary: summary.trim(),
  };
}

export async function renderMarkdown(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(remarkHtml).process(md);
  return result.toString();
}

export function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base + '-' + Date.now().toString(36);
}
