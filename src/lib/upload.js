import { getSupabase } from './supabase';
import { randomUUID } from 'crypto';

const MAX_SIZE_IMAGE = 5 * 1024 * 1024;
const MAX_SIZE_VIDEO = 20 * 1024 * 1024;
const MAX_SIZE_ASSET = 25 * 1024 * 1024;
const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_VIDEOS = ['video/mp4'];
const ALLOWED_ASSETS = ['.rbxm', '.rbxl', '.rbxmx'];

const SIZE_LIMITS = {
  image: MAX_SIZE_IMAGE,
  video: MAX_SIZE_VIDEO,
  asset: MAX_SIZE_ASSET,
};

const TYPE_CONFIG = {
  image: { prefix: 'thumbnail', maxSize: MAX_SIZE_IMAGE },
  video: { prefix: 'video', maxSize: MAX_SIZE_VIDEO },
  asset: { prefix: 'asset', maxSize: MAX_SIZE_ASSET },
};

export function getFileExtension(type, fileName) {
  if (type === 'image') {
    if (fileName.toLowerCase().endsWith('.jpg')) return 'jpg';
    return 'png';
  } else if (type === 'video') {
    return 'mp4';
  } else if (type === 'asset') {
    const ext = fileName.toLowerCase().split('.').pop();
    return ext;
  }
  return '';
}

function getTimestamp() {
  return Date.now();
}

function getRandomId() {
  return randomUUID().slice(0, 8);
}

export async function saveFile(file, type) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const cfg = TYPE_CONFIG[type];
  if (!cfg) throw new Error('Unknown file type');

  if (buffer.length > cfg.maxSize) {
    const mb = cfg.maxSize / (1024 * 1024);
    throw new Error(`File exceeds ${mb}MB limit`);
  }

  let prefix;
  if (type === 'image') {
    if (!ALLOWED_IMAGES.includes(file.type)) {
      throw new Error('Invalid image format. Use PNG, JPEG, or JPG.');
    }
    prefix = 'thumbnail';
  } else if (type === 'video') {
    if (!ALLOWED_VIDEOS.includes(file.type)) {
      throw new Error('Invalid video format. Only MP4 is allowed.');
    }
    prefix = 'video';
  } else if (type === 'asset') {
    const name = file.name.toLowerCase();
    if (!ALLOWED_ASSETS.some(a => name.endsWith(a))) {
      throw new Error('Invalid asset format. Only .rbxm, .rbxl, and .rbxmx files are allowed.');
    }
    prefix = 'asset';
  } else {
    throw new Error('Unknown file type');
  }

  const folderId = `${randomUUID()}_uploads`;
  const timestamp = getTimestamp();
  const randomId = getRandomId();
  const ext = file.name.split('.').pop() || getFileExtension(type, file.name);
  const filename = `${prefix}_${timestamp}_${randomId}.${ext}`;
  const filePath = `${folderId}/${filename}`;

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('marketplace')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from('marketplace')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function getPresignedUrl(fileName, fileType, folderId) {
  const ext = getFileExtension(fileType, fileName);
  const prefix = fileType.startsWith('image/') ? 'thumbnail' : fileType.startsWith('video/') ? 'video' : 'asset';
  const timestamp = Date.now();
  const randomId = randomUUID().slice(0, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
  const filename = `${prefix}_${timestamp}_${randomId}_${safeName}.${ext}`;
  const filePath = `${folderId}/${filename}`;

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('marketplace')
    .createSignedUploadUrl(filePath);

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from('marketplace')
    .getPublicUrl(filePath);

  return { signedUrl: data.signedUrl, publicUrl: urlData.publicUrl };
}