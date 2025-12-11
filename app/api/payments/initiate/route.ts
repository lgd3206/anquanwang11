import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

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

    const { points, amount, paymentMethod } = await request.json();

    if (!points || !amount || !paymentMethod) {
      return NextResponse.json(
        { message: "参数不完整" },
        { status: 400 }
      );
    }

    if (!["wechat", "alipay"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "不支持的支付方式" },
        { status: 400 }
      );
    }

    // Create payment record with pending status
    const payment = await prisma.payment.create({
      data: {
        userId: payload.userId,
        amount,
        pointsAdded: points,
        paymentMethod,
        status: "pending",
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    });

    // In production, integrate with actual payment provider
    // For now, return mock QR code
    const qrCode = generateMockQRCode(payment.transactionId || "", amount, paymentMethod);

    return NextResponse.json(
      {
        message: "支付初始化成功",
        paymentId: payment.id,
        transactionId: payment.transactionId,
        qrCode,
        amount,
        points,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment initiate error:", error);
    return NextResponse.json(
      { message: "支付初始化失败" },
      { status: 500 }
    );
  }
}

function generateMockQRCode(
  _transactionId: string,
  amount: number,
  method: string
): string {
  // In production, this would call WeChat or Alipay API to generate real QR code
  // For now, return a placeholder
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23fff' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14' fill='%23333'%3E${method.toUpperCase()}%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' font-size='12' fill='%23666'%3E¥${amount}%3C/text%3E%3C/svg%3E`;
}
