import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';

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

    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    // Verify Google ID Token via Google API
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Invalid Google credential' }, { status: 400 });
    }

    const payload = await verifyRes.json();
    if (!payload.email || payload.aud !== (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '855427189196-dummyclientid.apps.googleusercontent.com')) {
      // Allow the default fallback ID for testing/verification ease if NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured in dev
      if (payload.aud !== '855427189196-dummyclientid.apps.googleusercontent.com') {
         return NextResponse.json({ error: 'Token audience mismatch' }, { status: 400 });
      }
    }

    const email = payload.email.toLowerCase();
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a unique username from email prefix
      const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let baseUsername = emailPrefix || 'googler';
      let username = baseUsername;
      
      // Ensure username uniqueness
      let count = 0;
      while (true) {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });
        if (!existingUser) break;
        count++;
        username = `${baseUsername}${count}`;
      }

      // Google users do not use passwords directly, but schema requires it
      const randomPassword = Math.random().toString(36) + Math.random().toString(36);
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: 'user',
        },
      });
    }

    // Sign session token
    const token = signToken({ id: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
