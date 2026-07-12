import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const sessions = await prisma.session.findMany({
      orderBy: { lastSeen: 'desc' },
      take: 300,
      include: {
        user: { select: { username: true, email: true, role: true } },
      },
    });

    const clean = sessions.map((s) => ({
      id: s.id,
      ip: s.ip,
      device: s.device,
      browser: s.browser,
      os: s.os,
      lastSeen: s.lastSeen,
      createdAt: s.createdAt,
      username: s.user?.username || null,
      email: s.user?.email || null,
      role: s.user?.role || null,
    }));

    return NextResponse.json({ success: true, sessions: clean });
  } catch (error) {
    console.error('Admin sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
