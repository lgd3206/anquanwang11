import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

interface RevokePointsRequest {
  email: string;
  points: number;
  reason: string;
}

export async function POST(request: NextRequest) {
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

    // 检查是否为管理员（仅允许特定邮箱）
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    // 仅允许特定的管理员邮箱操作
    const adminEmails = [
      "329938313@qq.com", // 主管理员
    ];

    if (!admin || !adminEmails.includes(admin.email)) {
      return NextResponse.json(
        { message: "您没有权限执行此操作" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as RevokePointsRequest;
    const { email, points, reason } = body;

    // 验证输入
    if (!email || !points || points <= 0) {
      return NextResponse.json(
        { message: "邮箱和积分数量必填且有效" },
        { status: 400 }
      );
    }

    // 查找目标用户
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: `未找到邮箱为 ${email} 的用户` },
        { status: 404 }
      );
    }

    // 查询用户当前积分
    const currentPoints = targetUser.points;

    // 检查用户积分是否足以扣除
    if (currentPoints < points) {
      return NextResponse.json(
        {
          message: `用户当前积分为 ${currentPoints}，无法撤回 ${points} 积分`,
          currentPoints,
          requestedRevoke: points,
        },
        { status: 400 }
      );
    }

    // 执行撤回：扣除积分
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        points: currentPoints - points,
      },
    });

    // 记录撤回操作到payment表（作为负数记录）
    await prisma.payment.create({
      data: {
        userId: targetUser.id,
        amount: 0,
        pointsAdded: -points, // 负数表示撤回
        paymentMethod: "revoke", // 标记为撤回
        status: "completed",
        transactionId: `REVOKE-${Date.now()}-${targetUser.id}`,
      },
    });

    return NextResponse.json(
      {
        message: "积分撤回成功",
        success: true,
        userEmail: email,
        revokedPoints: points,
        reason,
        previousPoints: currentPoints,
        currentPoints: updatedUser.points,
        revokedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Revoke points error:", error);
    return NextResponse.json(
      { message: "撤回积分失败" },
      { status: 500 }
    );
  }
}

// GET: 查询撤回历史
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

    // 查询所有撤回记录
    const revokeHistory = await prisma.payment.findMany({
      where: {
        paymentMethod: "revoke",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      total: revokeHistory.length,
      data: revokeHistory.map((record) => ({
        transactionId: record.transactionId,
        userEmail: record.user.email,
        userName: record.user.name,
        revokedPoints: Math.abs(record.pointsAdded), // 取绝对值显示
        revokedAt: record.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get revoke history error:", error);
    return NextResponse.json(
      { message: "获取撤回历史失败" },
      { status: 500 }
    );
  }
}
