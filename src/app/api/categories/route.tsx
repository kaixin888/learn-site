import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 去重：同名分类保留最早创建的
  const seen = new Set<string>();
  const unique = (data || []).filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return NextResponse.json(unique);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { name } = await req.json();
  const trimmed = name?.trim();
  if (!trimmed) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });

  // 检查是否已存在同名分类
  const { data: existing } = await supabase.from('categories').select('id').eq('name', trimmed).maybeSingle();
  if (existing) return NextResponse.json({ error: `分类「${trimmed}」已存在` }, { status: 409 });

  const { data, error } = await supabase.from('categories').insert({ name: trimmed }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
