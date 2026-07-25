import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { verifyOtpChallenge } from '@/lib/otp';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('session-revoke-' + ip, 10, 600000); // 10 tries / 10 min per IP
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

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
    if (!result.ok) {
      logAudit({ action: 'session.revoke.fail', userId: decoded.id, target: sessionId, req, meta: { reason: result.error } });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    logAudit({ action: 'session.revoke.success', userId: decoded.id, target: sessionId, req });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
