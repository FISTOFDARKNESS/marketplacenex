import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, destroySession } from '@/lib/auth';

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.purpose !== 'end-session') {
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

    return NextResponse.json({ success: true, message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
