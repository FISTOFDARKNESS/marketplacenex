export function serializeItem({ robloxAssetId, rap, ...rest }) {
  return { ...rest, robloxAssetId: robloxAssetId.toString(), rap, usdPrice: (rap * 0.0035).toFixed(2) };
}

export function serializeItems(items) {
  return items.map(serializeItem);
}
