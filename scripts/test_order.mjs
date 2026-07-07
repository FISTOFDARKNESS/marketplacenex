import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ take: 2, select: { id: true, username: true } });
  console.log('Users:', JSON.stringify(users));
  const item = await p.item.findFirst({ select: { id: true, name: true, price: true } });
  console.log('Item:', JSON.stringify(item));

  if (item && users[0]) {
    const order = await p.order.create({
      data: { userId: users[0].id, buyerId: users[0].id, itemId: item.id, robloxUser: 'test', status: 'PENDING' },
    });
    console.log('Order created:', order.id);
    // Clean up
    await p.order.delete({ where: { id: order.id } });
    console.log('Order deleted OK');
  } else {
    console.log('Missing item or users');
  }
} catch (e) {
  console.error('Error:', e);
} finally {
  await p.$disconnect();
}
