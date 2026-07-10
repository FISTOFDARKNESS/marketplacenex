const { PrismaClient } = require('@prisma/client');

const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('pgbouncer', 'true');
const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });

const ROLIMONS_API = 'https://www.rolimons.com/itemapi/itemdetails';
const THUMBNAIL_API = 'https://thumbnails.roblox.com/v1/assets';
const BATCH_SIZE = 100;
const MAX_ITEMS = 9999;

function formatRap(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(value);
}

function rarityFromDemand(demand) {
  if (demand === 4) return 'legendary';
  if (demand === 3) return 'rare';
  if (demand === 2) return 'uncommon';
  return 'common';
}

async function fetchThumbnails(assetIds) {
  const urls = [];
  for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
    const batch = assetIds.slice(i, i + BATCH_SIZE);
    const url = `${THUMBNAIL_API}?assetIds=${batch.join(',')}&size=420x420&format=Png&isCircular=false`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Thumbnail API returned ${res.status} for batch ${i / BATCH_SIZE + 1}`);
        continue;
      }
      const data = await res.json();
      if (data.data) {
        for (const entry of data.data) {
          urls.push({ assetId: entry.targetId, img: entry.imageUrl });
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch thumbnails batch ${i / BATCH_SIZE + 1}:`, err.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return urls.map(u => ({ assetId: BigInt(u.assetId), img: u.img }));
}

async function main() {
  console.log('Fetching items from Rolimons API...');
  const res = await fetch(ROLIMONS_API);
  if (!res.ok) {
    console.error('Failed to fetch Rolimons API:', res.status, res.statusText);
    process.exit(1);
  }

  const data = await res.json();
  if (!data.success || !data.items) {
    console.error('Unexpected Rolimons response format');
    process.exit(1);
  }

  const entries = Object.entries(data.items)
    .sort(([, a], [, b]) => (b[2] || 0) - (a[2] || 0))
    .slice(0, MAX_ITEMS);

  console.log(`Found ${entries.length} items with value (limited to ${MAX_ITEMS})`);

  const mapped = entries.map(([assetId, item]) => ({
    assetId: BigInt(assetId),
    name: String(item[0] || 'Unknown'),
    rap: item[2] || 0,
    rapLabel: formatRap(item[2] || 0),
    price: item[3] > 0 ? item[3] : (item[2] || 0),
    demand: item[5] ?? -1,
    trend: item[6] ?? -1,
    rarity: rarityFromDemand(item[5] ?? -1),
  }));

  console.log('Fetching thumbnails from Roblox API...');
  const assetIds = mapped.map(m => m.assetId);
  const thumbnailUrls = await fetchThumbnails(assetIds);
  const thumbMap = new Map(thumbnailUrls.map(t => [t.assetId, t.img]));

  console.log('Seeding database...');
  for (const item of mapped) {
    await prisma.item.upsert({
      where: { robloxAssetId: item.assetId },
      update: {
        name: item.name,
        rap: item.rap,
        rapLabel: item.rapLabel,
        price: item.price,
        demand: item.demand,
        trend: item.trend,
        rarity: item.rarity,
        img: thumbMap.get(item.assetId) || '',
      },
      create: {
        robloxAssetId: item.assetId,
        name: item.name,
        category: 'limited',
        rarity: item.rarity,
        rap: item.rap,
        rapLabel: item.rapLabel,
        price: item.price,
        img: thumbMap.get(item.assetId) || '',
        size: '',
        demand: item.demand,
        trend: item.trend,
      },
    });
  }

  const total = await prisma.item.count();
  console.log(`Done! ${total} items in database`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
