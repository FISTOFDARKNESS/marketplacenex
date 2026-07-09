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

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const result = await verifyOtpChallenge({ userId: decoded.id, type: 'phone-verify', code });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    const challenge = await prisma.otpChallenge.findFirst({
      where: { userId: decoded.id, type: 'phone-verify', consumedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    const phone = challenge?.target;
    if (!phone) return NextResponse.json({ error: 'Telefone não encontrado.' }, { status: 400 });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { phone, phoneVerified: true },
    });

    return NextResponse.json({ success: true, phone });
  } catch (error) {
    console.error('Phone verify error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este número já está vinculado a outra conta.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
