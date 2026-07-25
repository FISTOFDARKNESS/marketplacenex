import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Used by the host .exe to check its own session status so it can:
//  - keep the access alive after approval (no new registration each reconnect)
//  - self-terminate when an admin ends the session on the site.
// Guarded only by the secret token (which is otherwise unguessable).
export async function GET(req) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const session = await prisma.remoteSession.findUnique({ where: { token } });
    if (!session) return NextResponse.json({ success: false, found: false }, { status: 404 });

    const relayUrl = process.env.RELAY_URL || 'ws://localhost:8765';
    return NextResponse.json({ success: true, found: true, status: session.status, relayUrl });
  } catch (error) {
    console.error('Remote status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
