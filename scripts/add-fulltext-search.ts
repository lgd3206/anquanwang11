import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始设置全文搜索索引...");

  try {
    // 1. 启用 pg_trgm 扩展
    console.log("1. 启用 pg_trgm 扩展...");
    await prisma.$executeRawUnsafe(
      "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    );
    console.log("✓ pg_trgm 扩展已启用");

    // 2. 检查 searchText 列是否已存在
    console.log("2. 检查 searchText 列...");
    const checkColumnResult = await prisma.$queryRawUnsafe<
      Array<{ column_name: string }>
    >(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'resources' AND column_name = 'searchText'
    `
    );

    if (checkColumnResult.length === 0) {
      // 3. 添加搜索文本字段
      console.log("3. 添加 searchText 字段...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE resources ADD COLUMN "searchText" TEXT DEFAULT '';`
      );
      console.log("✓ searchText 字段已添加");

      // 4. 填充现有数据
      console.log("4. 填充现有数据...");
      await prisma.$executeRawUnsafe(`
        UPDATE resources
        SET "searchText" = CONCAT(title, ' ', COALESCE(description, ''))
        WHERE "searchText" = '';
      `);
      console.log("✓ 现有数据已填充");
    } else {
      console.log("✓ searchText 字段已存在，跳过添加");
    }

    // 5. 创建自动更新触发器函数
    console.log("5. 创建触发器函数...");
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_resources_search_text()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."searchText" := CONCAT(NEW.title, ' ', COALESCE(NEW.description, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✓ 触发器函数已创建");

    // 6. 创建或替换触发器
    console.log("6. 创建触发器...");
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS resources_search_text_trigger ON resources;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER resources_search_text_trigger
      BEFORE INSERT OR UPDATE ON resources
      FOR EACH ROW
      EXECUTE FUNCTION update_resources_search_text();
    `);
    console.log("✓ 触发器已创建");

    // 7. 创建 GIN 三元组索引
    console.log("7. 创建 GIN 三元组索引...");
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS resources_search_idx;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX resources_search_idx
      ON resources
      USING GIN ("searchText" gin_trgm_ops);
    `);
    console.log("✓ GIN 三元组索引已创建");

    // 8. 验证索引
    console.log("8. 验证索引...");
    const indexResult = await prisma.$queryRawUnsafe<
      Array<{ indexname: string }>
    >(
      `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'resources' AND indexname = 'resources_search_idx'
    `
    );

    if (indexResult.length > 0) {
      console.log("✓ 索引验证成功");
    } else {
      throw new Error("索引创建失败，无法验证");
    }

    // 9. 输出统计信息
    console.log("\n=== 索引统计信息 ===");
    const statsResult = await prisma.$queryRawUnsafe<
      Array<{
        count: number | bigint;
        avg_search_text_length: number;
      }>
    >(
      `
      SELECT
        COUNT(*) as count,
        AVG(LENGTH("searchText")) as avg_search_text_length
      FROM resources
      WHERE "searchText" IS NOT NULL AND "searchText" != ''
    `
    );

    if (statsResult.length > 0) {
      console.log(
        `✓ 资源总数: ${statsResult[0].count}`
      );
      console.log(
        `✓ 搜索文本平均长度: ${Math.round(
          (statsResult[0].avg_search_text_length || 0) as number
        )} 字符`
      );
    }

    console.log("\n✓ 全文搜索索引设置完成！");
    console.log("\n接下来的步骤:");
    console.log("1. 更新 API 路由 (app/api/resources/route.ts) 实现三元组搜索");
    console.log("2. 创建 SearchHighlight 组件 (components/ui/SearchHighlight.tsx)");
    console.log("3. 更新资源列表页 (app/resources/page.tsx) 集成搜索功能");
  } catch (error) {
    console.error("✗ 错误:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
