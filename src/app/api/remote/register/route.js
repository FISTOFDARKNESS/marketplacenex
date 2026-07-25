import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { getIP } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Called by the host .exe (friend's machine) when it starts.
// Creates a PENDING session and returns the relay token + relay URL.
export async function POST(req) {
  try {
    const ip = getIP(req);
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const token = randomBytes(24).toString('hex');
    const session = await prisma.remoteSession.create({
      data: {
        token,
        status: 'PENDING',
        hostname: String(body.hostname || '').slice(0, 200) || null,
        username: String(body.username || '').slice(0, 200) || null,
        ip,
        os: String(body.os || '').slice(0, 100) || null,
        screen: String(body.screen || '').slice(0, 50) || null,
      },
    });

    const relayUrl = process.env.RELAY_URL || 'ws://localhost:8765';
    return NextResponse.json({ success: true, token: session.token, relayUrl });
  } catch (error) {
    console.error('Remote register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
