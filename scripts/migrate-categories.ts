import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 开始分类迁移...\n");

  try {
    // 1. 创建新分类
    const newCategories = [
      { name: "制度规程", default: 5 },
      { name: "检查表", default: 3 },
      { name: "注安", default: 20 },
      { name: "消防", default: 15 },
    ];

    for (const cat of newCategories) {
      const existing = await prisma.category.findUnique({
        where: { name: cat.name },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            pointsCost: cat.default,
          },
        });
        console.log(`✅ 创建分类: ${cat.name}`);
      } else {
        console.log(`⏭️  分类已存在: ${cat.name}`);
      }
    }

    // 2. 创建或更新"安全书籍"分类
    const safeBookCategory = await prisma.category.findUnique({
      where: { name: "安全书籍" },
    });

    if (!safeBookCategory) {
      await prisma.category.create({
        data: {
          name: "安全书籍",
          pointsCost: 30,
        },
      });
      console.log(`✅ 创建分类: 安全书籍`);
    } else {
      console.log(`⏭️  分类已存在: 安全书籍`);
    }

    // 3. 获取要合并的旧分类
    const oldCategory1 = await prisma.category.findUnique({
      where: { name: "安全书箱" },
    });
    const oldCategory2 = await prisma.category.findUnique({
      where: { name: "安全管理书籍" },
    });

    if (oldCategory1 || oldCategory2) {
      const newCategory = await prisma.category.findUnique({
        where: { name: "安全书籍" },
      });

      // 合并资源
      if (oldCategory1) {
        const count1 = await prisma.resource.updateMany({
          where: { categoryId: oldCategory1.id },
          data: { categoryId: newCategory!.id },
        });
        console.log(
          `✅ 将 ${count1.count} 个资源从 "安全书箱" 迁移至 "安全书籍"`
        );
      }

      if (oldCategory2) {
        const count2 = await prisma.resource.updateMany({
          where: { categoryId: oldCategory2.id },
          data: { categoryId: newCategory!.id },
        });
        console.log(
          `✅ 将 ${count2.count} 个资源从 "安全管理书籍" 迁移至 "安全书籍"`
        );
      }

      // 删除旧分类
      if (oldCategory1) {
        await prisma.category.delete({
          where: { id: oldCategory1.id },
        });
        console.log(`🗑️  删除旧分类: 安全书箱`);
      }

      if (oldCategory2) {
        await prisma.category.delete({
          where: { id: oldCategory2.id },
        });
        console.log(`🗑️  删除旧分类: 安全管理书籍`);
      }
    }

    // 4. 显示最终的分类列表
    const allCategories = await prisma.category.findMany({
      include: { _count: { select: { resources: true } } },
      orderBy: { name: "asc" },
    });

    console.log("\n📊 最终分类列表:");
    for (const cat of allCategories) {
      console.log(`  - ${cat.name}: ${cat._count.resources} 个资源`);
    }

    console.log(`\n✅ 迁移完成！总共 ${allCategories.length} 个分类`);
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
