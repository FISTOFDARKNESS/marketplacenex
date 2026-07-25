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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayOrders = await prisma.order.findMany({
      where: { userId: decoded.id, createdAt: { gte: todayStart } },
      include: { item: true },
    });

    const allOrders = await prisma.order.findMany({
      where: { userId: decoded.id },
      include: { item: true },
    });

    const ordersToday = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.item?.usdPrice || 0), 0);
    const totalProfit = allOrders.reduce((sum, o) => sum + (o.item?.usdPrice || 0), 0);

    const last12Days = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayOrders = allOrders.filter(o => {
        const c = new Date(o.createdAt);
        return c >= start && c < end;
      });
      const rev = dayOrders.reduce((sum, o) => sum + (o.item?.usdPrice || 0), 0);
      last12Days.push({ date: start.toISOString().slice(0, 10), revenue: rev });
    }

    const avgRevenue = last12Days.reduce((s, d) => s + d.revenue, 0) / Math.max(last12Days.length, 1);
    const peakRevenue = Math.max(...last12Days.map(d => d.revenue), 0);

    return NextResponse.json({
      success: true,
      user: { username: decoded.username },
      stats: { ordersToday, todayRevenue, totalProfit },
      revenue: { last12Days, avgRevenue, peakRevenue },
      notifications: [],
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
