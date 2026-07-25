import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { createOtpChallenge } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('sec-sendotp-' + ip, 5, 60000);
    if (!limit.success) return NextResponse.json({ error: 'Muitas solicitações. Tente mais tarde.' }, { status: 429 });

    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Session id required' }, { status: 400 });

    const session = await prisma.session.findFirst({ where: { id: sessionId, userId: decoded.id } });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.jti === decoded.sid) {
      return NextResponse.json({ error: 'Não é possível encerrar o dispositivo atual por aqui.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { email: true } });
    const code = await createOtpChallenge({
      userId: decoded.id,
      type: 'session-revoke',
      channel: 'email',
      target: user.email,
    });
    await sendOtpEmail(user.email, code, 'session-revoke');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
