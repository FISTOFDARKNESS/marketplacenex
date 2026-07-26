import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const getPrefix = (fileType) => {
  if (fileType.startsWith('image/')) return 'thumbnail';
  if (fileType.startsWith('video/')) return 'video';
  return 'asset';
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName') || 'file';
  const fileType = searchParams.get('fileType') || 'image/png';
  const folderId = searchParams.get('folderId') || `${crypto.randomUUID()}_uploads`;

  const ext = fileName.split('.').pop() || 'png';
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().slice(0, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
  const prefix = getPrefix(fileType);
  const filename = `${prefix}_${timestamp}_${randomId}_${safeName}.${ext}`;
  const filePath = `${folderId}/${filename}`;

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
    folderId,
  });
}