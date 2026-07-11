import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { configureWebPush, webpush } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    configureWebPush();

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: decoded.id },
    });

    if (!subs.length) {
      return NextResponse.json({ error: 'No push subscriptions found' }, { status: 400 });
    }

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
          JSON.stringify({
            title: 'NexBlox — Test Notification',
            body: 'This is a test push notification. Your alerts are working!',
            data: { test: true },
          })
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
