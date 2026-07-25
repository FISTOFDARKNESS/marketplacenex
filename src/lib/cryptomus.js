import { createHmac } from 'node:crypto';

const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.CRYPTOMUS_API_KEY;

function signBody(body) {
  const json = JSON.stringify(body);
  const base64 = Buffer.from(json).toString('base64');
  return createHmac('sha256', API_KEY).update(base64).digest('hex');
}

export async function createPayment({ amount, currency, orderId, name }) {
  const body = {
    amount: String(amount),
    currency: currency || 'USD',
    order_id: orderId,
    name: name || 'NexBlox Purchase',
  };

  const res = await fetch('https://api.cryptomus.com/v1/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      merchant: MERCHANT_ID,
      sign: signBody(body),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cryptomus error: ${err}`);
  }

  return res.json();
}
