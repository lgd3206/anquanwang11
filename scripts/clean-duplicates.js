/**
 * 清理跨分类重复资源的脚本
 * 检查"化工安全·危化品"和"过程安全管理"中是否有重复
 * 保留较早导入的资源，删除较晚的重复
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
  console.log('开始检查和清理重复资源...\n');

  // 获取两个分类
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

  console.log(`分类ID: ${JSON.stringify({ huaGong, psm })}\n`);

  // 获取两个分类中的所有资源
  const huaGongRes = await prisma.resource.findMany({
    where: { categoryId: huaGong.id },
    select: { id: true, title: true, mainLink: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const psmRes = await prisma.resource.findMany({
    where: { categoryId: psm.id },
    select: { id: true, title: true, mainLink: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`化工安全·危化品资源数: ${huaGongRes.length}`);
  console.log(`过程安全管理资源数: ${psmRes.length}\n`);

  // 查找重复
  const duplicates = [];
  const deleteCandidates = [];

  // 按链接精确匹配
  console.log('⏳ 检查精确链接重复...');
  for (const h of huaGongRes) {
    const p = psmRes.find(item => item.mainLink === h.mainLink && item.mainLink);
    if (p) {
      // 保留PSM中的，删除化工安全中的重复
      duplicates.push({
        type: 'link',
        huaGong: h.title,
        psm: p.title,
        keepId: p.id,
        deleteId: h.id,
        keepCategory: 'psm'
      });
      if (!deleteCandidates.find(d => d.id === h.id)) {
        deleteCandidates.push(h);
      }
    }
  }

  // 按标题相似度匹配（>50%相似）
  console.log('⏳ 检查标题相似度重复（>50%）...');
  for (const h of huaGongRes) {
    for (const p of psmRes) {
      const sim = calculateSimilarity(h.title, p.title);
      if (sim >= 0.5 && !deleteCandidates.find(d => (d.id === h.id || d.id === p.id))) {
        // 保留PSM中的，删除化工安全中的
        duplicates.push({
          type: 'title',
          similarity: (sim * 100).toFixed(1),
          huaGong: h.title,
          psm: p.title,
          keepId: p.id,
          deleteId: h.id,
          keepCategory: 'psm'
        });
        if (!deleteCandidates.find(d => d.id === h.id)) {
          deleteCandidates.push(h);
        }
      }
    }
  }

  console.log(`\n找到 ${duplicates.length} 个重复资源\n`);

  if (duplicates.length === 0) {
    console.log('✅ 没有发现重复资源');
    await prisma.$disconnect();
    return;
  }

  console.log('重复资源列表:');
  duplicates.slice(0, 20).forEach((d, i) => {
    console.log(`\n${i + 1}. [${d.type}${d.similarity ? ' ' + d.similarity + '%' : ''}]`);
    console.log(`   化工安全·危化品: ${d.huaGong} (ID: ${duplicates.filter(x => x.huaGong === d.huaGong)[0]?.huaGong === d.huaGong && duplicates.filter(x => x.huaGong === d.huaGong)[0]?.keepCategory === 'huaGong' ? '保留' : '删除'})`);
    console.log(`   过程安全管理: ${d.psm} (ID: ${duplicates.filter(x => x.psm === d.psm)[0]?.psm === d.psm && duplicates.filter(x => x.psm === d.psm)[0]?.keepCategory === 'psm' ? '保留' : '删除'})`);
  });

  if (duplicates.length > 20) {
    console.log(`\n... 还有 ${duplicates.length - 20} 个重复资源`);
  }

  console.log(`\n将删除 ${deleteCandidates.length} 个资源`);
  console.log('开始自动删除...\n');

  try {
    // 删除相关的下载记录
    const downloadCount = await prisma.download.deleteMany({
      where: {
        resourceId: {
          in: deleteCandidates.map(d => d.id)
        }
      }
    });
    console.log(`✅ 删除了 ${downloadCount.count} 条下载记录`);

    // 删除资源
    const deleteCount = await prisma.resource.deleteMany({
      where: {
        id: {
          in: deleteCandidates.map(d => d.id)
        }
      }
    });
    console.log(`✅ 删除了 ${deleteCount.count} 个重复资源`);
    console.log('✅ 清理完成！');
  } catch (error) {
    console.error('❌ 删除出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  });
