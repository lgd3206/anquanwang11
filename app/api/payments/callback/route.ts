import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status } = body;

    if (!transactionId || !status) {
      return NextResponse.json(
        { message: "参数不完整" },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "支付记录不存在" },
        { status: 404 }
      );
    }

    if (status === "success") {
      // Update payment status and add points to user
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "success" },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: {
            points: {
              increment: payment.pointsAdded,
            },
          },
        }),
      ]);

      return NextResponse.json({
        message: "支付成功",
        paymentId: payment.id,
      });
    } else if (status === "failed") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });

      return NextResponse.json({
        message: "支付失败",
        paymentId: payment.id,
      });
    }

    return NextResponse.json({
      message: "未知的支付状态",
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { message: "处理支付回调失败" },
      { status: 500 }
    );
  }
}
