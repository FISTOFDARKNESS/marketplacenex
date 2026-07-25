import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const session = await prisma.session.findUnique({ where: { id: params.id } });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    await prisma.session.delete({ where: { id: params.id } });

    logAudit({
      action: 'admin.session.revoke',
      userId: decoded.id,
      target: params.id,
      req,
      meta: { revokedUserId: session.userId, ip: session.ip },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin revoke session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
