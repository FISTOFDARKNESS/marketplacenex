import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const deposits = await prisma.depositOrder.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
    });

    const transactions = [];

    for (const d of deposits) {
      transactions.push({
        id: d.id,
        type: 'Deposit',
        amount: d.usdAmount,
        method: d.paymentMethod,
        status: d.status,
        date: d.createdAt,
      });
    }

    for (const w of withdrawals) {
      transactions.push({
        id: w.id,
        type: 'Withdrawal',
        amount: w.amount,
        method: w.type,
        status: w.status,
        date: w.createdAt,
      });
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
