import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseCornellMarkdown, renderMarkdown, generateSlug } from '@/lib/parseMarkdown';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const cat = searchParams.get('category') || '';
  let query = supabase.from('notes').select('*').order('created_at', { ascending: false });
  if (cat) query = query.eq('category', cat);
  if (q) query = query.or('title.ilike.%' + q + '%,cue_text.ilike.%' + q + '%,summary_text.ilike.%' + q + '%');
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();
  const { title, content_md, category, tags } = body;
  if (!content_md || !category) {
    return NextResponse.json({ error: 'content_md 和 category 为必填项' }, { status: 400 });
  }
  const parsed = parseCornellMarkdown(content_md);
  const content_html = await renderMarkdown(parsed.content);
    const slug = generateSlug();
  const { data, error } = await supabase.from('notes').insert({
    title: title || parsed.title,
    slug,
    category,
    tags: tags || [],
    cue_text: parsed.cue,
    content_md,
    content_html,
    summary_text: parsed.summary,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
