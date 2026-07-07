import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, sellers });
  } catch (error) {
    console.error('Fetch sellers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
