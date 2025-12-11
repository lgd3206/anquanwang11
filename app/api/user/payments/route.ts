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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get payment records
    const payments = await prisma.payment.findMany({
      where: { userId: payload.userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Get total count
    const total = await prisma.payment.count({
      where: { userId: payload.userId },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        pointsAdded: p.pointsAdded,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { message: "获取支付历史失败" },
      { status: 500 }
    );
  }
}
