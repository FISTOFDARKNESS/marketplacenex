import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin: list all remote sessions (newest first).
export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const sessions = await prisma.remoteSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Remote list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
