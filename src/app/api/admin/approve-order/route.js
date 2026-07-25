import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('admin-approve-' + ip, 30, 60000);
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

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

    logAudit({ action: 'admin.order.approve', userId: decoded.id, target: orderId, req, meta: { buyerId: order.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
