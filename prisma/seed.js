const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.wishlist.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);

  const admin = await prisma.user.create({
    data: { username: 'admin', email: 'admin@nexblox.com', passwordHash: adminPassword, role: 'admin', balance: 1000000.0 },
  });

  const seller = await prisma.user.create({
    data: { username: 'nexblox_seller', email: 'seller@nexblox.com', passwordHash: sellerPassword, role: 'user', balance: 500.0 },
  });

  const buyer = await prisma.user.create({
    data: { username: 'dev_buyer', email: 'buyer@nexblox.com', passwordHash: buyerPassword, role: 'user', balance: 15000.0 },
  });

  console.log('Created users:', { admin: admin.username, seller: seller.username, buyer: buyer.username });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
