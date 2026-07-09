import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { createOtpChallenge } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limit = rateLimit('sec-gmailsend-' + ip, 5, 60000);
    if (!limit.success) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });

    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { gmail } = await req.json();
    const cleaned = (gmail || '').trim().toLowerCase();
    if (!GMAIL_RE.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid @gmail.com address.' }, { status: 400 });
    }

    const code = await createOtpChallenge({
      userId: decoded.id,
      type: 'gmail-verify',
      channel: 'email',
      target: cleaned,
    });
    await sendOtpEmail(cleaned, code, 'gmail-verify');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gmail send error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This Gmail is already linked to another account.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
