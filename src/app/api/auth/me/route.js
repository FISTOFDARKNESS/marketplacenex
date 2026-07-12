import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        robloxUsername: true,
        gmail: true,
        gmailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // NOTE: we intentionally do NOT require the session (decoded.sid) to
    // still exist. Sessions can be pruned/ended, which would otherwise
    // invalidate a perfectly valid token and bounce authenticated users
    // (e.g. out of the admin panel). The JWT itself is the source of truth;
    // role is read fresh from the DB below.
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
