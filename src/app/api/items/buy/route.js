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

    const { itemId, price, robloxUser } = await req.json();
    if (!itemId || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.balance < price) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const robloxUsername = (robloxUser || '').trim().toLowerCase();

    let recipientUserId = decoded.id;
    if (robloxUsername) {
      const allUsers = await prisma.user.findMany({ select: { id: true, robloxUsername: true } });
      const match = allUsers.find(u => u.robloxUsername?.toLowerCase() === robloxUsername);
      if (match) recipientUserId = match.id;
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
    const sellerUserId = adminUser?.id || user.id;

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: price } } }),
      prisma.transaction.create({
        data: { buyerId: user.id, sellerId: sellerUserId, itemId: item.id, price, status: 'PENDING' },
      }),
      prisma.order.create({
        data: { userId: recipientUserId, itemId: item.id, robloxUser: robloxUsername, status: 'PENDING' },
      }),
    ]);

    return NextResponse.json({ success: true, newBalance: user.balance - price, orderCreated: true });
  } catch (error) {
    console.error('Buy item error:', error);
    return NextResponse.json({ error: 'Failed to process purchase. Please try again.' }, { status: 500 });
  }
}
