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

    const body = await req.json();
    const { itemId, price, robloxUser } = body;

    if (!itemId || price == null) {
      return NextResponse.json({ error: 'Missing required fields: ' + JSON.stringify({ itemId, price }) }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'Invalid price: ' + price }, { status: 400 });
    }

    if (user.balance < priceNum) {
      return NextResponse.json({ error: 'Insufficient balance. Have: ' + user.balance + ', Need: ' + priceNum }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found: ' + itemId }, { status: 404 });

    const robloxUsername = (robloxUser || '').trim().toLowerCase();
    if (!robloxUsername) {
      return NextResponse.json({ error: 'Recipient Roblox username is required' }, { status: 400 });
    }

    // Find recipient by Roblox username
    let recipientUserId = decoded.id;
    const allUsers = await prisma.user.findMany({ select: { id: true, robloxUsername: true } });
    const match = allUsers.find(u => u.robloxUsername?.toLowerCase() === robloxUsername);
    if (match) recipientUserId = match.id;

    // Find seller
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
    const sellerUserId = adminUser?.id || user.id;

    // Step 1: Deduct balance
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: priceNum } },
    });

    // Step 2: Create transaction
    const txn = await prisma.transaction.create({
      data: { buyerId: user.id, sellerId: sellerUserId, itemId: item.id, price: priceNum, status: 'PENDING' },
    });

    // Step 3: Create order
    const order = await prisma.order.create({
      data: { userId: recipientUserId, buyerId: user.id, itemId: item.id, robloxUser: robloxUsername, status: 'PENDING' },
    });

    return NextResponse.json({ success: true, newBalance: updatedUser.balance, orderCreated: true, orderId: order.id });
  } catch (error) {
    console.error('Buy item error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack, name: error.name }, { status: 500 });
  }
}
