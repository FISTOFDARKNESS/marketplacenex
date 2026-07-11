import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { checkUserOwnsGamepass, checkGamepassBought } from '@/lib/roblox';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const order = await prisma.depositOrder.findFirst({
      where: { id: orderId, userId: decoded.id, status: 'PENDING' },
    });
    if (!order) return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 });

    const adminCookie = process.env.ROBLOX_COOKIE;
    if (!adminCookie) return NextResponse.json({ error: 'Deposits not configured' }, { status: 500 });

    const passId = order.gamepassId?.toString();
    if (!passId) return NextResponse.json({ error: 'No gamepass linked to this order' }, { status: 400 });

    let bought = false;
    // Try to verify by checking if the specific user owns the gamepass
    if (order.robloxUserId) {
      bought = await checkUserOwnsGamepass(Number(order.robloxUserId), passId);
    }
    // Fallback: check if total sales increased
    if (!bought) {
      bought = await checkGamepassBought(adminCookie, passId);
    }

    if (!bought) {
      return NextResponse.json({ success: false, message: 'Purchase not detected yet' });
    }

    // Credit the user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.id },
        data: { balance: { increment: order.robuxAmount } },
      }),
      prisma.depositOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      }),
    ]);

    const updated = await prisma.user.findUnique({ where: { id: decoded.id }, select: { balance: true } });

    return NextResponse.json({
      success: true,
      deposited: order.robuxAmount,
      balance: updated.balance,
    });
  } catch (error) {
    console.error('Deposit verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
