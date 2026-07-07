const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.user.updateMany({ data: { balance: 0 } });
  console.log('Updated', r.count, 'users');
}

main().finally(() => prisma.$disconnect());
