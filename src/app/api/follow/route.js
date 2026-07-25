import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { followingId } = await req.json();

  if (user.id === followingId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, following: false });
  }

  await prisma.follow.create({ data: { followerId: user.id, followingId } });

  await prisma.notification.create({
    data: {
      userId: followingId,
      type: 'social',
      title: 'New Follower',
      message: `${user.username} is now following you!`,
      link: `/profile/${user.username}`,
    },
  });

  return NextResponse.json({ success: true, following: true });
}

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId') || user.id;

  const [followers, following] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: targetId },
      include: { follower: { select: { id: true, username: true, avatarUrl: true } } },
    }),
    prisma.follow.findMany({
      where: { followerId: targetId },
      include: { following: { select: { id: true, username: true, avatarUrl: true } } },
    }),
  ]);

  const isFollowing = user.id !== targetId
    ? await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
      })
    : null;

  return NextResponse.json({
    success: true,
    followers: followers.map(f => f.follower),
    following: following.map(f => f.following),
    isFollowing: !!isFollowing,
    followersCount: followers.length,
    followingCount: following.length,
  });
}
