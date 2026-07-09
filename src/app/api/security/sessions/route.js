import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const sessions = await prisma.session.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        device: s.device,
        browser: s.browser,
        os: s.os,
        ip: s.ip,
        lastSeen: s.lastSeen,
        createdAt: s.createdAt,
        isCurrent: s.jti === decoded.sid,
        online: now - new Date(s.lastSeen).getTime() < ONLINE_THRESHOLD_MS,
      })),
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
