import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        user: { select: { username: true } },
      },
    });

    const clean = logs.map((l) => ({
      id: l.id,
      action: l.action,
      target: l.target,
      ip: l.ip,
      meta: l.meta,
      createdAt: l.createdAt,
      username: l.user?.username || null,
    }));

    return NextResponse.json({ success: true, logs: clean });
  } catch (error) {
    console.error('Admin audit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
