import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { configureWebPush, webpush } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

const ROLIMONS_API = 'https://www.rolimons.com/itemapi/itemdetails';

async function fetchFreshPrices() {
  try {
    const res = await fetch(ROLIMONS_API, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.items) return null;
    const map = new Map();
    for (const [assetId, arr] of Object.entries(data.items)) {
      map.set(assetId, { rap: arr[2] || 0, price: arr[3] > 0 ? arr[3] : (arr[2] || 0) });
    }
    return map;
  } catch {
    return null;
  }
}

function buildMessage(item, reasons, lang = 'en') {
  const labels = {
    priceUp: lang === 'pt' ? 'preço subiu' : 'price went up',
    priceDown: lang === 'pt' ? 'preço caiu' : 'price dropped',
    rapUp: lang === 'pt' ? 'RAP subiu' : 'RAP went up',
    rapDown: lang === 'pt' ? 'RAP caiu' : 'RAP dropped',
  };
  const parts = reasons.map((r) => labels[r]).join(', ');
  return `${item.name}: ${parts} ($${item.price})`;
}

const COOLDOWN_MS = 86400000;

export async function POST(req) {
  try {
    const secret = req.headers.get('x-cron-secret');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    configureWebPush();

    const fresh = await fetchFreshPrices();

    const alerts = await prisma.priceAlert.findMany({
      where: { active: true },
      include: { item: true, user: { include: { pushSubscriptions: true } } },
    });

    let sent = 0;
    let refreshed = 0;
    let expired = 0;
    let skipped = 0;
    const staleSubs = [];

    for (const alert of alerts) {
      const item = alert.item;
      if (!item) continue;

      // Check duration expiration
      if (alert.duration && alert.duration > 0) {
        const expiresAt = new Date(alert.createdAt.getTime() + alert.duration * 86400000);
        if (expiresAt <= new Date()) {
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { active: false },
          }).catch(() => {});
          expired++;
          continue;
        }
      }

      // Cooldown: skip if notified within the last 24h
      if (alert.lastNotifiedAt) {
        const cooldownUntil = new Date(alert.lastNotifiedAt.getTime() + COOLDOWN_MS);
        if (cooldownUntil > new Date()) {
          skipped++;
          continue;
        }
      }

      // Prefer fresh Rolimons data; fall back to the DB row.
      const f = fresh?.get(item.robloxAssetId.toString());
      const curPrice = f ? f.price : item.price;
      const curRap = f ? f.rap : item.rap;

      const reasons = [];
      if (alert.lastPrice != null && curPrice !== alert.lastPrice) {
        if (curPrice > alert.lastPrice && alert.onPriceUp) reasons.push('priceUp');
        if (curPrice < alert.lastPrice && alert.onPriceDown) reasons.push('priceDown');
      }
      if (alert.lastRap != null && curRap !== alert.lastRap) {
        if (curRap > alert.lastRap && alert.onRapUp) reasons.push('rapUp');
        if (curRap < alert.lastRap && alert.onRapDown) reasons.push('rapDown');
      }

      // Always keep last values fresh so we only alert on real changes
      if (curPrice !== alert.lastPrice || curRap !== alert.lastRap) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastPrice: curPrice, lastRap: curRap },
        }).catch(() => {});
        refreshed++;
      }

      if (reasons.length === 0) continue;

      const subs = alert.user?.pushSubscriptions || [];
      const payload = JSON.stringify({
        title: 'NexBlox — Price Alert',
        body: buildMessage(item, reasons),
        data: { itemId: item.id, robloxAssetId: item.robloxAssetId.toString() },
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
            payload
          );
          sent++;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleSubs.push(sub.id);
          }
        }
      }

      // Update lastNotifiedAt after successful send
      if (sent > 0) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastNotifiedAt: new Date() },
        }).catch(() => {});
      }
    }

    if (staleSubs.length) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: staleSubs } } }).catch(() => {});
    }

    return NextResponse.json({ success: true, checked: alerts.length, refreshed, expired, skipped, sent });
  } catch (error) {
    console.error('Check prices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
