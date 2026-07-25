import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ success: true, item: serializeItems([item])[0] });
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
