import { NextResponse } from 'next/server';
import { verifyToken, destroySession } from '@/lib/auth';

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  if (token) {
    const decoded = verifyToken(token);
    await destroySession(decoded?.sid);
  }
  const response = NextResponse.json({ success: true });
  // Overwrite the cookie with matching attributes and immediate expiry so the
  // browser reliably removes it ( Secure + SameSite must match the set call ).
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
