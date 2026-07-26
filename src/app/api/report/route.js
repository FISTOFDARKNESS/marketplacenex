import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getIP(req);
  const limit = rateLimit('report-' + ip, 5, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many reports. Try again later.' }, { status: 429 });
  }

  const { targetId, reason } = await req.json();
  if (!targetId || !reason || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Please provide a valid asset ID and a reason (min 10 characters).' }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({ where: { id: targetId } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  await prisma.report.create({
    data: { reporterId: user.id, target: targetId, reason: reason.trim() },
  });

  return NextResponse.json({ success: true, message: 'Report submitted. An admin will review it.' });
}
