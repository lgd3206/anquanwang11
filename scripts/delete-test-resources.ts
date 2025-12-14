import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  开始删除 'test' 资源...\n");

  // 查找并删除标题包含 "test" 的资源
  const testResources = await prisma.resource.findMany({
    where: {
      OR: [
        { title: { contains: "test", mode: "insensitive" } },
        { description: { contains: "test", mode: "insensitive" } },
      ],
    },
  });

  if (testResources.length === 0) {
    console.log("✅ 未发现需要删除的 'test' 资源\n");
    return;
  }

  // 删除相关的下载记录（外键约束）
  const downloadCount = await prisma.download.deleteMany({
    where: {
      resourceId: {
        in: testResources.map((r) => r.id),
      },
    },
  });

  // 删除资源
  const resourceCount = await prisma.resource.deleteMany({
    where: {
      OR: [
        { title: { contains: "test", mode: "insensitive" } },
        { description: { contains: "test", mode: "insensitive" } },
      ],
    },
  });

  console.log(`✅ 删除完成！`);
  console.log(`   - 删除资源: ${resourceCount.count} 个`);
  console.log(`   - 删除下载记录: ${downloadCount.count} 条\n`);
}

main()
  .catch((e) => {
    console.error("❌ 删除失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
