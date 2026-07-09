import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

    const body = await req.json();
    const { itemId, sellerId, robloxUser } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'item not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 });

    let markup = 0;
    if (sellerId) {
      const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
      if (seller) {
        markup = seller.markup;
      }
    }

    const baseUsdPrice = Number((item.rap * 0.0035).toFixed(2));
    const priceNum = Number((baseUsdPrice * (1 + markup)).toFixed(2));

    if (user.balance < priceNum) {
      return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
    }

    const robloxUsername = (robloxUser || '').trim().toLowerCase();
    if (!robloxUsername) {
      return NextResponse.json({ error: 'recipient roblox username is required' }, { status: 400 });
    }

    const allUsers = await prisma.user.findMany({ select: { id: true, robloxUsername: true } });
    const match = allUsers.find(u => u.robloxUsername?.toLowerCase() === robloxUsername);
    if (!match) {
      return NextResponse.json({ error: 'recipient is not a verified nexblox user' }, { status: 400 });
    }
    const recipientUserId = match.id;

    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
    const sellerUserId = adminUser?.id || user.id;

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: priceNum } },
      });

      if (updatedUser.balance < 0) {
        throw new Error('insufficient balance transaction check failed');
      }

      await tx.transaction.create({
        data: { buyerId: user.id, sellerId: sellerUserId, itemId: item.id, price: priceNum, status: 'PENDING' },
      });

      const order = await tx.order.create({
        data: { userId: recipientUserId, buyerId: user.id, itemId: item.id, robloxUser: robloxUsername, status: 'PENDING' },
      });

      return { newBalance: updatedUser.balance, orderId: order.id };
    });

    return NextResponse.json({ success: true, newBalance: result.newBalance, orderCreated: true, orderId: result.orderId });
  } catch (error) {
    console.error('buy item error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
