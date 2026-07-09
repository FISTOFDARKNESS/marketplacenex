import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { verifyOtpChallenge } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { sessionId, code } = await req.json();
    if (!sessionId || !code) return NextResponse.json({ error: 'Session id and code required' }, { status: 400 });

    const session = await prisma.session.findFirst({ where: { id: sessionId, userId: decoded.id } });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.jti === decoded.sid) {
      return NextResponse.json({ error: 'Não é possível encerrar o dispositivo atual por aqui.' }, { status: 400 });
    }

    const result = await verifyOtpChallenge({ userId: decoded.id, type: 'session-revoke', code });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    await prisma.session.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
