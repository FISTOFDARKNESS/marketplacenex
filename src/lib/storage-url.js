const SUPABASE_BASE = 'yezbggqtthgrpjjvnlgd.supabase.co/storage/v1';

export function proxyUrl(url) {
  if (!url || !url.includes(SUPABASE_BASE)) return url;
  const path = url.split('/storage/v1/')[1];
  if (!path) return url;
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
