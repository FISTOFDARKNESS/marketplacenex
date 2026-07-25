import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ select: { id: true, username: true, robloxUsername: true } });
  for (const u of users) {
    console.log(u.id.slice(0,8)+'.. | '+u.username+' | roblox: '+(u.robloxUsername||'NONE'));
  }
} catch(e) { console.error(e.message); }
finally { await p.$disconnect(); }
