import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true, aboutMe: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
      reviews: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
      _count: { select: { likes: true, downloadsRel: true, reviews: true } },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, asset });
}

export async function DELETE(req, { params }) {
  const { getAuthUser } = await import('@/lib/auth');
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
