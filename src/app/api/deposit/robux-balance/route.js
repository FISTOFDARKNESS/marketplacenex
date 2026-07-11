import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getRobuxBalance } from '@/lib/roblox';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { robloxCookie: true, robloxId: true, robloxUsername: true } });
    if (!user?.robloxCookie) {
      return NextResponse.json({ linked: false, error: 'Roblox account not linked' });
    }

    const robux = await getRobuxBalance(user.robloxCookie);

    return NextResponse.json({
      linked: true,
      robloxId: user.robloxId?.toString(),
      robloxUsername: user.robloxUsername,
      robux,
    });
  } catch (error) {
    console.error('Robux balance error:', error);
    return NextResponse.json({ linked: false, error: 'Failed to fetch Robux balance' });
  }
}
