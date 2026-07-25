import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { username } = params;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { robloxUsername: { equals: username, mode: 'insensitive' } },
      select: { id: true, robloxUsername: true, robloxId: true },
    });
    if (!user) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { item: true },
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile || !profile.isPublic) {
      return NextResponse.json({ error: 'Seller store is private or not found' }, { status: 404 });
    }

    const items = profile.items.map(si => ({
      id: si.id,
      priceRobux: si.priceRobux,
      priceUsd: si.priceUsd,
      item: serializeItems([si.item])[0],
      createdAt: si.createdAt,
    }));

    return NextResponse.json({
      success: true,
      store: {
        robloxUsername: profile.robloxUsername || user.robloxUsername,
        robloxId: profile.robloxId || user.robloxId,
        avatarUrl: profile.avatarUrl,
        totalValue: profile.totalValue,
        totalSales: profile.totalSales,
        items,
      },
    });
  } catch (error) {
    console.error('Seller store GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
