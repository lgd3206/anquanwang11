require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("开始更新资源分类体系...");

  try {
    // 定义最终的分类配置
    const categoriesOrder = [
      // 新增分类
      { name: "应急预案", pointsCost: 10, description: "应急预案和应急管理相关资料" },
      { name: "职业健康", pointsCost: 8, description: "职业卫生和员工健康相关资源" },
      { name: "安全培训/PPT", pointsCost: 10, description: "安全培训教材和PPT演讲稿" },
      { name: "隐患排查", pointsCost: 5, description: "隐患排查方法、检查清单和表单" },

      // 保留的现有分类（新的排序）
      { name: "化工安全", pointsCost: 10 },
      { name: "消防", pointsCost: 15 },
      { name: "HAZOP/SIL/LOPA", pointsCost: 15 },
      { name: "事故警示视频", pointsCost: 10 },
      { name: "事故调查报告", pointsCost: 5 },
      { name: "制度规程", pointsCost: 5 },
      { name: "安全书籍", pointsCost: 30 },
      { name: "标准规范", pointsCost: 5 },
      { name: "注安", pointsCost: 20 },
    ];

    console.log("\n1. 获取当前分类...");
    const allCategories = await prisma.category.findMany();
    console.log(`   当前有 ${allCategories.length} 个分类`);

    // 2. 识别需要合并的资源
    console.log("\n2. 检查需要合并的分类...");

    // 先确保目标分类"安全培训/PPT"存在
    let targetCategory = await prisma.category.findUnique({
      where: { name: "安全培训/PPT" }
    });

    if (!targetCategory) {
      console.log("   创建目标分类: 安全培训/PPT");
      targetCategory = await prisma.category.create({
        data: {
          name: "安全培训/PPT",
          pointsCost: 10,
          description: "安全培训教材和PPT演讲稿"
        }
      });
    }

    // 查找要删除的分类及其资源
    const toMerge = [
      { oldName: "安全课件", newCategoryId: targetCategory.id },
      { oldName: "检查表", newCategoryId: await getPriorityCategory("隐患排查") }
    ];

    for (const merge of toMerge) {
      const oldCategory = await prisma.category.findUnique({
        where: { name: merge.oldName }
      });

      if (oldCategory) {
        const resourceCount = await prisma.resource.count({
          where: { categoryId: oldCategory.id }
        });

        if (resourceCount > 0) {
          console.log(`\n   正在合并 "${merge.oldName}" (${resourceCount} 个资源)`);

          // 将资源转移到新分类（使用原始SQL）
          await prisma.$executeRawUnsafe(
            `UPDATE resources SET "categoryId" = $1 WHERE "categoryId" = $2`,
            merge.newCategoryId,
            oldCategory.id
          );
          console.log(`   ✓ 已转移 ${resourceCount} 个资源`);
        }

        // 删除旧分类
        await prisma.category.delete({
          where: { name: merge.oldName }
        });
        console.log(`   ✓ 已删除分类: ${merge.oldName}`);
      }
    }

    // 3. 新增或更新分类
    console.log("\n3. 同步分类配置...");
    for (const catConfig of categoriesOrder) {
      const existing = await prisma.category.findUnique({
        where: { name: catConfig.name }
      });

      if (existing) {
        // 更新现有分类
        await prisma.category.update({
          where: { name: catConfig.name },
          data: {
            pointsCost: catConfig.pointsCost,
            description: catConfig.description || existing.description,
          }
        });
        console.log(`   ✓ 更新: ${catConfig.name}`);
      } else {
        // 新增分类
        await prisma.category.create({
          data: {
            name: catConfig.name,
            pointsCost: catConfig.pointsCost,
            description: catConfig.description || "",
          }
        });
        console.log(`   ✓ 新增: ${catConfig.name}`);
      }
    }

    // 4. 显示最终结果
    console.log("\n4. 最终分类列表:");
    const finalCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { resources: true }
        }
      },
      orderBy: { name: "asc" }
    });

    finalCategories.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.name} (${cat.pointsCost}点, ${cat._count.resources}个资源)`);
    });

    console.log("\n✓ 分类更新完成！");
    console.log("\n📋 前端展示顺序（按优先级）:");
    console.log("全部分类 | 🎁免积分资源 | 化工安全 | 消防 | HAZOP/SIL/LOPA");
    console.log("| 应急预案 | 职业健康 | 安全培训/PPT | 隐患排查 | 事故警示视频");
    console.log("| 事故调查报告 | 制度规程 | 安全书籍 | 标准规范 | 注安");

  } catch (error) {
    console.error("✗ 错误:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 辅助函数：获取目标分类ID
async function getPriorityCategory(name) {
  let category = await prisma.category.findUnique({
    where: { name }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        pointsCost: 5,
        description: ""
      }
    });
  }

  return category.id;
}

main();

