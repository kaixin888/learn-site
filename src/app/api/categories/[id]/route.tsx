import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  // 获取要删除的分类名
  const { data: cat } = await supabase.from('categories').select('name').eq('id', params.id).single();
  // 检查是否有子分类
  const { data: children } = await supabase.from('categories').select('id').eq('parent_id', params.id).limit(1);
  if (children && children.length > 0) {
    return NextResponse.json({ error: '请先删除该分类下的所有子分类' }, { status: 400 });
  }
  // 将该分类下的笔记归为"未分类"
  if (cat) {
    await supabase.from('notes').update({ category: '未分类' }).eq('category', cat.name);
  }
  const { error } = await supabase.from('categories').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    update.name = trimmed;
  }
  if (body.sort_order !== undefined) update.sort_order = body.sort_order;
  if (body.parent_id !== undefined) update.parent_id = body.parent_id;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: '无更新字段' }, { status: 400 });
  const { data, error } = await supabase.from('categories').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
