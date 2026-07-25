import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req, { params }) {
  const { username } = params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      aboutMe: true,
      verified: true,
      createdAt: true,
      _count: { select: { followers: true, following: true, assets: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const assets = await prisma.asset.findMany({
    where: { ownerId: user.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ success: true, user, assets });
}

export async function PATCH(req, { params }) {
  const { getAuthUser } = await import('@/lib/auth');
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = params;
  if (authUser.username !== username && authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { aboutMe, avatarUrl } = await req.json();

  await prisma.user.update({
    where: { username },
    data: { aboutMe, avatarUrl },
  });

  return NextResponse.json({ success: true });
}
