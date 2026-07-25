import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { robloxId } = await req.json();
    if (!robloxId) {
      return NextResponse.json({ error: 'Roblox ID required' }, { status: 400 });
    }

    let inventoryPublic = false;
    try {
      const invRes = await fetch(
        `https://inventory.roproxy.com/v1/users/${robloxId}/can-view-inventory`
      );
      if (invRes.ok) {
        const data = await invRes.json();
        inventoryPublic = data.canView === true;
      }
    } catch {
      inventoryPublic = false;
    }

    let hasPremium = false;
    try {
      const premRes = await fetch(
        `https://premiumfeatures.roblox.com/v1/users/${robloxId}/validate-membership`
      );
      if (premRes.ok) {
        hasPremium = await premRes.json();
      }
    } catch {
      hasPremium = false;
    }

    return NextResponse.json({
      success: true,
      inventoryPublic,
      hasPremium,
    });
  } catch (error) {
    console.error('Roblox verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
