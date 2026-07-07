import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Roblox API error' }, { status: 502 });
    }

    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = data.data[0];

    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`
    );
    let avatarUrl = null;
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json();
      if (thumbData.data && thumbData.data.length > 0) {
        avatarUrl = thumbData.data[0].imageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      robloxId: user.id,
      displayName: user.displayName,
      avatarUrl,
    });
  } catch (error) {
    console.error('Roblox lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
