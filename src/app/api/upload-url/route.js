import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName') || 'file';
  const fileType = searchParams.get('fileType') || 'image/png';

  const ext = fileName.split('.').pop() || 'png';
  const filename = `${randomUUID()}.${ext}`;
  const filePath = `assets/${filename}`;

  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from('marketplace')
    .createSignedUrl(filePath, 60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    signedUrl: data.signedUrl,
    publicUrl: data.publicUrl,
  });
}