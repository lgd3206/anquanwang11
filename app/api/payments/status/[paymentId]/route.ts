import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * GET endpoint to check payment status
 * Requires authentication and verifies payment ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    // 验证JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Token无效或已过期" },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      select: {
        id: true,
        userId: true, // 需要userId来验证归属
        status: true,
        amount: true,
        pointsAdded: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "支付记录不存在" },
        { status: 404 }
      );
    }

    // 验证支付归属：只能查询自己的支付记录
    if (payment.userId !== decoded.userId) {
      return NextResponse.json(
        { message: "无权访问此支付记录" },
        { status: 403 }
      );
    }

    // 返回时移除userId（前端不需要）
    const { userId, ...paymentData } = payment;

    return NextResponse.json(
      {
        payment: paymentData,
        isCompleted: payment.status === "completed",
        isFailed: payment.status === "failed",
        isPending: payment.status === "pending",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { message: "检查状态失败" },
      { status: 500 }
    );
  }
}
