import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 确认手动支付订单（管理员专用）
 *
 * POST /api/admin/manual-payments/confirm
 *
 * 业务流程：
 * 1. 验证管理员权限
 * 2. 查询订单，检查状态是否为 pending_manual
 * 3. 使用数据库事务确保原子性：
 *    - 更新订单状态为 completed
 *    - 给用户加积分
 *    - 防止重复确认（事务中的状态检查）
 * 4. 记录操作日志
 */
export async function POST(request: NextRequest) {
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

    const adminUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (!adminUser || !adminEmails.includes(adminUser.email)) {
      console.warn(
        `[Manual Payment] Unauthorized confirm attempt from user ${adminUser?.email}`
      );
      return NextResponse.json(
        { message: "无权限执行此操作，仅管理员可访问" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, notes } = body;

    if (!paymentId || typeof paymentId !== "number") {
      return NextResponse.json(
        { message: "无效的支付ID" },
        { status: 400 }
      );
    }

    // 使用事务确保原子性和幂等性
    // 这样可以防止重复确认导致积分重复加
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. 查询订单，使用锁定
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
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
        });

        // 2. 验证订单存在性
        if (!payment) {
          throw new Error(`订单不存在 (ID: ${paymentId})`);
        }

        // 3. 检查订单状态，防止重复确认
        if (payment.status !== "pending_manual") {
          throw new Error(
            `订单状态为 ${payment.status}，无法确认。` +
            `可能是重复操作或订单已被其他管理员处理。`
          );
        }

        // 4. 更新订单状态为 completed
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "completed",
            updatedAt: new Date(),
            // 如果需要记录确认人，可以使用 transactionId 拼接
            // transactionId: `${payment.transactionId}_CONFIRMED_BY_${adminUser.email}`,
          },
        });

        // 5. 给用户加积分
        const updatedUser = await tx.user.update({
          where: { id: payment.userId },
          data: {
            points: {
              increment: payment.pointsAdded,
            },
          },
        });

        return {
          updatedPayment,
          updatedUser,
          originalPoints: payment.user.points,
        };
      },
      {
        timeout: 10000, // 10秒超时
        maxWait: 5000, // 最多等待5秒获得锁
      }
    );

    // 6. 记录操作日志
    console.log(
      `[Manual Payment] Order confirmed successfully\n` +
      `  Order ID: ${result.updatedPayment.transactionId}\n` +
      `  User: ${result.updatedUser.email} (${result.updatedUser.name})\n` +
      `  Points Added: ${result.updatedPayment.pointsAdded}\n` +
      `  Previous Points: ${result.originalPoints}\n` +
      `  New Points: ${result.updatedUser.points}\n` +
      `  Confirmed By: ${adminUser.email}\n` +
      `  Timestamp: ${new Date().toISOString()}\n` +
      `  Notes: ${notes || "无"}`
    );

    return NextResponse.json({
      success: true,
      message: `订单确认成功！已为用户充值 ${result.updatedPayment.pointsAdded} 积分`,
      payment: {
        id: result.updatedPayment.id,
        orderId: result.updatedPayment.transactionId,
        status: result.updatedPayment.status,
        amount: result.updatedPayment.amount,
        pointsAdded: result.updatedPayment.pointsAdded,
      },
      user: {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        name: result.updatedUser.name,
        previousPoints: result.originalPoints,
        newPoints: result.updatedUser.points,
      },
      confirmedBy: adminUser.email,
      confirmedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    // 处理不同类型的错误
    if (error.message?.includes("订单不存在")) {
      console.error("[Manual Payment] Order not found:", error.message);
      return NextResponse.json(
        { message: "订单不存在，请检查订单ID是否正确" },
        { status: 404 }
      );
    }

    if (
      error.message?.includes("订单状态为") ||
      error.message?.includes("无法确认")
    ) {
      console.error("[Manual Payment] Invalid order status:", error.message);
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    // 事务超时或获取锁失败
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("PrismaClientRustPanicError")
    ) {
      console.error("[Manual Payment] Transaction timeout/lock error:", error);
      return NextResponse.json(
        { message: "操作超时，请稍后重试。可能有其他管理员正在处理此订单。" },
        { status: 408 }
      );
    }

    console.error("[Manual Payment Confirm Error]:", error);
    return NextResponse.json(
      { message: "确认订单失败，请稍后重试或联系技术支持" },
      { status: 500 }
    );
  }
}
