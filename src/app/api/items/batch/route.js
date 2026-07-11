import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');
    if (!ids) return NextResponse.json({ success: true, items: [] });

    const assetIds = ids.split(',').map(Number).filter(Boolean);
    if (assetIds.length === 0) return NextResponse.json({ success: true, items: [] });

    const items = await prisma.item.findMany({
      where: { robloxAssetId: { in: assetIds.map(BigInt) } },
    });

    return NextResponse.json({ success: true, items: serializeItems(items) });
  } catch (error) {
    console.error('Batch items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
