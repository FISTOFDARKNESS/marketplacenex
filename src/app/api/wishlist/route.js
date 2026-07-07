import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { serializeItem } from '@/lib/serializer';

export const dynamic = 'force-dynamic';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/wishlist — returns all wishlist items for the logged-in user
export async function GET(req) {
  try {
    const decoded = getUser(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.wishlist.findMany({
      where: { userId: decoded.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });

    const items = entries.map((e) => serializeItem(e.item));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('GET wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wishlist — add an item to the wishlist
export async function POST(req) {
  try {
    const decoded = getUser(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    const entry = await prisma.wishlist.upsert({
      where: { userId_itemId: { userId: decoded.id, itemId } },
      update: {},
      create: { userId: decoded.id, itemId },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('POST wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wishlist — remove an item from the wishlist
export async function DELETE(req) {
  try {
    const decoded = getUser(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    await prisma.wishlist.deleteMany({
      where: { userId: decoded.id, itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
