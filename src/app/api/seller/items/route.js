import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ROBUX_TO_USD = 0.0035;

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const items = await prisma.sellerItem.findMany({
      where: { userId: decoded.id, isActive: true },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Seller items GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { itemId, priceRobux } = body;

    if (!itemId || !priceRobux || priceRobux < 1) {
      return NextResponse.json({ error: 'Item ID and price required (min 1 Robux)' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    let profile = await prisma.sellerProfile.findUnique({ where: { userId: decoded.id } });
    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: { userId: decoded.id },
      });
    }

    const existing = await prisma.sellerItem.findFirst({
      where: { userId: decoded.id, itemId, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'You already have this item listed for sale' }, { status: 409 });
    }

    const priceUsd = Math.round(priceRobux * ROBUX_TO_USD * 100) / 100;

    const sellerItem = await prisma.sellerItem.create({
      data: {
        sellerId: profile.id,
        userId: decoded.id,
        itemId,
        priceRobux,
        priceUsd,
        isActive: true,
      },
      include: { item: true },
    });

    const activeItems = await prisma.sellerItem.count({ where: { sellerId: profile.id, isActive: true } });
    const totalVal = await prisma.sellerItem.aggregate({
      where: { sellerId: profile.id, isActive: true },
      _sum: { priceUsd: true },
    });
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { totalValue: totalVal._sum.priceUsd || 0 },
    });

    return NextResponse.json({ success: true, item: sellerItem }, { status: 201 });
  } catch (error) {
    console.error('Seller items POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
