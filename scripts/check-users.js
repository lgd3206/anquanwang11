// 查询用户统计信息
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 1. 用户总数
  const totalUsers = await prisma.user.count();
  console.log(`\n📊 注册用户总数: ${totalUsers}\n`);

  // 2. 最近10个注册用户
  const recentUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      points: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('最近10个注册用户:');
  console.table(
    recentUsers.map(u => ({
      ID: u.id,
      用户名: u.name,
      邮箱: u.email,
      积分: u.points,
      注册时间: new Date(u.createdAt).toLocaleString('zh-CN'),
    }))
  );

  // 3. 积分统计
  const pointsStats = await prisma.user.aggregate({
    _avg: { points: true },
    _max: { points: true },
    _min: { points: true },
    _sum: { points: true },
  });

  console.log('\n💰 积分统计:');
  console.log(`   总积分池: ${pointsStats._sum.points || 0}`);
  console.log(`   平均积分: ${Math.round(pointsStats._avg.points || 0)}`);
  console.log(`   最高积分: ${pointsStats._max.points || 0}`);
  console.log(`   最低积分: ${pointsStats._min.points || 0}`);

  // 4. 按注册时间统计
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: today,
      }
    }
  });

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  last7Days.setHours(0, 0, 0, 0);

  const last7DaysUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: last7Days,
      }
    }
  });

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  last30Days.setHours(0, 0, 0, 0);

  const last30DaysUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: last30Days,
      }
    }
  });

  console.log('\n📈 注册趋势:');
  console.log(`   今天注册: ${todayUsers}`);
  console.log(`   近7天注册: ${last7DaysUsers}`);
  console.log(`   近30天注册: ${last30DaysUsers}`);

  // 5. 已验证邮箱的用户
  const verifiedUsers = await prisma.user.count({
    where: {
      emailVerifiedAt: {
        not: null,
      }
    }
  });

  const unverifiedUsers = totalUsers - verifiedUsers;

  console.log('\n📧 邮箱验证状态:');
  console.log(`   已验证: ${verifiedUsers} (${Math.round(verifiedUsers / totalUsers * 100)}%)`);
  console.log(`   未验证: ${unverifiedUsers} (${Math.round(unverifiedUsers / totalUsers * 100)}%)`);
}

main()
  .catch((e) => {
    console.error('查询失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
