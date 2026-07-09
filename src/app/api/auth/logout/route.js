import { NextResponse } from 'next/server';
import { verifyToken, destroySession } from '@/lib/auth';

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  if (token) {
    const decoded = verifyToken(token);
    await destroySession(decoded?.sid);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete('token');
  return response;
}
