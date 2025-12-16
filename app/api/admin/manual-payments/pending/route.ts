import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * 查询待确认的手动支付订单列表（管理员专用）
 *
 * GET /api/admin/manual-payments/pending
 * 返回所有待客服确认的手动支付订单
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "令牌无效或过期" },
        { status: 401 }
      );
    }

    // 验证管理员权限
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    // 获取管理员用户信息
    const adminUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (!adminUser || !adminEmails.includes(adminUser.email)) {
      console.warn(
        `[Manual Payment] Unauthorized access attempt from user ${adminUser?.email}`
      );
      return NextResponse.json(
        { message: "无权限执行此操作，仅管理员可访问" },
        { status: 403 }
      );
    }

    // 查询所有待确认的手动支付订单
    const pendingOrders = await prisma.payment.findMany({
      where: {
        status: "pending_manual",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            points: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 格式化返回数据
    const formattedOrders = pendingOrders.map((order) => ({
      id: order.id,
      orderId: order.transactionId,
      userId: order.userId,
      userEmail: order.user.email,
      userName: order.user.name || "未命名用户",
      userCurrentPoints: order.user.points,
      amount: order.amount,
      pointsAdded: order.pointsAdded,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      waitingMinutes: Math.round(
        (Date.now() - order.createdAt.getTime()) / (1000 * 60)
      ),
    }));

    console.log(
      `[Manual Payment] Admin ${adminUser.email} queried ${pendingOrders.length} pending orders`
    );

    return NextResponse.json({
      success: true,
      message: `共有 ${pendingOrders.length} 个待确认订单`,
      total: pendingOrders.length,
      orders: formattedOrders,
      queriedAt: new Date().toISOString(),
      queriedBy: adminUser.email,
    });
  } catch (error) {
    console.error("[Manual Payment Query Error]:", error);
    return NextResponse.json(
      { message: "查询订单列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
