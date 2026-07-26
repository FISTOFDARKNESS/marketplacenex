import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '24');
  const tag = searchParams.get('tag') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const userId = searchParams.get('userId') || '';

  const where = { status: 'APPROVED' };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (userId) {
    where.ownerId = userId;
  }

  if (minPrice || maxPrice) {
    where.priceRobux = {};
    if (minPrice) where.priceRobux.gte = parseInt(minPrice);
    if (maxPrice) where.priceRobux.lte = parseInt(maxPrice);
  }

  let orderBy;
  switch (sort) {
    case 'oldest': orderBy = { createdAt: 'asc' }; break;
    case 'popular': orderBy = { downloads: 'desc' }; break;
    case 'name': orderBy = { name: 'asc' }; break;
    default: orderBy = { createdAt: 'desc' };
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return NextResponse.json({ success: true, assets, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, description, tags, price, priceRobux, thumbnailUrl, videoUrl, assetFileUrl, assetType, fileSize } = body;

    if (!name || !thumbnailUrl || !assetFileUrl) {
      return NextResponse.json({ error: 'Name, thumbnail, and asset file are required' }, { status: 400 });
    }

    if (price === 'Robux' && !user.verified) {
      return NextResponse.json({ error: 'You must be verified to set a Robux price' }, { status: 403 });
    }

    if (price === 'Robux' && (!priceRobux || priceRobux < 1)) {
      return NextResponse.json({ error: 'Price must be at least 1 Robux' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        id: id || undefined,
        ownerId: user.id,
        name,
        description: description || '',
        tags: tags || [],
        price: price || 'Free',
        priceRobux: price === 'Robux' ? priceRobux : null,
        thumbnailUrl,
        videoUrl: videoUrl || null,
        assetFileUrl,
        assetType: assetType || 'rbxm',
        fileSize: fileSize || 0,
        status: 'QUEUE',
      },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'Asset Submitted',
        message: `Your asset "${name}" has been submitted to the queue and is pending admin review.`,
        link: `/queue`,
      },
    });

    return NextResponse.json({ success: true, asset });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
