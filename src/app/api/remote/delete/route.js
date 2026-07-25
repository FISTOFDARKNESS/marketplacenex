import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    await prisma.remoteSession.delete({ where: { token } });
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Remote delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
