import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function calcQueuePos(createdAt, updatedAt, queuePos) {
  const now = Date.now();
  const lastUpdate = new Date(updatedAt || createdAt).getTime();
  const elapsedMinutes = (now - lastUpdate) / 60000;
  const steps = Math.floor(elapsedMinutes / 5);
  if (steps <= 0) return queuePos;
  const decrement = Math.floor(Math.random() * 10 + 5) * steps;
  return Math.max(0, queuePos - decrement);
}

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.value } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { amount, type } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (!['receber', 'enviar'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const robuxAmount = Math.floor(amount);

    if (user.balance < robuxAmount * 0.0035) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: robuxAmount,
        queuePos: 10000,
        type,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: robuxAmount * 0.0035 } },
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'receber';

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.value, type },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    const updated = [];
    for (const w of withdrawals) {
      const currentPos = calcQueuePos(w.createdAt, w.updatedAt, w.queuePos);
      if (currentPos !== w.queuePos) {
        const completed = currentPos <= 0;
        await prisma.withdrawal.update({
          where: { id: w.id },
          data: { queuePos: Math.max(0, currentPos), status: completed ? 'COMPLETED' : 'PROCESSING', updatedAt: now },
        });
        updated.push({ ...w, queuePos: Math.max(0, currentPos), status: completed ? 'COMPLETED' : 'PROCESSING' });
      } else {
        updated.push(w);
      }
    }

    return NextResponse.json({ success: true, withdrawals: updated });
  } catch (error) {
    console.error('Withdrawal queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
