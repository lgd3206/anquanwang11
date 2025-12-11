import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始初始化数据库...\n");

  // 创建分类
  console.log("📁 创建资源分类...");

  const categories = [
    {
      name: "安全课件",
      pointsCost: 10,
      description: "培训资料、讲座、PPT 等教学资源",
    },
    {
      name: "事故调查报告",
      pointsCost: 20,
      description: "安全事故调查报告、分析文档",
    },
    {
      name: "标准规范",
      pointsCost: 25,
      description: "行业标准、规程、条例等规范性文件",
    },
    {
      name: "事故警示视频",
      pointsCost: 15,
      description: "安全事故警示视频、案例分析视频",
    },
    {
      name: "安全管理书籍",
      pointsCost: 40,
      description: "安全管理相关的电子书籍、教材",
    },
  ];

  for (const category of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (existingCategory) {
      console.log(`  ✓ 分类 "${category.name}" 已存在`);
    } else {
      await prisma.category.create({
        data: category,
      });
      console.log(`  ✓ 创建分类 "${category.name}"`);
    }
  }

  console.log("\n✅ 数据库初始化完成！\n");

  // 显示统计信息
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const resourceCount = await prisma.resource.count();

  console.log("📊 数据库统计：");
  console.log(`  - 用户数：${userCount}`);
  console.log(`  - 分类数：${categoryCount}`);
  console.log(`  - 资源数：${resourceCount}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
