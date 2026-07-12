import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Approves a PENDING remote session so the controller can connect to it.
// Protected by RELAY_ADMIN_KEY (the same key the controller already has),
// so the controller .exe can accept requests on its own.
export async function POST(req) {
  try {
    const key = new URL(req.url).searchParams.get('key');
    const expected = process.env.RELAY_ADMIN_KEY;
    if (!expected || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const token = String(body.token || '').trim();
    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    const session = await prisma.remoteSession.findUnique({ where: { token } });
    if (!session) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    await prisma.remoteSession.update({
      where: { token },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Remote approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
