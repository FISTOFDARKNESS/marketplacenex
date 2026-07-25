import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId: decoded.id, auth: subscription.keys?.auth || '', p256dh: subscription.keys?.p256dh || '' },
      create: {
        userId: decoded.id,
        endpoint: subscription.endpoint,
        auth: subscription.keys?.auth || '',
        p256dh: subscription.keys?.p256dh || '',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
