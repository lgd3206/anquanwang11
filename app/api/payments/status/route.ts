import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { message: "交易ID不能为空" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "支付记录不存在" },
        { status: 404 }
      );
    }

    // Verify user owns this payment
    if (payment.userId !== payload.userId) {
      return NextResponse.json(
        { message: "无权访问此支付记录" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        pointsAdded: payment.pointsAdded,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return NextResponse.json(
      { message: "获取支付状态失败" },
      { status: 500 }
    );
  }
}
