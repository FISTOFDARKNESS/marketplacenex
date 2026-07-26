import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getIP(req);
  const limit = rateLimit('like-' + ip, 20, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const { id } = params;

  const existing = await prisma.assetLike.findUnique({
    where: { assetId_userId: { assetId: id, userId: user.id } },
  });

  if (existing) {
    await prisma.assetLike.delete({ where: { id: existing.id } });
    await prisma.asset.update({ where: { id }, data: { likesCount: { decrement: 1 } } });
    return NextResponse.json({ success: true, liked: false });
  }

  await prisma.assetLike.create({ data: { assetId: id, userId: user.id } });
  await prisma.asset.update({ where: { id }, data: { likesCount: { increment: 1 } } });

  return NextResponse.json({ success: true, liked: true });
}
