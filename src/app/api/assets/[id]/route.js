import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

export async function PATCH(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (asset.ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ['name', 'description', 'tags', 'price', 'priceRobux'];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  data.updatedAt = new Date().toISOString();

  const updated = await prisma.asset.update({ where: { id }, data });
  return NextResponse.json({ success: true, asset: updated });
}

export async function DELETE(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (asset.ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (asset.status === 'APPROVED' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Cannot delete an approved asset. Contact an admin.' }, { status: 403 });
  }

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
