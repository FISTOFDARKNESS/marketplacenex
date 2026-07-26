import { NextResponse } from 'next/server';
import { prisma, sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, db_url_set: !!process.env.DATABASE_URL }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false, db_url_set: !!process.env.DATABASE_URL }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        verified: true,
        robloxUsername: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, db_url_set: !!process.env.DATABASE_URL }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Auth check error:', error);
    let db_ok = false;
    let db_test = null;
    try {
      const r = await sql('SELECT 1 AS ok');
      db_ok = true;
      db_test = r;
    } catch (e2) {
      db_test = e2.message;
    }
    return NextResponse.json({
      error: error.message,
      db_url_set: !!process.env.DATABASE_URL,
      db_ok,
      db_test: Array.isArray(db_test) ? db_test : db_test?.toString(),
      stack: error.stack?.split('\n').slice(0, 5).join(' | '),
    }, { status: 500 });
  }
}
