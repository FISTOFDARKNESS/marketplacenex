import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { cookie } = await req.json();
    if (!cookie || !cookie.startsWith('_|')) {
      return NextResponse.json({ error: 'Invalid .ROBLOSECURITY cookie. It should start with "_|"' }, { status: 400 });
    }

    // Fetch authenticated Roblox user info using the cookie
    const robloxRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!robloxRes.ok) {
      const text = await robloxRes.text();
      if (robloxRes.status === 401) {
        return NextResponse.json({ error: 'Invalid or expired cookie. Generate a new .ROBLOSECURITY from Roblox.' }, { status: 400 });
      }
      return NextResponse.json({ error: `Roblox API error: ${text.slice(0, 100)}` }, { status: 502 });
    }

    const robloxData = await robloxRes.json();
    const robloxId = robloxData.id;
    const robloxUsername = robloxData.name;

    if (!robloxId || !robloxUsername) {
      return NextResponse.json({ error: 'Failed to get Roblox user info' }, { status: 502 });
    }

    // Update user's Roblox info and save cookie
    await prisma.user.update({
      where: { id: decoded.id },
      data: { robloxId: BigInt(robloxId), robloxUsername, robloxCookie: cookie },
    });

    return NextResponse.json({ success: true, robloxId, robloxUsername });
  } catch (error) {
    console.error('Verify cookie error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
