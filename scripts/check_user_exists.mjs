import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const orders = await p.order.findMany({ select: { userId: true, buyerId: true } });
  const allUserIds = [...new Set(orders.flatMap(o => [o.userId, o.buyerId].filter(Boolean)))];
  console.log('Unique user IDs in orders:', allUserIds);
  for (const uid of allUserIds) {
    const user = await p.user.findUnique({ where: { id: uid }, select: { id: true, username: true } });
    console.log(`  ${uid}: ${user ? 'EXISTS - ' + user.username : 'MISSING!'}`);
  }
} catch(e) {
  console.error(e.message);
} finally {
  await p.$disconnect();
}
