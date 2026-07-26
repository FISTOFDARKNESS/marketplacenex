import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uploadId = crypto.randomUUID();
  return NextResponse.json({ success: true, uploadId });
}
