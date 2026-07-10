import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { configureWebPush, webpush } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

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

export async function POST(req) {
  try {
    const secret = req.headers.get('x-cron-secret');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    configureWebPush();

    const alerts = await prisma.priceAlert.findMany({
      where: { active: true },
      include: { item: true, user: { include: { pushSubscriptions: true } } },
    });

    let sent = 0;
    const staleSubs = [];

    for (const alert of alerts) {
      const item = alert.item;
      if (!item) continue;

      const reasons = [];
      if (alert.lastPrice != null && item.price !== alert.lastPrice) {
        if (item.price > alert.lastPrice && alert.onPriceUp) reasons.push('priceUp');
        if (item.price < alert.lastPrice && alert.onPriceDown) reasons.push('priceDown');
      }
      if (alert.lastRap != null && item.rap !== alert.lastRap) {
        if (item.rap > alert.lastRap && alert.onRapUp) reasons.push('rapUp');
        if (item.rap < alert.lastRap && alert.onRapDown) reasons.push('rapDown');
      }

      // Always keep last values fresh so we only alert on real changes
      if (item.price !== alert.lastPrice || item.rap !== alert.lastRap) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastPrice: item.price, lastRap: item.rap },
        }).catch(() => {});
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
    }

    if (staleSubs.length) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: staleSubs } } }).catch(() => {});
    }

    return NextResponse.json({ success: true, checked: alerts.length, sent });
  } catch (error) {
    console.error('Check prices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
