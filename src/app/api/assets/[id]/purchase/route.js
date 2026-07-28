import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { createGamePass } from '@/lib/roblox-opencloud';

export async function POST(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getIP(req);
  const limit = rateLimit('purchase-' + ip, 5, 60000);
  if (!limit.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { id } = params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  if (asset.status !== 'APPROVED') return NextResponse.json({ error: 'Asset not available' }, { status: 403 });
  if (asset.price !== 'Robux' || !asset.priceRobux) return NextResponse.json({ error: 'Asset is free' }, { status: 400 });

  const existing = await prisma.assetPurchase.findUnique({
    where: { userId_assetId: { userId: user.id, assetId: id } },
  });
  if (existing) return NextResponse.json({ error: 'Already purchased' }, { status: 400 });

  if (!user.robloxUserId) {
    return NextResponse.json({
      error: 'Link your Roblox account first',
      needsLink: true,
    }, { status: 400 });
  }

  if (!asset.gamePassId) {
    try {
      const passId = await createGamePass(asset.name, asset.priceRobux);
      await prisma.asset.update({
        where: { id },
        data: { gamePassId: { set: passId } },
      });
      asset.gamePassId = passId;
    } catch (err) {
      console.error('Failed to create gamepass:', err);
      return NextResponse.json({ error: 'Failed to create gamepass. Try again later.' }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    redirectUrl: `https://www.roblox.com/game-pass/${asset.gamePassId}`,
    gamePassId: asset.gamePassId,
  });
}