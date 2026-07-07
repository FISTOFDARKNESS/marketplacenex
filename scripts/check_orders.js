const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      item: { select: { name: true } },
      user: { select: { username: true, robloxUsername: true } },
      buyer: { select: { username: true, robloxUsername: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('Total orders in DB:', orders.length);
  console.log('');

  orders.forEach(o => {
    console.log('---');
    console.log('Order ID (last 6):', o.id.slice(-6));
    console.log('Status:', o.status);
    console.log('Item:', o.item?.name);
    console.log('robloxUser (sent to):', o.robloxUser);
    console.log('userId (recipient in system):', o.userId);
    console.log('buyerId (buyer in system):', o.buyerId);
    console.log('Recipient username:', o.user?.username, '| roblox:', o.user?.robloxUsername);
    console.log('Buyer username:', o.buyer?.username, '| roblox:', o.buyer?.robloxUsername);
  });

  // Also show all users with their IDs and roblox usernames
  console.log('\n=== ALL USERS ===');
  const users = await prisma.user.findMany({
    select: { id: true, username: true, robloxUsername: true, role: true }
  });
  users.forEach(u => {
    console.log(`id=${u.id.slice(-6)} | username=${u.username} | roblox=${u.robloxUsername} | role=${u.role}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
