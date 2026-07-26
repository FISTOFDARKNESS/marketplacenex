import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { proxyUrl } from '@/lib/storage-url';

export async function POST(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  await prisma.assetDownload.create({ data: { assetId: id, userId: user.id } });
  await prisma.asset.update({ where: { id }, data: { downloads: { increment: 1 } } });

  await prisma.notification.create({
    data: {
      userId: asset.ownerId,
      type: 'download',
      title: 'Asset Downloaded',
      message: `Someone downloaded your asset "${asset.name}"!`,
      link: `/asset/${id}`,
    },
  });

  return NextResponse.json({ success: true, downloadUrl: proxyUrl(asset.assetFileUrl) });
}
