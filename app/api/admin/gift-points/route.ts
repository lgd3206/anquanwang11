import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// 管理员邮箱列表
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);

interface GiftPointsRequest {
  emails: string[];
  points: number;
  reason?: string;
}

interface GiftResult {
  email: string;
  success: boolean;
  message: string;
  pointsAdded?: number;
  newBalance?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 管理员权限验证
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      );
    }

    const body: GiftPointsRequest = await request.json();
    const { emails, points, reason = "知识星球用户赠送" } = body;

    // 输入验证
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { message: "邮箱列表不能为空" },
        { status: 400 }
      );
    }

    if (!points || points <= 0 || points > 10000) {
      return NextResponse.json(
        { message: "积分必须在1-10000之间" },
        { status: 400 }
      );
    }

    const results: GiftResult[] = [];

    // 逐个处理邮箱
    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail) {
        results.push({
          email,
          success: false,
          message: "邮箱格式无效",
        });
        continue;
      }

      try {
        // 查找用户
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          results.push({
            email: normalizedEmail,
            success: false,
            message: "用户不存在",
          });
          continue;
        }

        // 检查是否已经赠送过（通过payment表记录查询）
        const existingGift = await prisma.payment.findFirst({
          where: {
            userId: user.id,
            paymentMethod: "gift",
            pointsAdded: points,
          },
        });

        if (existingGift) {
          results.push({
            email: normalizedEmail,
            success: false,
            message: "该用户已获得过此赠送",
          });
          continue;
        }

        // 赠送积分并记录
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { points: user.points + points },
        });

        // 创建赠送记录（复用payment表）
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount: 0,
            pointsAdded: points,
            paymentMethod: "gift",
            status: "completed",
            transactionId: `GIFT_${Date.now()}_${user.id}`,
          },
        });

        results.push({
          email: normalizedEmail,
          success: true,
          message: "赠送成功",
          pointsAdded: points,
          newBalance: updatedUser.points,
        });
      } catch (error) {
        console.error(`Gift points error for ${normalizedEmail}:`, error);
        results.push({
          email: normalizedEmail,
          success: false,
          message: "系统错误，请稍后重试",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `处理完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      total: emails.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Gift points error:", error);
    return NextResponse.json(
      { message: "赠送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
