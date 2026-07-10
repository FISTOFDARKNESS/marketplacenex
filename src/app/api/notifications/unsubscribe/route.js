import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { userId: decoded.id, endpoint } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
