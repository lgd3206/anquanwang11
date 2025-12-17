/**
 * 检测重复资源 - 用更低的相似度阈值
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 相似度计算函数
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function main() {
  console.log('开始检测重复资源（相似度阈值：50%）...\n');

  const huaGong = await prisma.category.findFirst({
    where: { name: '化工安全·危化品' },
    select: { id: true, name: true }
  });

  const psm = await prisma.category.findFirst({
    where: { name: '过程安全管理' },
    select: { id: true, name: true }
  });

  if (!huaGong || !psm) {
    console.log('❌ 分类不存在');
    await prisma.$disconnect();
    return;
  }

  const huaGongRes = await prisma.resource.findMany({
    where: { categoryId: huaGong.id },
    select: { id: true, title: true, mainLink: true }
  });

  const psmRes = await prisma.resource.findMany({
    where: { categoryId: psm.id },
    select: { id: true, title: true, mainLink: true }
  });

  console.log(`化工安全·危化品资源数: ${huaGongRes.length}`);
  console.log(`过程安全管理资源数: ${psmRes.length}\n`);

  const duplicates = [];
  const THRESHOLD = 0.5; // 50%相似度阈值

  // 精确链接匹配
  console.log('⏳ 检查精确链接重复...');
  let linkDupes = 0;
  for (const h of huaGongRes) {
    const p = psmRes.find(item => item.mainLink === h.mainLink && item.mainLink);
    if (p) {
      linkDupes++;
      duplicates.push({
        type: 'link',
        huaGong: h.title,
        psm: p.title,
        similarity: '100%'
      });
    }
  }
  console.log(`找到 ${linkDupes} 个链接重复\n`);

  // 标题相似度匹配
  console.log(`⏳ 检查标题相似度重复（>${THRESHOLD * 100}%）...`);
  let simDupes = 0;
  for (const h of huaGongRes) {
    for (const p of psmRes) {
      const sim = calculateSimilarity(h.title, p.title);
      if (sim >= THRESHOLD && sim < 1 && !duplicates.find(d => d.huaGong === h.title && d.psm === p.title)) {
        simDupes++;
        duplicates.push({
          type: 'title',
          huaGong: h.title,
          psm: p.title,
          similarity: `${(sim * 100).toFixed(1)}%`
        });
      }
    }
  }
  console.log(`找到 ${simDupes} 个标题相似重复\n`);

  console.log(`总计找到 ${duplicates.length} 个重复资源\n`);

  if (duplicates.length === 0) {
    console.log('✅ 未发现重复资源');
  } else {
    console.log('重复资源列表（前30个）:');
    duplicates.slice(0, 30).forEach((d, i) => {
      console.log(`\n${i + 1}. [${d.type} - ${d.similarity}]`);
      console.log(`   化工安全·危化品: ${d.huaGong}`);
      console.log(`   过程安全管理: ${d.psm}`);
    });

    if (duplicates.length > 30) {
      console.log(`\n... 还有 ${duplicates.length - 30} 个重复资源`);
    }
  }

  await prisma.$disconnect();
}

main();
