import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, signToken } from '@/lib/auth';

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

    if (decoded.sid) {
      const session = await prisma.session.findUnique({ where: { jti: decoded.sid } });
      if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
    }

    // Re-issue the token so its role reflects the current DB state.
    // This fixes stale role when a user is promoted to admin after login.
    const newToken = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      sid: decoded.sid,
    });

    const response = NextResponse.json({ authenticated: true, user });
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
