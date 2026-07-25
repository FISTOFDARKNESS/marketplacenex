import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req, { params }) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { action, reason } = await req.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (action === 'approve') {
    await prisma.asset.update({ where: { id }, data: { status: 'APPROVED' } });

    const followers = await prisma.follow.findMany({
      where: { followingId: asset.ownerId },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map(f => ({
          userId: f.followerId,
          type: 'new_asset',
          title: 'New Asset Published',
          message: `${asset.owner?.username || 'A creator you follow'} published a new asset "${asset.name}"!`,
          link: `/asset/${id}`,
        })),
      });
    }
  } else {
    await prisma.asset.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason || 'No reason provided.' },
    });
  }

  await prisma.notification.create({
    data: {
      userId: asset.ownerId,
      type: 'system',
      title: action === 'approve' ? 'Asset Approved' : 'Asset Rejected',
      message: action === 'approve'
        ? `Your asset "${asset.name}" has been approved and is now live!`
        : `Your asset "${asset.name}" was rejected. Reason: ${reason || 'No reason provided.'}`,
      link: action === 'approve' ? `/asset/${id}` : `/queue`,
    },
  });

  return NextResponse.json({ success: true });
}
