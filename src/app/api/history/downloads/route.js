import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const downloads = await prisma.assetDownload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      asset: {
        select: { id: true, name: true, thumbnailUrl: true, assetType: true, price: true, priceRobux: true },
      },
    },
  });

  return NextResponse.json({ success: true, downloads });
}
