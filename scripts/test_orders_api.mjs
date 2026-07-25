import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const orders = await p.order.findMany({
    where: { OR: [ { userId: '82637c8c-b8df-4e0b-83cf-535d5a18bffb' } ] },
    include: { item: true, user: { select: { username: true, robloxUsername: true } }, buyer: { select: { username: true, robloxUsername: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Orders count:', orders.length);
  console.log('First item:', orders[0]?.item?.name);
  console.log('Buyer:', JSON.stringify(orders[0]?.buyer));
  console.log('User:', JSON.stringify(orders[0]?.user));
  console.log('SUCCESS');
} catch(e) {
  console.error('ERROR:', e.message, e.stack);
} finally {
  await p.$disconnect();
}
