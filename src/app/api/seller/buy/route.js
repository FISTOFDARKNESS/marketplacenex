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
    const { sellerItemId } = body;
    if (!sellerItemId) return NextResponse.json({ error: 'Seller item ID required' }, { status: 400 });

    const buyer = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, balance: true, robloxId: true, robloxUsername: true },
    });
    if (!buyer) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!buyer.robloxId) return NextResponse.json({ error: 'Verify your Roblox account first' }, { status: 400 });

    const sellerItem = await prisma.sellerItem.findUnique({
      where: { id: sellerItemId },
      include: { item: true, seller: true },
    });
    if (!sellerItem || !sellerItem.isActive) return NextResponse.json({ error: 'Item not available' }, { status: 404 });

    if (sellerItem.userId === decoded.id) {
      return NextResponse.json({ error: 'You cannot buy your own item' }, { status: 400 });
    }

    if (buyer.balance < sellerItem.priceUsd) {
      return NextResponse.json({ error: `Insufficient balance. Need $${sellerItem.priceUsd.toFixed(2)}` }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerItem.userId },
      select: { id: true, balance: true },
    });
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

    const [result] = await prisma.$transaction([
      prisma.user.update({ where: { id: buyer.id }, data: { balance: { decrement: sellerItem.priceUsd } } }),
      prisma.user.update({ where: { id: seller.id }, data: { balance: { increment: sellerItem.priceUsd } } }),
      prisma.userItem.create({
        data: { userId: buyer.id, itemId: sellerItem.itemId },
      }),
      prisma.sellerItem.update({ where: { id: sellerItem.id }, data: { isActive: false } }),
      prisma.transaction.create({
        data: {
          buyerId: buyer.id,
          sellerId: seller.id,
          itemId: sellerItem.itemId,
          price: sellerItem.priceUsd,
          status: 'COMPLETED',
        },
      }),
      prisma.order.create({
        data: {
          userId: buyer.id,
          buyerId: buyer.id,
          itemId: sellerItem.itemId,
          robloxUser: buyer.robloxUsername || 'unknown',
          status: 'COMPLETED',
        },
      }),
    ]);

    await prisma.sellerProfile.update({
      where: { id: sellerItem.sellerId },
      data: { totalSales: { increment: 1 } },
    });

    const totalVal = await prisma.sellerItem.aggregate({
      where: { sellerId: sellerItem.sellerId, isActive: true },
      _sum: { priceUsd: true },
    });
    await prisma.sellerProfile.update({
      where: { id: sellerItem.sellerId },
      data: { totalValue: totalVal._sum.priceUsd || 0 },
    });

    return NextResponse.json({
      success: true,
      message: 'Item purchased successfully!',
      newBalance: buyer.balance - sellerItem.priceUsd,
    });
  } catch (error) {
    console.error('Seller buy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
