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
    data: { username: 'admin', email: 'admin@nexblox.com', passwordHash: adminPassword, role: 'admin' },
  });

  const seller = await prisma.user.create({
    data: { username: 'nexblox_seller', email: 'seller@nexblox.com', passwordHash: sellerPassword, role: 'user' },
  });

  const buyer = await prisma.user.create({
    data: { username: 'dev_buyer', email: 'buyer@nexblox.com', passwordHash: buyerPassword, role: 'user' },
  });

  await prisma.seller.deleteMany();
  const sellers = [
    { displayId: 'NX-A7K9M2', name: 'Nexus Prime', markup: 0 },
    { displayId: 'NX-4B3X8P', name: 'Crystal Vault', markup: 0.01 },
    { displayId: 'NX-9W1P6R', name: 'Golden Trade', markup: 0.015 },
    { displayId: 'NX-5D20R8', name: 'Limited Hub', markup: 0.02 },
  ];
  for (const s of sellers) {
    await prisma.seller.create({ data: s });
  }
  console.log('Created sellers:', sellers.length);

  console.log('Created users:', { admin: admin.username, seller: seller.username, buyer: buyer.username });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
