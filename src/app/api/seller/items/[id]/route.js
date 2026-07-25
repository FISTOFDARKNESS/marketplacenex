import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = params;
    const sellerItem = await prisma.sellerItem.findFirst({ where: { id, userId: decoded.id } });
    if (!sellerItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    await prisma.sellerItem.delete({ where: { id } });

    const profile = await prisma.sellerProfile.findUnique({ where: { userId: decoded.id } });
    if (profile) {
      const totalVal = await prisma.sellerItem.aggregate({
        where: { sellerId: profile.id, isActive: true },
        _sum: { priceUsd: true },
      });
      await prisma.sellerProfile.update({
        where: { id: profile.id },
        data: { totalValue: totalVal._sum.priceUsd || 0 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller item DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
