import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const likes = await prisma.assetLike.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      asset: {
        select: { id: true, name: true, thumbnailUrl: true, assetType: true, price: true, priceRobux: true, likesCount: true, downloads: true },
      },
    },
  });

  return NextResponse.json({ success: true, likes: likes.map(l => l.asset) });
}
