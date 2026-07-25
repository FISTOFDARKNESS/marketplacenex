import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: { status: 'QUEUE' },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ success: true, assets });
}
