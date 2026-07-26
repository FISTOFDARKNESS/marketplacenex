import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const uploadId = formData.get('uploadId');
    const chunkIndex = formData.get('chunkIndex');
    const file = formData.get('file');
    if (!uploadId || chunkIndex === null || !file) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const supabase = getSupabase();
    const chunkPath = `temp/${uploadId}/${chunkIndex}`;
    const { error } = await supabase.storage.from('marketplace').upload(chunkPath, file, { upsert: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
