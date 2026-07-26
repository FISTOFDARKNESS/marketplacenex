import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req, { params }) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getIP(req);
  const limit = rateLimit('review-' + ip, 10, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const { id } = params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const existing = await prisma.assetReview.findUnique({
    where: { assetId_userId: { assetId: id, userId: user.id } },
  });

  if (existing) {
    const review = await prisma.assetReview.update({
      where: { id: existing.id },
      data: { rating, comment },
    });
    return NextResponse.json({ success: true, review });
  }

  const review = await prisma.assetReview.create({
    data: { assetId: id, userId: user.id, rating, comment },
  });

  return NextResponse.json({ success: true, review });
}
