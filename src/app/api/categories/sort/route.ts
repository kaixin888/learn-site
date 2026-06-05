import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// 批量更新排序: 传入 [{id, sort_order}] 数组
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const items: { id: string; sort_order: number }[] = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '需要传入排序数组' }, { status: 400 });
  }

  // 逐条更新（Supabase 不支持批量 upsert 不同值）
  const errors: string[] = [];
  for (const item of items) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);
    if (error) errors.push(`${item.id}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: '部分更新失败', details: errors }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
