import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const decodedId = '82637c8c-b8df-4e0b-83cf-535d5a18bffb';
  const orders = await p.order.findMany({
    where: { userId: decodedId },
    include: { item: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Orders found:', orders.length);
  console.log('First order item:', orders[0]?.item?.name);
  console.log('All OK:', orders.length > 0);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
