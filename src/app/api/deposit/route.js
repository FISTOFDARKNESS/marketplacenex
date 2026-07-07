import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PRESET_AMOUNTS = [25, 50, 100, 500, 1000, 10000];
const RATES = { crypto: 1, paypal: 0.95, cashapp: 0.97 };

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.value } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { usdAmount, paymentMethod } = await req.json();
    if (!PRESET_AMOUNTS.includes(usdAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!['crypto', 'paypal', 'cashapp'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const rate = RATES[paymentMethod];
    const creditedUsd = usdAmount * rate;
    const robuxEstimate = Math.floor(creditedUsd / 0.0035);

    const deposit = await prisma.depositOrder.create({
      data: {
        userId: user.id,
        usdAmount,
        robuxAmount: robuxEstimate,
        paymentMethod,
        status: 'COMPLETED',
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: creditedUsd } },
    });

    try {
      const cryptomusRes = await fetch('https://api.cryptomus.com/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': process.env.CRYPTOMUS_MERCHANT_ID,
          'sign': process.env.CRYPTOMUS_API_KEY,
        },
        body: JSON.stringify({
          amount: String(usdAmount),
          currency: 'USD',
          order_id: deposit.id,
          url_callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/deposit/callback`,
          url_return: `${process.env.NEXT_PUBLIC_APP_URL}/?deposit=success`,
          url_success: `${process.env.NEXT_PUBLIC_APP_URL}/?deposit=success`,
          is_payment_multiple: false,
          lifetime: 3600,
        }),
      });
      const cryptomusData = await cryptomusRes.json();
      if (cryptomusData.result?.url) {
        await prisma.depositOrder.update({
          where: { id: deposit.id },
          data: { paymentUrl: cryptomusData.result.url },
        });
        deposit.paymentUrl = cryptomusData.result.url;
      }
    } catch (err) {
      console.warn('Cryptomus unavailable, deposit completed without gateway:', err.message);
    }

    return NextResponse.json({
      success: true,
      deposit,
      newBalance: user.balance + creditedUsd,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
