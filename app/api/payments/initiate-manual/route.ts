import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";
import { getPackageById, calculateFirstRechargeBonus } from "@/lib/recharge-packages";
import prisma from "@/lib/prisma";

/**
 * 创建手动支付订单（客服微信支付）
 *
 * 这是一个临时过渡方案，用于支付商户审批期间
 * 用户通过客服微信支付，客服手动确认后自动加积分
 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = withRateLimit(request, "payment");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 检查是否启用手动支付
    const isEnabled = process.env.ENABLE_MANUAL_PAYMENT === "true";
    if (!isEnabled) {
      return NextResponse.json(
        { message: "手动支付功能暂未启用" },
        { status: 403 }
      );
    }

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
        { message: "令牌无效或过期，请重新登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, paymentMethod } = body;

    // 验证套餐ID
    if (!packageId || typeof packageId !== "string") {
      return NextResponse.json(
        { message: "无效的套餐ID" },
        { status: 400 }
      );
    }

    // 验证支付方式
    if (!paymentMethod || !["wechat", "alipay"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "无效的支付方式，仅支持 wechat 或 alipay" },
        { status: 400 }
      );
    }

    // 从服务端配置获取套餐信息（防止前端篡改价格）
    const rechargePackage = getPackageById(packageId);
    if (!rechargePackage) {
      return NextResponse.json(
        { message: "套餐不存在或已下架" },
        { status: 400 }
      );
    }

    const { points, price } = rechargePackage;

    // 检查用户30分钟内是否有待确认的手动支付订单（防重复）
    const existingOrder = await prisma.payment.findFirst({
      where: {
        userId: payload.userId,
        status: "pending_manual",
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // 30分钟内
        },
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        {
          message: "您有待确认的订单，请勿重复提交。如有问题，请30分钟后重试或联系客服",
          existingOrderId: existingOrder.transactionId,
        },
        { status: 400 }
      );
    }

    // 检查首次充值
    const paymentHistory = await prisma.payment.count({
      where: {
        userId: payload.userId,
        status: "completed",
        paymentMethod: {
          notIn: ["gift", "revoke", "signup_bonus"] // 排除非支付的记录
        },
      },
    });

    const isFirstRecharge = paymentHistory === 0;

    // 计算积分（包括首充奖励）
    const bonusPoints = isFirstRecharge ? calculateFirstRechargeBonus(points) : 0;
    const totalPoints = points + bonusPoints;

    // 生成手动支付订单号
    const orderId = `MANUAL_${Date.now()}_${payload.userId}`;

    // 创建待确认的支付记录
    const payment = await prisma.payment.create({
      data: {
        userId: payload.userId,
        amount: price,
        pointsAdded: totalPoints,
        paymentMethod: `manual_${paymentMethod}`, // "manual_wechat" 或 "manual_alipay"
        status: "pending_manual", // 待客服确认
        transactionId: orderId,
      },
    });

    // 获取客服二维码路径
    const qrCodePath =
      paymentMethod === "wechat"
        ? process.env.MANUAL_PAYMENT_WECHAT_QR || "/wechat-cs.png"
        : process.env.MANUAL_PAYMENT_ALIPAY_QR || "/alipay-cs.png";

    console.log(
      `[Manual Payment] Order ${orderId} created for user ${payload.userId}, ` +
      `amount: ¥${price}, points: ${totalPoints}, first recharge: ${isFirstRecharge}`
    );

    return NextResponse.json({
      success: true,
      message: "手动支付订单创建成功，请添加客服微信完成支付",
      orderId,
      paymentId: payment.id,
      amount: price,
      points,
      bonusPoints,
      totalPoints,
      isFirstRecharge,
      paymentMethod,
      customerServiceQrCode: qrCodePath,
      instructions: `请扫描上方二维码添加客服微信，发送订单号 ${orderId}，并转账 ¥${price}。客服会在收款后为您充值积分。`,
    });
  } catch (error) {
    console.error("[Manual Payment Init Error]:", error);
    return NextResponse.json(
      { message: "创建支付订单失败，请稍后重试或联系客服" },
      { status: 500 }
    );
  }
}
