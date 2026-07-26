import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { assetId } = await req.json();
    if (!assetId) return NextResponse.json({ error: 'Missing assetId' }, { status: 400 });
    const uploadId = crypto.randomUUID();
    return NextResponse.json({ success: true, uploadId, assetId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
