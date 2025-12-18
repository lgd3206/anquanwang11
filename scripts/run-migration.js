require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

try {
  console.log('运行Prisma迁移...');
  execSync('npx prisma migrate dev --name add_preview_feature', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ 迁移完成！');
} catch (error) {
  console.error('❌ 迁移失败:', error.message);
  process.exit(1);
}
