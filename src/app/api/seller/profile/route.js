import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getRobloxUserId, getRobloxAvatarUrl } from '@/lib/roblox';

export const dynamic = 'force-dynamic';

const ROBUX_TO_USD = 0.0035;

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    let profile = await prisma.sellerProfile.findUnique({
      where: { userId: decoded.id },
      include: { items: { include: { item: true }, where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
    });

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { robloxUsername: true, robloxId: true, balance: true } });

    if (!profile) {
      const totalValue = 0;
      const avatarUrl = null;
      profile = await prisma.sellerProfile.create({
        data: {
          userId: decoded.id,
          robloxUsername: user?.robloxUsername || null,
          robloxId: user?.robloxId || null,
          avatarUrl,
          totalValue,
          isPublic: true,
        },
        include: { items: { include: { item: true }, where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
      });
    }

    return NextResponse.json({ success: true, profile, balance: user?.balance || 0 });
  } catch (error) {
    console.error('Seller profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();

    let profile = await prisma.sellerProfile.findUnique({ where: { userId: decoded.id } });
    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: { userId: decoded.id },
      });
    }

    const updateData = {};
    if (typeof body.isPublic === 'boolean') updateData.isPublic = body.isPublic;
    if (typeof body.robloxUsername === 'string') updateData.robloxUsername = body.robloxUsername;

    if (body.refreshRoblox) {
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { robloxCookie: true } });
      if (user?.robloxCookie) {
        try {
          const robloxId = await getRobloxUserId(user.robloxCookie);
          updateData.robloxId = robloxId;
          const avatarUrl = await getRobloxAvatarUrl(robloxId);
          if (avatarUrl) updateData.avatarUrl = avatarUrl;
          const userData = await prisma.user.findUnique({ where: { id: decoded.id }, select: { robloxUsername: true } });
          if (userData?.robloxUsername) updateData.robloxUsername = userData.robloxUsername;
        } catch (e) {
          console.error('Failed to refresh Roblox data:', e);
        }
      }
    }

    profile = await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: updateData,
      include: { items: { include: { item: true }, where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Seller profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
