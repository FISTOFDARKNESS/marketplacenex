import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const alerts = await prisma.priceAlert.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      include: { item: true },
    });

    const items = serializeItems(alerts.map((a) => a.item));
    const map = new Map(items.map((i) => [i.id, i]));

    const result = alerts.map((a) => ({
      id: a.id,
      item: map.get(a.itemId) || null,
      onPriceUp: a.onPriceUp,
      onPriceDown: a.onPriceDown,
      onRapUp: a.onRapUp,
      onRapDown: a.onRapDown,
      duration: a.duration,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, alerts: result });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { itemId, onPriceUp, onPriceDown, onRapUp, onRapDown, duration } = body;
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    // Unlimited alerts

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const dur = typeof duration === 'number' && duration > 0 ? duration : null;

    const alert = await prisma.priceAlert.upsert({
      where: { userId_itemId: { userId: decoded.id, itemId } },
      update: {
        onPriceUp: !!onPriceUp,
        onPriceDown: !!onPriceDown,
        onRapUp: !!onRapUp,
        onRapDown: !!onRapDown,
        duration: dur,
        active: true,
        lastPrice: item.price,
        lastRap: item.rap,
      },
      create: {
        userId: decoded.id,
        itemId,
        onPriceUp: !!onPriceUp,
        onPriceDown: !!onPriceDown,
        onRapUp: !!onRapUp,
        onRapDown: !!onRapDown,
        duration: dur,
        lastPrice: item.price,
        lastRap: item.rap,
      },
    });

    return NextResponse.json({ success: true, id: alert.id });
  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
