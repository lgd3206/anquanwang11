/**
 * 数据库迁移脚本 - 方案A实施
 *
 * 操作：
 * 1. 新增3个分类：双重预防机制、过程安全管理、重大危险源
 * 2. 重命名分类：化工安全 → 化工安全·危化品
 * 3. 重命名分类：隐患排查 → 隐患排查·重大隐患
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库迁移...\n');

  // 1. 新增3个分类
  const newCategories = [
    {
      name: '双重预防机制',
      description: '风险分级管控与隐患排查治理双重预防体系相关资源',
      pointsCost: 10,
    },
    {
      name: '过程安全管理',
      description: 'PSM过程安全管理体系、14要素实施指南等资源',
      pointsCost: 15,
    },
    {
      name: '重大危险源',
      description: '重大危险源辨识、评估、监控及管理相关资源',
      pointsCost: 10,
    },
  ];

  console.log('步骤1: 创建新分类...');
  for (const category of newCategories) {
    try {
      const created = await prisma.category.create({
        data: category,
      });
      console.log(`✅ 已创建分类: ${created.name} (ID: ${created.id})`);
    } catch (error) {
      console.error(`❌ 创建分类 "${category.name}" 失败:`, error.message);
    }
  }

  // 2. 重命名现有分类
  const renameOperations = [
    { oldName: '化工安全', newName: '化工安全·危化品' },
    { oldName: '隐患排查', newName: '隐患排查·重大隐患' },
  ];

  console.log('\n步骤2: 重命名现有分类...');
  for (const operation of renameOperations) {
    try {
      const category = await prisma.category.findFirst({
        where: { name: operation.oldName },
      });

      if (!category) {
        console.log(`⚠️  未找到分类: ${operation.oldName}`);
        continue;
      }

      const updated = await prisma.category.update({
        where: { id: category.id },
        data: { name: operation.newName },
      });

      console.log(`✅ 已重命名: ${operation.oldName} → ${operation.newName}`);
    } catch (error) {
      console.error(`❌ 重命名 "${operation.oldName}" 失败:`, error.message);
    }
  }

  // 3. 查看最终结果
  console.log('\n步骤3: 查看所有分类...');
  const allCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      pointsCost: true,
      _count: {
        select: { resources: true },
      },
    },
  });

  console.log('\n当前所有分类:');
  console.table(
    allCategories.map(c => ({
      ID: c.id,
      名称: c.name,
      积分: c.pointsCost,
      资源数: c._count.resources,
    }))
  );

  console.log('\n✅ 迁移完成！');
}

main()
  .catch((e) => {
    console.error('❌ 迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
