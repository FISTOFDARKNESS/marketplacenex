export function serializeItem({ robloxAssetId, rap, projected, hyped, rare, ...rest }) {
  return { ...rest, robloxAssetId: robloxAssetId.toString(), rap, projected, hyped, rare, usdPrice: (rap * 0.0035).toFixed(2) };
}

export function serializeItems(items) {
  return items.map(serializeItem);
}
