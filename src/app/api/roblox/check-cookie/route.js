import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { robloxCookie: true, robloxUsername: true },
    });

    if (!user?.robloxCookie) {
      return NextResponse.json({ valid: false, hasCookie: false, error: 'No cookie saved' });
    }

    // Test if cookie is still valid
    const robloxRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        Cookie: `.ROBLOSECURITY=${user.robloxCookie}`,
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (robloxRes.status === 401) {
      return NextResponse.json({ valid: false, hasCookie: true, error: 'Cookie expired' });
    }

    if (!robloxRes.ok) {
      return NextResponse.json({ valid: false, hasCookie: true, error: 'Cookie invalid' });
    }

    return NextResponse.json({ valid: true, hasCookie: true, robloxUsername: user.robloxUsername });
  } catch (error) {
    console.error('Check cookie error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
