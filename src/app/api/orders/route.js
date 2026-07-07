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

    // Return orders where user is the recipient (same logic as dashboard)
    const orders = await prisma.order.findMany({
      where: { userId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
