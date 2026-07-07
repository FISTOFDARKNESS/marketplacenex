import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const items = await prisma.userItem.findMany({
      where: { userId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      inventory: items.map(ui => ({ id: ui.id, item: serializeItems([ui.item])[0], createdAt: ui.createdAt })),
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
