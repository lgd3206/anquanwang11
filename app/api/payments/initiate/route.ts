import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { paymentInitSchema, validateInput } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import pingxxClient, {
  formatAmountToCents,
  generateOrderId,
} from "@/lib/pingpp";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = withRateLimit(request, "payment");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

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

    const body = await request.json();

    // 输入验证
    const validation = validateInput(paymentInitSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { points, amount, paymentMethod } = validation.data;

    // Generate order ID
    const orderId = generateOrderId();

    // Create payment record with pending status
    const payment = await prisma.payment.create({
      data: {
        userId: payload.userId,
        amount,
        pointsAdded: points,
        paymentMethod,
        status: "pending",
        transactionId: orderId,
      },
    });

    let chargeData: any;

    // Check if Ping++ API credentials are configured
    const isPingppConfigured =
      process.env.PING_API_KEY && process.env.PING_APP_ID;

    if (isPingppConfigured) {
      try {
        // Real Ping++ integration
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "127.0.0.1";

        const amountInCents = formatAmountToCents(amount);

        chargeData = await pingxxClient.createCharge(
          amountInCents,
          paymentMethod === "wechat" ? "wechat" : "alipay",
          orderId,
          `积分充值：${points} 点`,
          clientIp
        );

        // Update payment with Ping++ charge ID
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            transactionId: chargeData.id || orderId,
          },
        });

        return NextResponse.json(
          {
            message: "支付初始化成功",
            paymentId: payment.id,
            chargeId: chargeData.id,
            transactionId: chargeData.id || orderId,
            // 返回支付链接或二维码
            paymentUrl: chargeData.pay_url || null,
            qrCode: chargeData.credential?.qr_code || null,
            amount,
            points,
            channel: chargeData.channel,
          },
          { status: 201 }
        );
      } catch (pingxxError) {
        console.error("Ping++ API error:", pingxxError);

        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "failed" },
        });

        return NextResponse.json(
          {
            message: "支付初始化失败，请稍后重试",
            error: pingxxError instanceof Error ? pingxxError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    } else {
      // Fallback to mock QR code for development/testing
      console.warn(
        "Ping++ credentials not configured, using mock payment QR code"
      );

      const qrCode = generateMockQRCode(orderId, amount, paymentMethod);

      return NextResponse.json(
        {
          message: "支付初始化成功（测试模式）",
          paymentId: payment.id,
          transactionId: orderId,
          qrCode,
          amount,
          points,
          isTestMode: true,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Payment initiate error:", error);
    return NextResponse.json(
      { message: "支付初始化失败" },
      { status: 500 }
    );
  }
}

/**
 * 生成模拟二维码 (用于开发/测试)
 */
function generateMockQRCode(
  _transactionId: string,
  amount: number,
  method: string
): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23fff' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14' fill='%23333'%3E${method.toUpperCase()}%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' font-size='12' fill='%23666'%3E¥${amount}%3C/text%3E%3C/svg%3E`;
}
