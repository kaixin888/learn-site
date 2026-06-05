import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// DELETE: 删除重复分类，保留每个名称最早创建的那条
export async function DELETE() {
  const supabase = getSupabase();

  // 查所有分类
  const { data: all, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!all || all.length === 0) return NextResponse.json({ deleted: 0 });

  // 找出重复的：同 name 保留第一条，其余删除
  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const cat of all) {
    if (seen.has(cat.name)) {
      toDelete.push(cat.id);
    } else {
      seen.add(cat.name);
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0, message: '没有重复分类' });
  }

  const { error: delErr } = await supabase.from('categories').delete().in('id', toDelete);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ deleted: toDelete.length });
}
