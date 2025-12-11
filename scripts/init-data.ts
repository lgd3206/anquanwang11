import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始初始化数据...");

  // 创建分类
  const categories = [
    {
      name: "安全课件",
      pointsCost: 5,
      description: "安全培训课件和资源",
    },
    {
      name: "事故报告",
      pointsCost: 15,
      description: "典型事故调查报告",
    },
    {
      name: "标准规范",
      pointsCost: 20,
      description: "安全生产标准和规范",
    },
    {
      name: "警示视频",
      pointsCost: 10,
      description: "安全警示教育视频",
    },
    {
      name: "安全书籍",
      pointsCost: 30,
      description: "安全管理相关书籍",
    },
  ];

  console.log("正在创建分类...");
  const createdCategories = [];
  for (const cat of categories) {
    try {
      const existing = await prisma.category.findUnique({
        where: { name: cat.name },
      });
      if (!existing) {
        const created = await prisma.category.create({ data: cat });
        createdCategories.push(created);
        console.log(`✓ 创建分类: ${cat.name}`);
      } else {
        createdCategories.push(existing);
        console.log(`- 分类已存在: ${cat.name}`);
      }
    } catch (error) {
      console.error(`✗ 创建分类失败 ${cat.name}:`, error);
    }
  }

  // 创建示例资源
  const resources = [
    {
      title: "2024年生产安全事故典型案例分析",
      categoryId: createdCategories.find((c) => c.name === "事故报告")?.id || 1,
      description: "包含10起典型生产安全事故的详细分析和教训",
      mainLink: "https://example.com/accident-2024",
      password: "123456",
      backupLink1: "https://backup1.com/accident-2024",
      source: "baidu",
      pointsCost: 15,
    },
    {
      title: "GB/T 45001-2024 职业健康安全管理体系",
      categoryId: createdCategories.find((c) => c.name === "标准规范")?.id || 3,
      description: "最新的职业健康安全管理体系国家标准",
      mainLink: "https://example.com/gb45001",
      password: "pwd123",
      backupLink1: "https://backup1.com/gb45001",
      source: "quark",
      pointsCost: 20,
    },
    {
      title: "安全生产管理基础知识",
      categoryId: createdCategories.find((c) => c.name === "安全课件")?.id || 1,
      description: "全面的安全生产管理基础知识培训课件",
      mainLink: "https://example.com/basic-safety",
      password: "safe123",
      backupLink1: "https://backup1.com/basic-safety",
      source: "baidu",
      pointsCost: 5,
    },
    {
      title: "煤矿事故预防与应急处置",
      categoryId: createdCategories.find((c) => c.name === "警示视频")?.id || 4,
      description: "煤矿典型事故预防和应急处置视频教材",
      mainLink: "https://example.com/coal-safety",
      password: "video123",
      backupLink1: "https://backup1.com/coal-safety",
      backupLink2: "https://backup2.com/coal-safety",
      source: "quark",
      pointsCost: 10,
    },
    {
      title: "企业安全文化建设指南",
      categoryId: createdCategories.find((c) => c.name === "安全书籍")?.id || 5,
      description: "如何在企业中建设强大的安全文化",
      mainLink: "https://example.com/safety-culture",
      password: "book123",
      backupLink1: "https://backup1.com/safety-culture",
      source: "baidu",
      pointsCost: 30,
    },
    {
      title: "建筑施工安全生产规范",
      categoryId: createdCategories.find((c) => c.name === "标准规范")?.id || 3,
      description: "建筑工程施工现场安全生产规范要求",
      mainLink: "https://example.com/construction-safety",
      password: "const123",
      backupLink1: "https://backup1.com/construction-safety",
      source: "quark",
      pointsCost: 20,
    },
    {
      title: "工业企业安全管理基础",
      categoryId: createdCategories.find((c) => c.name === "安全课件")?.id || 1,
      description: "工业企业日常安全管理实践指南",
      mainLink: "https://example.com/industrial-safety",
      password: "ind123",
      backupLink1: "https://backup1.com/industrial-safety",
      source: "baidu",
      pointsCost: 5,
    },
    {
      title: "危险化学品安全操作手册",
      categoryId: createdCategories.find((c) => c.name === "安全书籍")?.id || 5,
      description: "危险化学品的安全识别和操作规程",
      mainLink: "https://example.com/chemical-safety",
      password: "chem123",
      backupLink1: "https://backup1.com/chemical-safety",
      source: "quark",
      pointsCost: 30,
    },
  ];

  console.log("正在创建资源...");
  for (const resource of resources) {
    try {
      const existing = await prisma.resource.findFirst({
        where: { title: resource.title },
      });
      if (!existing) {
        await prisma.resource.create({ data: resource });
        console.log(`✓ 创建资源: ${resource.title}`);
      } else {
        console.log(`- 资源已存在: ${resource.title}`);
      }
    } catch (error) {
      console.error(`✗ 创建资源失败 ${resource.title}:`, error);
    }
  }

  console.log("初始化完成！");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
