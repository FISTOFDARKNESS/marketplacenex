import { supabase } from './supabase';
import { randomUUID } from 'crypto';

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
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
      throw new Error('Invalid image format. Use PNG, JPEG, JPG, WebP, or GIF.');
    }
    ext = file.name.split('.').pop() || 'png';
  } else if (type === 'video') {
    if (!ALLOWED_VIDEOS.includes(file.type)) {
      throw new Error('Invalid video format. Only MP4 is allowed.');
    }
    ext = 'mp4';
  } else if (type === 'asset') {
    const name = file.name.toLowerCase();
    if (!ALLOWED_ASSETS.some(ext => name.endsWith(ext))) {
      throw new Error('Invalid asset format. Only .rbxm and .rbxl files are allowed.');
    }
    ext = name.endsWith('.rbxm') ? 'rbxm' : 'rbxl';
  } else {

  const filename = `${randomUUID()}.${ext}`;
  const filePath = `assets/${filename}`;

  const { data, error } = await supabase.storage
    .from('assets')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from('assets')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}