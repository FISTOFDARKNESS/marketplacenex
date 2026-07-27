import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.gif', '.svg', '.webm']);
const CACHE_MAX_AGE = 31536000;

export async function GET(req, { params }) {
  const { userId, assetId, filename } = params;

  if (!userId || !assetId || !filename) {
    return NextResponse.json({ error: 'Missing path parameters' }, { status: 400 });
  }

  const ext = '.' + filename.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 403 });
  }

  const filePath = `user_${userId}/asset_${assetId}/${filename}`;
  const bucket = 'marketplace';

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (error || !data) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileRes = await fetch(data.signedUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
