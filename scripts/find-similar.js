/**
 * 寻找相似资源 - 用更低的相似度阈值
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
  const huaGong = await prisma.category.findFirst({
    where: { name: '化工安全·危化品' }
  });

  const psm = await prisma.category.findFirst({
    where: { name: '过程安全管理' }
  });

  const huaGongRes = await prisma.resource.findMany({
    where: { categoryId: huaGong.id },
    select: { id: true, title: true, mainLink: true },
    take: 5
  });

  const psmRes = await prisma.resource.findMany({
    where: { categoryId: psm.id },
    select: { id: true, title: true, mainLink: true },
    take: 5
  });

  console.log('化工安全·危化品 前5个资源:');
  huaGongRes.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title}`);
  });

  console.log('\n过程安全管理 前5个资源:');
  psmRes.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title}`);
  });

  // 计算相似度
  console.log('\n相似度检查（70%以上）:');
  let found = false;
  for (const h of huaGongRes) {
    for (const p of psmRes) {
      const sim = calculateSimilarity(h.title, p.title);
      if (sim >= 0.7) {
        console.log(`  ${(sim * 100).toFixed(1)}% - "${h.title}" <-> "${p.title}"`);
        found = true;
      }
    }
  }
  if (!found) {
    console.log('  未找到70%以上相似的资源');
  }

  await prisma.$disconnect();
}

main();
