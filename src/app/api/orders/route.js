import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      if (decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      const orders = await prisma.order.findMany({
        include: { item: true, user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, orders });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, robloxUsername: true },
    });

    // 1. Orders by userId (recipient match)
    const orders = await prisma.order.findMany({
      where: { userId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // 2. Also include orders where robloxUser matches current user's linked Roblox
    if (user?.robloxUsername) {
      const rName = user.robloxUsername.toLowerCase();
      const robloxOrders = await prisma.order.findMany({
        where: { robloxUser: { equals: user.robloxUsername, mode: 'insensitive' } },
        include: { item: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const seen = new Set(orders.map(o => o.id));
      for (const ro of robloxOrders) {
        if (!seen.has(ro.id)) {
          orders.push(ro);
          seen.add(ro.id);
        }
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
