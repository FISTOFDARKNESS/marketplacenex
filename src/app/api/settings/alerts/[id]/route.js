import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { onPriceUp, onPriceDown, onRapUp, onRapDown, duration } = await req.json();

    const existing = await prisma.priceAlert.findFirst({ where: { id: params.id, userId: decoded.id } });
    if (!existing) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    const alert = await prisma.priceAlert.update({
      where: { id: params.id },
      data: {
        onPriceUp: onPriceUp !== undefined ? !!onPriceUp : existing.onPriceUp,
        onPriceDown: onPriceDown !== undefined ? !!onPriceDown : existing.onPriceDown,
        onRapUp: onRapUp !== undefined ? !!onRapUp : existing.onRapUp,
        onRapDown: onRapDown !== undefined ? !!onRapDown : existing.onRapDown,
        duration: duration !== undefined ? (typeof duration === 'number' && duration > 0 ? duration : null) : existing.duration,
      },
    });

    return NextResponse.json({ success: true, id: alert.id });
  } catch (error) {
    console.error('Patch alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    const decoded = token && verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await prisma.priceAlert.deleteMany({ where: { id: params.id, userId: decoded.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
