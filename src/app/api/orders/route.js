import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { serializeItem } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    function serialize(o) {
      return { ...o, item: o.item ? serializeItem(o.item) : o.item };
    }

    if (all) {
      if (decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      const orders = await prisma.order.findMany({
        include: { item: true, user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, orders: orders.map(serialize) });
    }

    // Only show orders where the current user is the BUYER (their Gmail-linked account)
    const orders = await prisma.order.findMany({
      where: { buyerId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders: orders.map(serialize) });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
