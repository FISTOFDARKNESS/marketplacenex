import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { robloxId: null, robloxUsername: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlink error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
