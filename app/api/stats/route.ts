import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 获取资源总数
    const totalResources = await prisma.resource.count();

    // 获取用户总数
    const totalUsers = await prisma.user.count();

    // 获取已完成的支付总数（成功交易）
    const totalTransactions = await prisma.payment.count({
      where: {
        status: "completed",
      },
    });

    return NextResponse.json({
      totalResources: Math.max(totalResources, 1200), // 至少显示1200+
      totalUsers: Math.max(totalUsers, 500), // 至少显示500+
      totalTransactions: Math.max(totalTransactions, 3000), // 至少显示3000+
      success: true,
    });
  } catch (error) {
    console.error("Stats error:", error);
    // 返回默认统计数据
    return NextResponse.json({
      totalResources: 1200,
      totalUsers: 500,
      totalTransactions: 3000,
      success: false,
    });
  }
}
