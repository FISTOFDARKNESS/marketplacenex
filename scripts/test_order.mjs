import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ take: 1, select: { id: true, username: true } });
  const item = await p.item.findFirst({ select: { id: true, name: true, price: true } });
  console.log('User:', users[0]?.id, 'Item:', item?.id);

  // Test WITHOUT buyerId (simulating old code)
  const order = await p.order.create({
    data: { userId: users[0].id, itemId: item.id, robloxUser: 'test_old_code', status: 'PENDING' },
  });
  console.log('Order created without buyerId:', order.id);
  await p.order.delete({ where: { id: order.id } });
  console.log('OK');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
