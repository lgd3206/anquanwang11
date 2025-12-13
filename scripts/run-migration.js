#!/usr/bin/env node
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 加载 .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local 不存在');
  process.exit(1);
}

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ 加载 .env.local 失败:', result.error);
  process.exit(1);
}

console.log('✅ 环境变量加载成功');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

if (!process.env.DATABASE_URL) {
  console.error('❌ 未找到 DATABASE_URL');
  process.exit(1);
}

try {
  console.log('\n📊 执行 prisma db push...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });

  console.log('\n✅ 数据库更新成功！');

  // 重新生成 Prisma Client
  console.log('\n📦 重新生成 Prisma Client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env,
  });

  console.log('\n✅ Prisma Client 生成完成！');
} catch (error) {
  console.error('\n❌ 执行失败:', error.message);
  process.exit(1);
}
