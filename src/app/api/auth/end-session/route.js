import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, destroySession } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('end-session-' + ip, 10, 600000);
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.purpose !== 'end-session') {
      logAudit({ action: 'session.end-session.fail', req, meta: { reason: 'invalid token' } });
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { jti: decoded.sessionId },
      include: { user: { select: { id: true } } },
    });

    if (!session) {
      return NextResponse.json({ success: true, message: 'Session already ended' });
    }

    if (session.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 400 });
    }

    await destroySession(decoded.sessionId);

    logAudit({ action: 'session.end-session.success', userId: decoded.userId, target: decoded.sessionId, req });

    return NextResponse.json({ success: true, message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
