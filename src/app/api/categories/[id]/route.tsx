import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { error } = await supabase.from('categories').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
  const { data, error } = await supabase.from('categories').update({ name: name.trim() }).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
