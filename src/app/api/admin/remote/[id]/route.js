import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin: approve or end a remote session.
export async function POST(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { action } = await req.json();
    if (action === 'approve') {
      await prisma.remoteSession.update({
        where: { id: params.id },
        data: { status: 'APPROVED', approvedAt: new Date(), adminId: user.id },
      });
    } else if (action === 'end') {
      await prisma.remoteSession.delete({
        where: { id: params.id },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remote action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
