const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36';

function getApiKey() {
  const key = process.env.ROBLOX_OPEN_CLOUD_API_KEY;
  if (!key) throw new Error('ROBLOX_OPEN_CLOUD_API_KEY not set');
  return key;
}

function getUniverseId() {
  const id = process.env.ROBLOX_UNIVERSE_ID;
  if (!id) throw new Error('ROBLOX_UNIVERSE_ID not set');
  return id;
}

export async function createGamePass(name, priceRobux) {
  const universeId = getUniverseId();
  const apiKey = getApiKey();

  const createRes = await fetch('https://apis.roblox.com/game-passes/v1/game-passes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      Name: name,
      UniverseId: String(universeId),
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create gamepass: ${createRes.status} ${errText}`);
  }

  const createData = await createRes.json();
  const passId = createData.gamePassId;

  const detailsRes = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${passId}/details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({ IsForSale: 'true', Price: priceRobux }),
  });

  if (!detailsRes.ok) {
    const errText = await detailsRes.text();
    throw new Error(`Failed to set gamepass price: ${detailsRes.status} ${errText}`);
  }

  return passId;
}

export async function checkUserOwnsGamePass(userId, gamePassId) {
  const apiKey = getApiKey();

  const res = await fetch(
    `https://apis.roblox.com/ownership/v1/users/${userId}/items/GamePass/${gamePassId}`,
    {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': USER_AGENT,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roblox ownership check failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const ownership = data.ownership || data.items || [];
  return Array.isArray(ownership) ? ownership.length > 0 : !!ownership;
}
