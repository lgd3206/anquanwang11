import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// 加载环境变量
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 开始数据库迁移...\n");

  try {
    // 检查新分类是否已存在
    const existingCategory = await prisma.category.findUnique({
      where: { name: "HAZOP/SIL/LOPA" },
    });

    if (existingCategory) {
      console.log("⏭️  分类已存在: HAZOP/SIL/LOPA");
      return;
    }

    // 创建新分类
    const newCategory = await prisma.category.create({
      data: {
        name: "HAZOP/SIL/LOPA",
        pointsCost: 15, // 默认消耗
        description: "危害与可操作性分析（HAZOP）、安全完整性等级（SIL）、失效模式与影响分析（LOPA）相关资料",
      },
    });

    console.log("✅ 成功创建分类:");
    console.log(`   名称: ${newCategory.name}`);
    console.log(`   默认积分: ${newCategory.pointsCost}`);
    console.log(`   描述: ${newCategory.description}\n`);

    // 显示所有分类统计
    const allCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log("📊 当前分类列表（共 " + allCategories.length + " 个）:\n");
    allCategories.forEach((cat) => {
      console.log(`   - ${cat.name}: ${cat._count.resources} 个资源，默认积分 ${cat.pointsCost}`);
    });

    console.log("\n✨ 迁移完成！\n");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
