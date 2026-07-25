import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_VIDEOS = ['video/mp4'];
const ALLOWED_ASSETS = ['.rbxm', '.rbxl'];

export async function saveFile(file, type) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > MAX_SIZE) {
    throw new Error('File exceeds 25MB limit');
  }

  let ext;
  if (type === 'image') {
    if (!ALLOWED_IMAGES.includes(file.type)) {
      throw new Error('Invalid image format. Use PNG, JPEG, WebP, or GIF.');
    }
    ext = file.name.split('.').pop() || 'png';
  } else if (type === 'video') {
    if (!ALLOWED_VIDEOS.includes(file.type)) {
      throw new Error('Invalid video format. Only MP4 is allowed.');
    }
    ext = 'mp4';
  } else if (type === 'asset') {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.rbxm') && !name.endsWith('.rbxl')) {
      throw new Error('Invalid asset format. Only .rbxm and .rbxl files are allowed.');
    }
    ext = name.endsWith('.rbxm') ? 'rbxm' : 'rbxl';
  } else {
    throw new Error('Unknown file type');
  }

  const filename = `${randomUUID()}.${ext}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: file.type,
  });

  return blob.url;
}