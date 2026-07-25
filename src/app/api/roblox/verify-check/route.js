import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function fetchBioViaAPI(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.description || '';
}

async function fetchBioViaProfile(userId) {
  try {
    const res = await fetch(`https://www.roblox.com/users/${userId}/profile`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"description":"([^"]+)"/);
    return match ? match[1] : '';
  } catch {
    return null;
  }
}

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

    const robloxId = Number(verification.robloxId);
    if (!robloxId) return NextResponse.json({ error: 'Invalid Roblox ID' }, { status: 400 });

    let bio = await fetchBioViaAPI(robloxId);
    if (bio === null) bio = await fetchBioViaProfile(robloxId) || '';
    if (bio === null) return NextResponse.json({ error: 'Failed to fetch profile bio' }, { status: 502 });

    const phraseLower = verification.phrase.toLowerCase();
    if (!bio.toLowerCase().includes(phraseLower)) {
      return NextResponse.json({ success: false, message: 'Phrase not found in bio. Put it in your Roblox bio and try again.' });
    }

    await prisma.robloxVerification.update({
      where: { id: verification.id },
      data: { status: 'VERIFIED' },
    });

    const nameRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    const nameData = nameRes.ok ? await nameRes.json() : { name: verification.robloxUsername };

    await prisma.user.update({
      where: { id: decoded.id },
      data: { robloxId: BigInt(robloxId), robloxUsername: nameData.name },
    });

    return NextResponse.json({ success: true, robloxId, robloxUsername: nameData.name });
  } catch (error) {
    console.error('Verify check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
