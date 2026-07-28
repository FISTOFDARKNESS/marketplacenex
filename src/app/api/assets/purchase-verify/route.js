import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { checkUserOwnsGamePass } from '@/lib/roblox-opencloud';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getIP(req);
  const limit = rateLimit('purchase-verify-' + ip, 5, 60000);
  if (!limit.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const { assetId } = body;

  if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  if (!asset.gamePassId) return NextResponse.json({ error: 'No gamepass for this asset' }, { status: 400 });
  if (!user.robloxUserId) return NextResponse.json({ error: 'Link your Roblox account first' }, { status: 400 });

  const existing = await prisma.assetPurchase.findUnique({
    where: { userId_assetId: { userId: user.id, assetId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyPurchased: true });

  const owns = await checkUserOwnsGamePass(user.robloxUserId, asset.gamePassId);
  if (!owns) {
    return NextResponse.json({ error: 'Purchase not found. Please buy the gamepass on Roblox first.' }, { status: 400 });
  }

  await prisma.assetPurchase.create({
    data: { userId: user.id, assetId, priceRobux: asset.priceRobux },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { downloads: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
}