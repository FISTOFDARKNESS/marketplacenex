import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { checkUserOwnsGamePass } from '@/lib/roblox-opencloud';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const STORAGE_BUCKET = 'marketplace-assets';
const SIGNED_URL_EXPIRY_SECONDS = 60;

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getIP(req);
  const limit = rateLimit('purchase-verify-' + ip, 5, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const { assetId, robloxUserId } = body;

  if (!assetId || !robloxUserId) {
    return NextResponse.json(
      { error: 'assetId and robloxUserId are required' },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (asset.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Asset not available' }, { status: 403 });
  }

  if (!asset.gamePassId) {
    return NextResponse.json(
      { error: 'This asset has no associated Game Pass. Contact support.' },
      { status: 400 }
    );
  }

  const existingPurchase = await prisma.assetPurchase.findUnique({
    where: { userId_assetId: { userId: user.id, assetId } },
  });

  if (existingPurchase && existingPurchase.status === 'COMPLETED') {
    const signedUrl = await generateSignedUrl(asset);
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      alreadyPurchased: true,
      downloadUrl: signedUrl,
      expiresIn: SIGNED_URL_EXPIRY_SECONDS,
    });
  }

  let ownsGamePass = false;
  try {
    ownsGamePass = await checkUserOwnsGamePass(robloxUserId, asset.gamePassId);
  } catch (err) {
    console.error('Roblox ownership check failed:', err);
    return NextResponse.json(
      { error: 'Failed to verify Roblox purchase. Please try again later.' },
      { status: 502 }
    );
  }

  if (!ownsGamePass) {
    return NextResponse.json(
      { error: 'Game Pass not found in inventory. Please purchase it on Roblox first.' },
      { status: 403 }
    );
  }

  const signedUrl = await generateSignedUrl(asset);
  if (!signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }

  await prisma.assetPurchase.upsert({
    where: { userId_assetId: { userId: user.id, assetId } },
    create: {
      userId: user.id,
      assetId,
      priceRobux: asset.priceRobux,
      status: 'COMPLETED',
    },
    update: {
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { downloads: { increment: 1 } },
  });

  return NextResponse.json({
    success: true,
    alreadyPurchased: false,
    downloadUrl: signedUrl,
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });
}

async function generateSignedUrl(asset) {
  try {
    const filePath = extractFilePathFromUrl(asset.assetFileUrl);
    if (!filePath) {
      console.error('Invalid asset file URL:', asset.assetFileUrl);
      return null;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('generateSignedUrl error:', err);
    return null;
  }
}

function extractFilePathFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const pathParts = u.pathname.split('/');
    const storageIdx = pathParts.findIndex(p => p === 'storage' || p === 'v1');
    if (storageIdx !== -1 && storageIdx + 2 < pathParts.length) {
      return pathParts.slice(storageIdx + 2).join('/');
    }
    const objectIdx = pathParts.findIndex(p => p === 'object');
    if (objectIdx !== -1 && objectIdx + 2 < pathParts.length) {
      return pathParts.slice(objectIdx + 2).join('/');
    }
    return pathParts.slice(1).join('/');
  } catch {
    return url.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/[^/]+\//, '');
  }
}
