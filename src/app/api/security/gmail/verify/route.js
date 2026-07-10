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
    const limit = rateLimit('gmail-verify-' + ip, 10, 600000); // 10 tries / 10 min per IP
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const result = await verifyOtpChallenge({ userId: decoded.id, type: 'gmail-verify', code });
    if (!result.ok) {
      logAudit({ action: 'gmail.verify.fail', userId: decoded.id, req, meta: { reason: result.error } });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: { userId: decoded.id, type: 'gmail-verify', consumedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    const gmail = challenge?.target;
    if (!gmail) return NextResponse.json({ error: 'Gmail not found.' }, { status: 400 });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { gmail, gmailVerified: true },
    });

    logAudit({ action: 'gmail.verify.success', userId: decoded.id, req, meta: { gmail } });

    return NextResponse.json({ success: true, gmail });
  } catch (error) {
    console.error('Gmail verify error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This Gmail is already linked to another account.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
