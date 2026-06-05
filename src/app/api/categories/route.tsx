import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { Category } from '@/types';

// 将扁平列表转为树形结构（一级分类 + children 二级分类）
function buildTree(cats: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];
  // 先全部放入 map
  for (const c of cats) {
    map.set(c.id, { ...c, children: [] });
  }
  // 再组装父子关系
  for (const c of cats) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  // 按 sort_order 排序（一级和各自的二级）
  roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  for (const r of roots) {
    r.children!.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  return roots;
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(buildTree(data || []));
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { name, parent_id } = await req.json();
  const trimmed = name?.trim();
  if (!trimmed) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });

  // 同级内检查重名
  const scope = parent_id ? { parent_id } : { parent_id: null };
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', trimmed)
    .eq('parent_id', scope.parent_id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: `同级分类「${trimmed}」已存在` }, { status: 409 });

  // 计算 sort_order：取同级最大值 + 1
  const { data: siblings } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('parent_id', scope.parent_id)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (siblings && siblings.length > 0 ? (siblings[0].sort_order || 0) : 0) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: trimmed, parent_id: parent_id || null, sort_order: nextOrder })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = getSupabase();
  const { id, name, sort_order, parent_id } = await req.json();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name.trim();
  if (sort_order !== undefined) update.sort_order = sort_order;
  if (parent_id !== undefined) update.parent_id = parent_id;

  const { data, error } = await supabase
    .from('categories')
    .update(update)
    .eq('id', id)
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  // 获取要删除的分类名
  const { data: cat } = await supabase.from('categories').select('name').eq('id', id).single();
  // 如果有子分类，禁止删除
  const { data: children } = await supabase.from('categories').select('id').eq('parent_id', id).limit(1);
  if (children && children.length > 0) {
    return NextResponse.json({ error: '请先删除该分类下的所有子分类' }, { status: 400 });
  }
  // 将该分类下的笔记归为"未分类"
  if (cat) {
    await supabase.from('notes').update({ category: '未分类' }).eq('category', cat.name);
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
