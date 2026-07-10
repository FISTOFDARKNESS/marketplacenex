import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeItems } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = searchParams.get('cat');
    const rarity = searchParams.get('rarity');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');
    const limitParam = searchParams.get('limit');

    const where = {};

    if (cat && cat !== 'all') {
      where.category = cat;
    }

    if (rarity) {
      where.rarity = rarity;
    }

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    let orderBy = { rap: 'desc' };
    if (sort === 'high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'demand') {
      orderBy = { demand: 'desc' };
    }

    const hasFilter = !!(cat || rarity || search || minPrice || maxPrice);
    const take = hasFilter ? undefined : 700;

    const [items, total] = await Promise.all([
      prisma.item.findMany({ where, orderBy, take }),
      prisma.item.count(),
    ]);

    return NextResponse.json({ success: true, items: serializeItems(items), total });
  } catch (error) {
    console.error('Fetch items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
