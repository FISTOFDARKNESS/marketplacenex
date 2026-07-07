import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'PENDING') return NextResponse.json({ error: 'Order already processed' }, { status: 400 });

    await prisma.$transaction([
      prisma.userItem.create({
        data: { userId: order.userId, itemId: order.itemId },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
