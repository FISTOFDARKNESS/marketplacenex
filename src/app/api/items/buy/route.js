import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { itemId, sellerId, price, robloxUser } = await req.json();
    if (!itemId || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.balance < price) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    let recipientUserId = decoded.id;
    let robloxUsername = robloxUser || '';

    if (robloxUser) {
      const recipient = await prisma.user.findFirst({
        where: { robloxUsername: { equals: robloxUser, mode: 'insensitive' } },
      });
      if (recipient) recipientUserId = recipient.id;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: price } },
      }),
      prisma.transaction.create({
        data: {
          buyerId: user.id,
          sellerId: sellerId || user.id,
          itemId: item.id,
          price,
          status: 'PENDING',
        },
      }),
      prisma.order.create({
        data: {
          userId: recipientUserId,
          itemId: item.id,
          robloxUser: robloxUsername,
          status: 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance: user.balance - price,
      orderCreated: true,
    });
  } catch (error) {
    console.error('Buy item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
