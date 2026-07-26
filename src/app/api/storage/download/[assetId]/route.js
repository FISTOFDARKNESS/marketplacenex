import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BUCKET = 'marketplace';

export async function GET(req, { params }) {
  const { assetId } = params;

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, ownerId: true, assetFileUrl: true, name: true, status: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Asset not available' }, { status: 403 });
    }

    const isOwner = asset.ownerId === user.id;
    let hasAccess = isOwner;

    if (!isOwner) {
      const purchase = await prisma.assetPurchase.findUnique({
        where: { userId_assetId: { userId: user.id, assetId } },
      });
      hasAccess = !!purchase;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You must purchase this asset to download it' },
        { status: 403 }
      );
    }

    const filePath = extractFilePathFromUrl(asset.assetFileUrl);
    if (!filePath) {
      return NextResponse.json({ error: 'Asset file not found in storage' }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    const fileRes = await fetch(data.signedUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 500 });
    }

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    const safeName = asset.name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `asset_${assetId}_${safeName}.rbxm`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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