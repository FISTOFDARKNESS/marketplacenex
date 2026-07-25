import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const orders = await p.order.findMany({ where: { buyerId: null } });
  for (const o of orders) {
    await p.order.update({ where: { id: o.id }, data: { buyerId: o.userId } });
  }
  console.log('Backfilled ' + orders.length + ' orders');
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
