import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const MAX_SIZE_IMAGE = 5 * 1024 * 1024;
const MAX_SIZE_VIDEO = 20 * 1024 * 1024;
const MAX_SIZE_ASSET = 25 * 1024 * 1024;
const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_VIDEOS = ['video/mp4'];
const ALLOWED_ASSETS = ['.rbxm', '.rbxl', '.rbxmx'];

const SIZE_LIMITS = { image: MAX_SIZE_IMAGE, video: MAX_SIZE_VIDEO, asset: MAX_SIZE_ASSET };

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { uploadId, type, fileName, fileType, totalChunks } = await req.json();
    if (!uploadId || !type || !fileName || totalChunks === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    const maxSize = SIZE_LIMITS[type];
    const prefix = type === 'image' ? 'thumbnail' : type === 'video' ? 'video' : 'asset';

    if (type === 'image' && !ALLOWED_IMAGES.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    if (type === 'video' && !ALLOWED_VIDEOS.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid video format' }, { status: 400 });
    }
    if (type === 'asset') {
      const name = fileName.toLowerCase();
      if (!ALLOWED_ASSETS.some(a => name.endsWith(a))) {
        return NextResponse.json({ error: 'Invalid asset format' }, { status: 400 });
      }
    }

    const ext = fileName.split('.').pop() || 'png';
    const folderId = `${crypto.randomUUID()}_uploads`;
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const finalFilename = `${prefix}_${timestamp}_${randomId}.${ext}`;
    const finalPath = `${folderId}/${finalFilename}`;

    const chunks = [];
    let totalSize = 0;
    for (let i = 0; i < totalChunks; i++) {
      const { data, error } = await supabase.storage.from('marketplace').download(`temp/${uploadId}/${i}`);
      if (error) return NextResponse.json({ error: `Failed to read chunk ${i}` }, { status: 500 });
      const buffer = Buffer.from(await data.arrayBuffer());
      totalSize += buffer.length;
      if (maxSize && totalSize > maxSize) {
        return NextResponse.json({ error: `File exceeds ${maxSize / (1024 * 1024)}MB limit` }, { status: 400 });
      }
      chunks.push(buffer);
    }

    const finalBuffer = Buffer.concat(chunks);

    const { error: uploadError } = await supabase.storage.from('marketplace').upload(finalPath, finalBuffer, {
      contentType: fileType || 'application/octet-stream',
      upsert: false,
    });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    for (let i = 0; i < totalChunks; i++) {
      await supabase.storage.from('marketplace').remove([`temp/${uploadId}/${i}`]);
    }

    const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(finalPath);

    return NextResponse.json({ success: true, url: urlData.publicUrl, folderId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
