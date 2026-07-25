import { NextResponse } from 'next/server';
import { createPayment } from '@/lib/cryptomus';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { amount, itemName, itemId } = await req.json();
    if (!amount || !itemId) {
      return NextResponse.json({ error: 'Amount and itemId required' }, { status: 400 });
    }

    const orderId = `${itemId}_${decoded.id}_${Date.now()}`;

    const result = await createPayment({
      amount,
      currency: 'USD',
      orderId,
      name: itemName || 'NexBlox Purchase',
    });

    return NextResponse.json({
      success: true,
      paymentUrl: result.result.url,
      paymentId: result.result.uuid,
      orderId,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
