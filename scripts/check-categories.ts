import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { resources: true }
      }
    }
  });

  console.log('当前分类：');
  categories.forEach(cat => {
    console.log(`- ${cat.name} (ID: ${cat.id}, 资源数: ${cat._count.resources})`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
