import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PHRASES = [
  'NexBlox verification', 'Trade confirmed', 'Account linked',
  'Marketplace verified', 'Secure trade', 'Identity confirmed',
  'Roblox connected', 'Verified trader', 'Nexus bond',
  'Crystal clear', 'Golden access', 'Limited edition',
  'Prime status', 'Vault secured', 'Hub verified',
  'Token active', 'Trade ready', 'Profile confirmed',
  'Asset linked', 'Inventory checked', 'Bio verified',
  'NexBlox secure', 'Cross check', 'Valid account',
  'Match found', 'Verified user', 'Auth token',
  'Sync complete', 'Trust confirmed', 'Gateway open',
  'Verified link', 'Account bound',
];

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { robloxUsername } = await req.json();
    if (!robloxUsername) return NextResponse.json({ error: 'Roblox username required' }, { status: 400 });

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];

    await prisma.robloxVerification.create({
      data: { userId: decoded.id, robloxUsername, phrase },
    });

    return NextResponse.json({ success: true, phrase });
  } catch (error) {
    console.error('Verify start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
