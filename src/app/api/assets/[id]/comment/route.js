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
  const limit = rateLimit('comment-' + ip, 10, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const { id } = params;
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({ where: { id }, select: { ownerId: true, name: true } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const comment = await prisma.assetComment.create({
    data: { assetId: id, userId: user.id, content },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

  if (asset.ownerId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: asset.ownerId,
        type: 'comment',
        title: 'New Comment',
        message: `${user.username} commented on your asset "${asset.name}".`,
        link: `/asset/${id}`,
      },
    });
  }

  return NextResponse.json({ success: true, comment });
}
