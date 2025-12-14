import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 检查数据库中的 'test' 资源...\n");

  // 查找标题包含 "test" 的资源
  const testResources = await prisma.resource.findMany({
    where: {
      OR: [
        { title: { contains: "test", mode: "insensitive" } },
        { description: { contains: "test", mode: "insensitive" } },
      ],
    },
    include: { category: true },
  });

  if (testResources.length === 0) {
    console.log("✅ 未发现任何包含 'test' 的资源");
  } else {
    console.log(`⚠️  发现 ${testResources.length} 个包含 'test' 的资源:\n`);
    testResources.forEach((resource) => {
      console.log(`ID: ${resource.id}`);
      console.log(`标题: ${resource.title}`);
      console.log(`分类: ${resource.category.name}`);
      console.log(`描述: ${resource.description}`);
      console.log(`创建时间: ${resource.createdAt}`);
      console.log("");
    });

    console.log("\n💡 如需删除这些资源，可以：");
    console.log("   1. 通过管理员导入界面删除");
    console.log("   2. 运行: npm run delete-test-resources");
  }

  // 显示总的资源统计
  const totalResources = await prisma.resource.count();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { resources: true } } },
  });

  console.log("\n📊 资源统计:");
  console.log(`总资源数: ${totalResources}`);
  console.log("\n按分类统计:");
  categories.forEach((cat) => {
    console.log(`- ${cat.name}: ${cat._count.resources} 个`);
  });
}

main()
  .catch((e) => {
    console.error("❌ 检查失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
