import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function revokePoints() {
  try {
    const userEmail = "283087359@qq.com";
    const pointsToRevoke = 1000;

    console.log(`\n开始撤回操作...`);
    console.log(`目标用户: ${userEmail}`);
    console.log(`撤回积分: ${pointsToRevoke}`);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`❌ 错误：未找到邮箱为 ${userEmail} 的用户`);
      return;
    }

    console.log(`\n当前用户信息:`);
    console.log(`  用户名: ${user.name}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  当前积分: ${user.points}`);

    // 检查积分是否足够
    if (user.points < pointsToRevoke) {
      console.error(
        `❌ 错误：用户积分不足。当前: ${user.points}，需要撤回: ${pointsToRevoke}`
      );
      return;
    }

    // 执行撤回
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: user.points - pointsToRevoke,
      },
    });

    // 记录撤回操作
    const revokeRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 0,
        pointsAdded: -pointsToRevoke,
        paymentMethod: "revoke",
        status: "completed",
        transactionId: `REVOKE-${Date.now()}-${user.id}`,
      },
    });

    console.log(`\n✅ 撤回成功！`);
    console.log(`  撤回积分: ${pointsToRevoke}`);
    console.log(`  撤回前: ${user.points} 积分`);
    console.log(`  撤回后: ${updatedUser.points} 积分`);
    console.log(`  交易ID: ${revokeRecord.transactionId}`);
    console.log(`  撤回时间: ${revokeRecord.createdAt}`);
  } catch (error) {
    console.error("❌ 撤回失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

revokePoints();
