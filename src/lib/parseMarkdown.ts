import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import type { ParsedCornell } from '@/types';

// 标题行：支持 # / ## 一级或二级，无 emoji/有 emoji 均可
const TITLE_RE = /^#{1,2}\s+(.+)$/;

// 区块标题：支持 ## 或 ### 两到三级，关键词覆盖康奈尔三栏的常见别名
// 线索栏 = cue（提示/问题/线索/提问）
// 笔记栏 = content（笔记/内容/核心/正文）
// 总结栏 = summary（总结/小结/口诀）
const SECTION_PATTERNS: { re: RegExp; section: 'cue' | 'content' | 'summary' }[] = [
  { re: /^#{2,3}\s*.*(线索栏|提示|问题|提问|Cue)/i, section: 'cue' },
  { re: /^#{2,3}\s*.*(笔记栏|笔记|内容|核心|正文|Notes)/i, section: 'content' },
  { re: /^#{2,3}\s*.*(总结栏|总结|小结|口诀|Summary)/i, section: 'summary' },
];

export function parseCornellMarkdown(md: string): ParsedCornell {
  const lines = md.trim().split('\n');
  let title = '';
  let cue = '';
  let content = '';
  let summary = '';
  let section: 'none' | 'cue' | 'content' | 'summary' = 'none';
  let sawSection = false;

  for (const line of lines) {
    // 仅当还没拿到标题、且当前行是一/二级标题且不是任何区块标题时，作为笔记标题
    if (!title && TITLE_RE.test(line) && !SECTION_PATTERNS.some(p => p.re.test(line))) {
      title = line.replace(/^#{1,2}\s+/, '').trim();
      continue;
    }

    const matched = SECTION_PATTERNS.find(p => p.re.test(line));
    if (matched) {
      section = matched.section;
      sawSection = true;
      continue;
    }

    // 其他 ## / ### 标题，归入正文（保留原行，便于 Markdown 渲染层级）
    if (/^#{2,3}\s+/.test(line)) {
      section = section === 'none' ? 'content' : section;
      if (section === 'cue') cue += line + '\n';
      else if (section === 'summary') summary += line + '\n';
      else content += line + '\n';
      continue;
    }

    if (section === 'cue') cue += line + '\n';
    else if (section === 'content') content += line + '\n';
    else if (section === 'summary') summary += line + '\n';
    else if (section === 'none' && line.trim()) content += line + '\n';
  }

  // 完全没识别到任何区块：把除标题外的全部内容作为正文兜底
  if (!sawSection && !content.trim() && !cue.trim() && !summary.trim()) {
    content = md.replace(TITLE_RE, '').trim();
  }

  // 标题兜底：取正文/线索的首行非空文本，最长 40 字
  if (!title) {
    const firstLine = (cue || content || md)
      .split('\n')
      .map(l => l.replace(/^[#>\-*\s]+/, '').trim())
      .find(l => l.length > 0);
    title = firstLine ? firstLine.slice(0, 40) : '未命名笔记';
  }

  return {
    title,
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
