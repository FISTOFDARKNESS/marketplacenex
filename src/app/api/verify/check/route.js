import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      verified: true,
      robloxUsername: true,
      robloxUserId: true,
      universeId: true,
      robloxCookie: true,
    },
  });

  return NextResponse.json({ success: true, verified: fullUser?.verified || false, user: fullUser });
}
