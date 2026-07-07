import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { rateLimit, getIP } from '@/lib/rateLimit';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limitCheck = rateLimit(ip, 5, 60000); // 5 attempts per minute per IP
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (decoded.purpose !== 'reset-password') {
      return NextResponse.json({ error: 'Invalid token purpose' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User no longer exists' }, { status: 404 });
    }

    // Hash new password and update database
    const passwordHash = await hashPassword(password);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(`Password successfully updated for user: ${user.username}`);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
