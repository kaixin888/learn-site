import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('notes').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: '未找到' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { error } = await supabase.from('notes').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
