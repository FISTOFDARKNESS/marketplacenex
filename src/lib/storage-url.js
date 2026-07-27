const SUPABASE_BASE = 'yezbggqtthgrpjjvnlgd.supabase.co/storage/v1';

export function proxyUrl(url) {
  if (!url || !url.includes(SUPABASE_BASE)) return url;
  const path = url.split('/storage/v1/')[1];
  if (!path) return url;
  const parts = path.split('/');
  // Path: object/public/marketplace/user_<userId>/asset_<assetId>/<filename>
  // Skip 'object', 'public', 'marketplace' (bucket name)
  if (parts.length < 6) return url;
  const userId = parts[3].replace('user_', '');
  const assetId = parts[4].replace('asset_', '');
  const filename = parts.slice(5).join('/');
  if (!userId || !assetId || !filename) return url;
  return `/api/storage/media/${userId}/${assetId}/${filename}`;
}

export function getProxiedUploadUrl(signedUrl) {
  if (!signedUrl || !signedUrl.includes(SUPABASE_BASE)) return signedUrl;
  const path = signedUrl.split('/storage/v1/')[1];
  if (!path) return signedUrl;
  return `/supabase/${path}`;
}

export function proxyAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    thumbnailUrl: proxyUrl(asset.thumbnailUrl),
    videoUrl: proxyUrl(asset.videoUrl),
    assetFileUrl: proxyUrl(asset.assetFileUrl),
  };
}
