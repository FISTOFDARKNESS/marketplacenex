import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verification = await prisma.robloxVerification.findFirst({
      where: { userId: decoded.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (!verification) return NextResponse.json({ error: 'No pending verification' }, { status: 400 });

    const robloxRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(verification.robloxUsername)}&limit=1`);
    if (!robloxRes.ok) return NextResponse.json({ error: 'Failed to lookup Roblox user' }, { status: 502 });

    const searchData = await robloxRes.json();
    const found = searchData.data?.[0];
    if (!found) return NextResponse.json({ error: 'Roblox user not found' }, { status: 404 });

    const profileRes = await fetch(`https://users.roblox.com/v1/users/${found.id}`);
    if (!profileRes.ok) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 502 });
    const profile = await profileRes.json();

    const bio = (profile.description || '').toLowerCase();
    const phraseLower = verification.phrase.toLowerCase();

    if (!bio.includes(phraseLower)) {
      return NextResponse.json({ success: false, message: 'Phrase not found in bio. Put it in your Roblox bio and try again.' });
    }

    await prisma.robloxVerification.update({
      where: { id: verification.id },
      data: { status: 'VERIFIED' },
    });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { robloxId: BigInt(found.id), robloxUsername: found.name },
    });

    return NextResponse.json({ success: true, robloxId: found.id, robloxUsername: found.name });
  } catch (error) {
    console.error('Verify check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
