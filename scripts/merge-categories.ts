import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('开始合并重复分类...\n');

  // 1. 将"事故报告"(ID:2)的资源迁移到"事故调查报告"(ID:9)
  const report1 = await prisma.resource.updateMany({
    where: { categoryId: 2 },
    data: { categoryId: 9 }
  });
  console.log(`✓ 已将 ${report1.count} 个资源从"事故报告"迁移到"事故调查报告"`);

  // 2. 将"警示视频"(ID:4)的资源迁移到"事故警示视频"(ID:8)
  const video1 = await prisma.resource.updateMany({
    where: { categoryId: 4 },
    data: { categoryId: 8 }
  });
  console.log(`✓ 已将 ${video1.count} 个资源从"警示视频"迁移到"事故警示视频"`);

  // 3. 删除旧分类"事故报告"(ID:2)
  await prisma.category.delete({
    where: { id: 2 }
  });
  console.log('✓ 已删除分类"事故报告"');

  // 4. 删除旧分类"警示视频"(ID:4)
  await prisma.category.delete({
    where: { id: 4 }
  });
  console.log('✓ 已删除分类"警示视频"');

  console.log('\n合并完成！当前分类：');
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { resources: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  categories.forEach(cat => {
    console.log(`- ${cat.name} (ID: ${cat.id}, 资源数: ${cat._count.resources})`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
