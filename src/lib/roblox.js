const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36';

async function getXsrf(cookie) {
  const res = await fetch('https://auth.roblox.com/v2/logout', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: `.ROBLOSECURITY=${cookie}`,
    },
  });
  return res.headers.get('x-csrf-token') || '';
}

async function authedHeaders(cookie) {
  const xsrf = await getXsrf(cookie);
  return {
    'User-Agent': USER_AGENT,
    'X-CSRF-TOKEN': xsrf,
    'Content-Type': 'application/json',
    Cookie: `.ROBLOSECURITY=${cookie}`,
  };
}

export async function getRobloxUserId(cookie) {
  const res = await fetch('https://users.roblox.com/v1/users/authenticated', {
    headers: await authedHeaders(cookie),
  });
  if (!res.ok) throw new Error('Invalid cookie');
  const data = await res.json();
  return data.id;
}

export async function getRobuxBalance(cookie) {
  const userId = await getRobloxUserId(cookie);
  const res = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
    headers: await authedHeaders(cookie),
  });
  if (!res.ok) throw new Error('Failed to get Robux balance');
  const data = await res.json();
  return data.robux;
}

export async function createGamepass(cookie, universeId, amount) {
  const hdrs = await authedHeaders(cookie);

  // Create the gamepass
  const createRes = await fetch('https://apis.roblox.com/game-passes/v1/game-passes', {
    method: 'POST',
    headers: { ...hdrs },
    body: JSON.stringify({ Name: `NexBlox Deposit ${amount} Robux`, UniverseId: String(universeId) }),
  });
  if (!createRes.ok) throw new Error('Failed to create gamepass');
  const createData = await createRes.json();
  const passId = createData.gamePassId;

  // Set price and make it for sale
  const detailsRes = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${passId}/details`, {
    method: 'POST',
    headers: await authedHeaders(cookie),
    body: JSON.stringify({ IsForSale: 'true', Price: amount }),
  });
  if (!detailsRes.ok) throw new Error('Failed to set gamepass price');

  return passId;
}

export async function checkGamepassBought(cookie, passId) {
  const res = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${passId}/details`, {
    headers: await authedHeaders(cookie),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return (data.gamePassSalesData?.totalSales || 0) >= 1;
}

export async function checkUserOwnsGamepass(userId, passId) {
  const res = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${passId}`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.data && data.data.length > 0;
}

export async function getGamepassProductInfo(passId) {
  const res = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${passId}/product-info`);
  if (!res.ok) throw new Error('Failed to get gamepass info');
  return res.json();
}

export async function buyGamepass(cookie, passId) {
  const info = await getGamepassProductInfo(passId);
  const hdrs = await authedHeaders(cookie);

  const buyRes = await fetch(`https://economy.roblox.com/v1/purchases/products/${info.ProductId}`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({
      expectedCurrency: 1,
      expectedPrice: info.PriceInRobux,
      expectedSellerId: info.Creator.Id,
    }),
  });
  if (!buyRes.ok) throw new Error('Failed to purchase gamepass');
  return buyRes.json();
}

export async function fetchRobloxInventory(cookie, userId, assetType = 'Asset') {
  let allItems = [];
  let cursor = '';
  for (let page = 0; page < 10; page++) {
    const url = `https://inventory.roblox.com/v2/users/${userId}/inventory?assetTypes=${assetType}&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data.data) allItems = allItems.concat(data.data);
    if (!data.nextPageCursor) break;
    cursor = data.nextPageCursor;
  }
  return allItems;
}

export async function getRobloxAvatarUrl(userId) {
  const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0]?.imageUrl || null;
}
