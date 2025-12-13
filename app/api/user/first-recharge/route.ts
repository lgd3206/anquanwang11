import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "未授权" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "令牌无效" },
        { status: 401 }
      );
    }

    // 检查充值历史
    const paymentHistory = await prisma.payment.count({
      where: {
        userId: payload.userId,
        status: "completed",
        paymentMethod: { not: "gift" }, // 排除赠送记录
      },
    });

    const isFirstRecharge = paymentHistory === 0;

    return NextResponse.json({
      isFirstRecharge,
      bonusRate: 0.3, // 首次充值奖励比例 30%
      message: isFirstRecharge
        ? "首次充值额外赠送30%积分"
        : "感谢您的支持",
    });
  } catch (error) {
    console.error("Check first recharge error:", error);
    return NextResponse.json(
      { message: "检查失败" },
      { status: 500 }
    );
  }
}
