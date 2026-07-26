import { NextResponse } from 'next/server';
import { saveFile } from '@/lib/upload';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('type');
    const folder = formData.get('folder');

    if (!file || !fileType) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    const url = await saveFile(file, fileType, folder);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
