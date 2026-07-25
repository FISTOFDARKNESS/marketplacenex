import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Lists PENDING (not yet approved) remote sessions so the controller .exe can
// show them and let the user accept them without opening the admin site.
// Protected by RELAY_ADMIN_KEY (the same key the controller already has).
export async function GET(req) {
  try {
    const key = new URL(req.url).searchParams.get('key');
    const expected = process.env.RELAY_ADMIN_KEY;
    if (!expected || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.remoteSession.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        token: true,
        hostname: true,
        username: true,
        ip: true,
        screen: true,
        os: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Remote pending error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
