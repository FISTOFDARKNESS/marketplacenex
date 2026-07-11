import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createGamepass } from '@/lib/roblox';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || amount < 5 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: 'Minimum deposit is 5 Robux' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.robloxCookie) {
      return NextResponse.json({ error: 'Link your Roblox account first' }, { status: 400 });
    }

    const adminCookie = process.env.ROBLOX_COOKIE;
    if (!adminCookie) return NextResponse.json({ error: 'Deposits not configured' }, { status: 500 });

    const universeId = process.env.ROBLOX_UNIVERSE_ID || '129369439208963';

    const passId = await createGamepass(adminCookie, universeId, amount);

    const order = await prisma.depositOrder.create({
      data: {
        userId: decoded.id,
        usdAmount: 0,
        robuxAmount: amount,
        paymentMethod: 'robux',
        paymentUrl: `https://www.roblox.com/game-pass/${passId}`,
        gamepassId: BigInt(passId),
        robloxUserId: user.robloxId ? BigInt(user.robloxId.toString()) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      passId,
      url: `https://www.roblox.com/game-pass/${passId}`,
    });
  } catch (error) {
    console.error('Deposit start error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
