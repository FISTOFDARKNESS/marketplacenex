import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Used by the controller .exe to automatically fetch approved sessions
// (and their relay tokens) so it can connect without manual copy/paste.
// Protected by RELAY_ADMIN_KEY (set on the server).
export async function GET(req) {
  try {
    const key = new URL(req.url).searchParams.get('key');
    const expected = process.env.RELAY_ADMIN_KEY;
    if (!expected || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.remoteSession.findMany({
      where: { status: 'APPROVED' },
      orderBy: { approvedAt: 'desc' },
      take: 20,
      select: {
        token: true,
        hostname: true,
        username: true,
        ip: true,
        screen: true,
        approvedAt: true,
      },
    });

    const relayUrl = process.env.RELAY_URL || 'ws://localhost:8765';
    return NextResponse.json({ success: true, relayUrl, sessions });
  } catch (error) {
    console.error('Remote approved error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
