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

    // Direct query by userId — should match what dashboard uses
    const orders = await prisma.order.findMany({
      where: { userId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch by robloxUser match if user has linked Roblox
    if (user?.robloxUsername) {
      const robloxOrders = await prisma.order.findMany({
        include: { item: true },
        orderBy: { createdAt: 'desc' },
      });
      const rName = user.robloxUsername.toLowerCase();
      const seen = new Set(orders.map(o => o.id));
      for (const o of robloxOrders) {
        if (!seen.has(o.id) && o.robloxUser && o.robloxUser.toLowerCase() === rName) {
          orders.push(o);
        }
      }
    }

    return NextResponse.json({ success: true, orders, debug: { userId: decoded.id, robloxUsername: user?.robloxUsername, ordersFound: orders.length } });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error', stack: error.message }, { status: 500 });
  }
}
