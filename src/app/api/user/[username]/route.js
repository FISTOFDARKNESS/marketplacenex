import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { username } = params;

    const users = await sql('SELECT "id", "username", "avatarUrl", "aboutMe", "verified", "createdAt" FROM "User" WHERE "username" = $1 LIMIT 1', [username]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    const [assets, assetsCount, followersCount, followingCount] = await Promise.all([
      sql('SELECT * FROM "Asset" WHERE "ownerId" = $1 AND "status" = $2 ORDER BY "createdAt" DESC LIMIT 50', [user.id, 'APPROVED']),
      sql('SELECT COUNT(*)::int AS count FROM "Asset" WHERE "ownerId" = $1 AND "status" = $2', [user.id, 'APPROVED']).then(r => r[0]?.count || 0),
      sql('SELECT COUNT(*)::int AS count FROM "Follow" WHERE "followingId" = $1', [user.id]).then(r => r[0]?.count || 0),
      sql('SELECT COUNT(*)::int AS count FROM "Follow" WHERE "followerId" = $1', [user.id]).then(r => r[0]?.count || 0),
    ]);

    user._count = { assets: assetsCount, followers: followersCount, following: followingCount };

    return NextResponse.json({ success: true, user, assets });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { getAuthUser } = await import('@/lib/auth');
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = params;
  if (authUser.username !== username && authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { aboutMe, avatarUrl } = await req.json();

  await prisma.user.update({
    where: { username },
    data: { aboutMe, avatarUrl },
  });

  return NextResponse.json({ success: true });
}
