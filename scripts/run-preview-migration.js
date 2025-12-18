require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('开始执行数据库迁移...\n');

    // Step 1: 添加字段到resources表
    console.log('Step 1: 添加预览字段到resources表...');
    try {
      await prisma.$executeRaw`ALTER TABLE "resources" ADD COLUMN "fileType" TEXT`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('  fileType字段已存在，跳过');
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "resources" ADD COLUMN "fileSize" TEXT`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('  fileSize字段已存在，跳过');
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "resources" ADD COLUMN "previewable" BOOLEAN NOT NULL DEFAULT true`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('  previewable字段已存在，跳过');
    }

    console.log('✅ Step 1完成\n');

    // Step 2: 创建previews表
    console.log('Step 2: 创建previews表...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE "previews" (
          "id" SERIAL NOT NULL,
          "userId" INTEGER,
          "resourceId" INTEGER NOT NULL,
          "previewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "previews_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('✅ Step 2完成\n');
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('  previews表已存在，跳过\n');
    }

    // Step 3: 创建索引
    console.log('Step 3: 创建索引...');
    try {
      await prisma.$executeRaw`CREATE INDEX "previews_resourceId_idx" ON "previews"("resourceId")`;
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('  索引可能已存在');
    }

    try {
      await prisma.$executeRaw`CREATE INDEX "previews_userId_idx" ON "previews"("userId")`;
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('  索引可能已存在');
    }
    console.log('✅ Step 3完成\n');

    // Step 4: 添加外键
    console.log('Step 4: 添加外键约束...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "previews"
        ADD CONSTRAINT "previews_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('  userId外键可能已存在');
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "previews"
        ADD CONSTRAINT "previews_resourceId_fkey"
        FOREIGN KEY ("resourceId") REFERENCES "resources"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
      `;
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('  resourceId外键可能已存在');
    }
    console.log('✅ Step 4完成\n');

    // Step 5: 自动识别文件类型
    console.log('Step 5: 根据标题自动识别文件类型...');
    const pdfCount = await prisma.$executeRaw`UPDATE "resources" SET "fileType" = 'pdf' WHERE "title" ILIKE '%.pdf%' AND "fileType" IS NULL`;
    const docCount = await prisma.$executeRaw`UPDATE "resources" SET "fileType" = 'doc' WHERE ("title" ILIKE '%.doc%' OR "title" ILIKE '%.docx%') AND "fileType" IS NULL`;
    const xlsCount = await prisma.$executeRaw`UPDATE "resources" SET "fileType" = 'xls' WHERE ("title" ILIKE '%.xls%' OR "title" ILIKE '%.xlsx%') AND "fileType" IS NULL`;
    const pptCount = await prisma.$executeRaw`UPDATE "resources" SET "fileType" = 'ppt' WHERE ("title" ILIKE '%.ppt%' OR "title" ILIKE '%.pptx%') AND "fileType" IS NULL`;

    console.log(`  PDF: ${pdfCount}个`);
    console.log(`  DOC: ${docCount}个`);
    console.log(`  XLS: ${xlsCount}个`);
    console.log(`  PPT: ${pptCount}个`);
    console.log('✅ Step 5完成\n');

    console.log('✅ 迁移全部完成！\n');

    // 验证迁移结果
    const resourceCount = await prisma.resource.count();
    const withTypeCount = await prisma.resource.count({ where: { fileType: { not: null } } });

    console.log(`📊 最终统计:`);
    console.log(`- 总资源数: ${resourceCount}`);
    console.log(`- 已识别文件类型: ${withTypeCount}`);
    console.log(`- 未识别类型: ${resourceCount - withTypeCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runMigration();
