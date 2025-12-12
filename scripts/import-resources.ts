import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const resources = [
  { title: "纳永良 主动预防事故的管理方程式与数智化系统", link: "https://pan.baidu.com/s/1GqGILdBvOVn1veKd2lJeTA?pwd=5678", password: "5678" },
  { title: "刘子龙-煤制油公司安全生产管理体系建设及运行分享", link: "https://pan.baidu.com/s/1CD8Vg48JxCAK3gAEbS4RYw?pwd=5678", password: "5678" },
  { title: "张良-炼化企业作业安全管控实践分享", link: "https://pan.baidu.com/s/1zzHrNoA-k7Ric4Np90R4Xw?pwd=5678", password: "5678" },
  { title: "周超-以关键风险评估赋能化工企业专业安全管理", link: "https://pan.baidu.com/s/1jz9UsVTqceCZtzzaoG3anw?pwd=5678", password: "5678" },
  { title: "舒随-根除违章，减少失误，让安全成为一种习惯", link: "https://pan.baidu.com/s/1CrPy1x2eBtm0PmAQPXjtWw?pwd=5678", password: "5678" },
  { title: "魏利军-化工园区安全韧性体系的构建与应用", link: "https://pan.baidu.com/s/1mFtVNUJGfDU5LIzzq5ralQ?pwd=5678", password: "5678" },
  { title: "侯福庄-基于设备完整性和可靠性管理的设备完好性管理探讨", link: "https://pan.baidu.com/s/1LeYMGMleQxgSfhGVu9_s5g?pwd=5678", password: "5678" },
  { title: "胡苏-扬子石化双重预防机制建设的良好实践", link: "https://pan.baidu.com/s/1MuyQQ7uZJ6byZ1ASG5dnTA?pwd=5678", password: "5678" },
  { title: "雍容-基于深度学习的化工过程异常工况实时识别与动态调控研究", link: "https://pan.baidu.com/s/1bukQcGf2SmLfdx4tHxVE8w?pwd=5678", password: "5678" },
  { title: "程长进-落实过程安全管理，提升屡查屡犯五类问题防控能力", link: "https://pan.baidu.com/s/174sRlf8a6Spy0KcB7Y07Kg?pwd=5678", password: "5678" },
  { title: "张东平-风险辩识与隐患排查技术的实践应用", link: "https://pan.baidu.com/s/1mlP3ZlVrT51E_ZobL7kORQ?pwd=5678", password: "5678" },
  { title: "刘慧茹-企业化工过程安全管理提升的方法、路径及成效", link: "https://pan.baidu.com/s/1aXSHutWLGhoUumXwYcTvyA?pwd=5678", password: "5678" },
  { title: "董小刚-如何做好化工过程异常风险评估", link: "https://pan.baidu.com/s/1SYZd9cVpaJFZufggGHCyZw?pwd=5678", password: "5678" },
  { title: "郭宇航-化工过程安全管理在中天东方氟硅安全软实力的提升实践", link: "https://pan.baidu.com/s/1EtOW4cK2MiR6puNvlZloWQ?pwd=5678", password: "5678" },
  { title: "王军-城市型炼化企业数智+过程安全管控模式构建与实施", link: "https://pan.baidu.com/s/1f8b0uQG_DtaN7bDb7WAwDQ?pwd=5678", password: "5678" },
  { title: "酒江波-国内化工企业安全管理与过程安全管理的差距与改进策略", link: "https://pan.baidu.com/s/1Nvzqx9QsIOOVXJEjgjASlw?pwd=5678", password: "5678" },
  { title: "Chris Coffey-Managing Model Uncertainty in Hydrogen Risk Assessment", link: "https://pan.baidu.com/s/1JRtkDBNWAXfbmjgen8cVLQ?pwd=5678", password: "5678" },
  { title: "谢加令-盛虹石化安全管理效能提升的有效做法", link: "https://pan.baidu.com/s/1td4s6vMcjz5xYGr7skzFPA?pwd=5678", password: "5678" },
  { title: "唐跃武-化工过程安全管理-转变", link: "https://pan.baidu.com/s/19bpMy2UXMF1sPNTE5X1vCA?pwd=5678", password: "5678" },
  { title: "段潍超-煤化工VOCs治理设施旁路排放合规性研究", link: "https://pan.baidu.com/s/1Cj0Qav5OZRbMsjMhVNzeAQ?pwd=5678", password: "5678" },
  { title: "林涛-企业化工过程安全管理实施两周年成效分析", link: "https://pan.baidu.com/s/1aJGC0QvsRiXathiQZi3jxQ?pwd=5678", password: "5678" },
  { title: "吴荣良-化工过程安全的合规重构与风险防控", link: "https://pan.baidu.com/s/1-NDpsxDBYO3tOr0799nuHA?pwd=5678", password: "5678" },
  { title: "罗新军-过程安全管理的精髓在于融合", link: "https://pan.baidu.com/s/1zOTIdYN5GvXRBtkDag_R8A?pwd=5678", password: "5678" },
  { title: "刘庆龙-企业过程安全管理提升的有效做法及成效", link: "https://pan.baidu.com/s/1VWeb82_viwccnSR7EJJAlQ?pwd=5678", password: "5678" },
  { title: "魏毅-安全仪表系统之最终元件在线监视原理和实践", link: "https://pan.baidu.com/s/1W-Y3DMfIkMnUfZr7Nxwu9g?pwd=5678", password: "5678" },
  { title: "黄起中-国家能源集团安全生产管理体系的探索与实践", link: "https://pan.baidu.com/s/10ZOrRR1RQovKjTNcSjjbXw?pwd=5678", password: "5678" },
  { title: "徐伟-化工过程安全管理在万盛的降险增效实践与成效", link: "https://pan.baidu.com/s/1x_pbRCo58WRbAgy-6SKRbQ?pwd=5678", password: "5678" },
  { title: "夏长平-盛虹石化组建过程安全管理专职团队的良好实践", link: "https://pan.baidu.com/s/17tG9ysRE0Ee-nWqaWcAo0Q?pwd=5678", password: "5678" },
  { title: "裴炳安-安全仪表系统工程设计应注意的问题", link: "https://pan.baidu.com/s/1jJU96-SquEwu1LaEvvjzdg?pwd=5678", password: "5678" },
  { title: "尹法波-化工企业报警管理常见问题及提升策略", link: "https://pan.baidu.com/s/12oPWcYTM9Hb9zfR5cOmdyQ?pwd=5678", password: "5678" },
  { title: "李妍-邀请中国职业安全健康协会开展化工过程安全管理提升服务的考量与改变", link: "https://pan.baidu.com/s/1dNeuWHEaR4UvGlp8vdXbIQ?pwd=5678", password: "5678" },
];

async function main() {
  console.log("开始导入资源...\n");

  // 获取或创建分类
  let category = await prisma.category.findUnique({
    where: { name: "化工安全" },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "化工安全",
        pointsCost: 10,
        description: "化工过程安全管理相关资料",
      },
    });
    console.log("✓ 创建分类: 化工安全\n");
  }

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    // 检查是否已存在
    const existing = await prisma.resource.findFirst({
      where: { mainLink: resource.link },
    });

    if (existing) {
      console.log(`⏭ 跳过(已存在): ${resource.title}`);
      skipCount++;
      continue;
    }

    // 重试逻辑
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await prisma.resource.create({
          data: {
            title: resource.title,
            categoryId: category.id,
            description: "化工过程安全管理专业资料",
            mainLink: resource.link,
            password: resource.password,
            source: "baidu",
            pointsCost: 10,
            isNew: true,
          },
        });

        console.log(`✓ 导入成功: ${resource.title}`);
        successCount++;
        success = true;
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`⚠ 重试 (${4 - retries}/3): ${resource.title}`);
          // 等待2秒后重试
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          console.log(`✗ 导入失败: ${resource.title}`);
        }
      }
    }

    // 每导入5条资源后暂停1秒，缓解连接池压力
    if ((i + 1) % 5 === 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n=============================`);
  console.log(`导入完成!`);
  console.log(`成功: ${successCount} 条`);
  console.log(`跳过: ${skipCount} 条`);
  console.log(`总计: ${resources.length} 条`);
}

main()
  .catch((e) => {
    console.error("导入失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
