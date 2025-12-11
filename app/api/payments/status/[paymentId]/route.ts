import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET endpoint to check payment status
 * Useful for polling payment progress on the client side
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      select: {
        id: true,
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

    return NextResponse.json(
      {
        payment,
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
