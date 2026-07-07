import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const result = await p.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Order' ORDER BY ordinal_position");
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
