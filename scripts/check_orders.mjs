import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const allOrders = await p.order.findMany({ include: { item: true } });
  console.log('Total orders:', allOrders.length);
  for (const o of allOrders) {
    console.log(`  ${o.id} | userId:${o.userId} | buyerId:${o.buyerId} | robloxUser:${o.robloxUser} | item:${o.item?.name} | status:${o.status}`);
  }
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
