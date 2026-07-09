import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { createOtpChallenge } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const PHONE_RE = /^[\d\s+()-]{8,20}$/;

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('sec-phonesend-' + ip, 5, 60000);
    if (!limit.success) return NextResponse.json({ error: 'Muitas solicitações. Tente mais tarde.' }, { status: 429 });

    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { phone } = await req.json();
    const cleaned = (phone || '').replace(/\s/g, '');
    if (!PHONE_RE.test(phone || '')) return NextResponse.json({ error: 'Número de celular inválido.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { email: true } });

    const code = await createOtpChallenge({
      userId: decoded.id,
      type: 'phone-verify',
      channel: 'email',
      target: cleaned,
    });
    await sendOtpEmail(user.email, code, 'phone-verify');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Phone send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
