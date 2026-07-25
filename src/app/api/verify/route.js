import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { robloxCookie, robloxUserId, universeId } = await req.json();

  if (!robloxCookie || !robloxUserId || !universeId) {
    return NextResponse.json({ error: 'Cookie, Roblox User ID, and Universe ID are required' }, { status: 400 });
  }

  const robloxId = BigInt(robloxUserId);

  let robloxUsername = null;
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`);
    if (res.ok) {
      const data = await res.json();
      robloxUsername = data.name || null;
    }
  } catch {}

  await prisma.user.update({
    where: { id: user.id },
    data: {
      robloxCookie,
      robloxUserId: robloxId,
      robloxUsername,
      universeId: BigInt(universeId),
      verified: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'system',
      title: 'Account Verified',
      message: 'Congratulations! Your account has been verified. You can now set Robux prices on your assets.',
      link: `/profile/${user.username}`,
    },
  });

  return NextResponse.json({ success: true, robloxUsername });
}
