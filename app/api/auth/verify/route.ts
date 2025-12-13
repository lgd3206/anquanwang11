import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isTokenExpired } from "@/lib/token";
import { sendBonusEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const prisma = new PrismaClient();

const SIGNUP_BONUS = 30; // 注册成功后赠送的积分

/**
 * 邮箱验证端点
 * GET /api/auth/verify?token=xxx&email=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // 验证参数
    if (!token || !email) {
      return NextResponse.json(
        { message: "验证链接无效" },
        { status: 400 }
      );
    }

    // 🔒 速率限制：防止针对特定邮箱的DoS攻击
    // 按 IP + 邮箱 限流，每小时最多10次验证尝试
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(request);
    const rateLimitKey = `verify:${clientIp}:${normalizedEmail}`;

    const rateLimitResult = checkRateLimit(rateLimitKey, "api");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: "验证尝试过于频繁，请稍后再试",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter || 60) } }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查是否已验证
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { message: "邮箱已验证，请勿重复操作" },
        { status: 400 }
      );
    }

    // 验证token
    if (user.verificationToken !== token) {
      return NextResponse.json(
        { message: "验证链接无效" },
        { status: 400 }
      );
    }

    // 检查token是否过期
    if (isTokenExpired(user.verificationExpiresAt)) {
      return NextResponse.json(
        { message: "验证链接已过期，请重新注册" },
        { status: 400 }
      );
    }

    // 使用事务更新用户信息和记录支付日志（幂等性保证）
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 更新用户验证信息
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationExpiresAt: null,
          // 确保只发放一次积分
          ...(user.signupBonusGranted ? {} : {
            points: user.points + SIGNUP_BONUS,
            signupBonusGranted: true,
          }),
        },
      });

      // 记录积分发放到payment表（用于审计）
      if (!user.signupBonusGranted) {
        await tx.payment.create({
          data: {
            userId: user.id,
            amount: 0,
            pointsAdded: SIGNUP_BONUS,
            paymentMethod: "signup_bonus",
            status: "completed",
            transactionId: `SIGNUP-BONUS-${user.id}-${Date.now()}`,
          },
        });
      }

      return updated;
    });

    // 异步发送邮件通知（不阻塞响应）
    sendBonusEmail(normalizedEmail, SIGNUP_BONUS).catch((err) => {
      console.error("Failed to send bonus email:", err);
    });

    return NextResponse.json(
      {
        message: "邮箱验证成功，已赠送积分",
        success: true,
        bonusPoints: SIGNUP_BONUS,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          points: updatedUser.points,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "验证过程中出错，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * POST 端点：用于前端请求验证（可选）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    // 验证参数
    if (!token || !email) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 🔒 速率限制：防止针对特定邮箱的DoS攻击
    // 按 IP + 邮箱 限流，每小时最多10次验证尝试
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(request);
    const rateLimitKey = `verify:${clientIp}:${normalizedEmail}`;

    const rateLimitResult = checkRateLimit(rateLimitKey, "api");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: "验证尝试过于频繁，请稍后再试",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter || 60) } }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查是否已验证
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { message: "邮箱已验证" },
        { status: 400 }
      );
    }

    // 验证token
    if (user.verificationToken !== token) {
      return NextResponse.json(
        { message: "验证链接无效" },
        { status: 400 }
      );
    }

    // 检查token是否过期
    if (isTokenExpired(user.verificationExpiresAt)) {
      return NextResponse.json(
        { message: "验证链接已过期，请重新注册" },
        { status: 400 }
      );
    }

    // 使用事务更新用户信息
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationExpiresAt: null,
          ...(user.signupBonusGranted ? {} : {
            points: user.points + SIGNUP_BONUS,
            signupBonusGranted: true,
          }),
        },
      });

      if (!user.signupBonusGranted) {
        await tx.payment.create({
          data: {
            userId: user.id,
            amount: 0,
            pointsAdded: SIGNUP_BONUS,
            paymentMethod: "signup_bonus",
            status: "completed",
            transactionId: `SIGNUP-BONUS-${user.id}-${Date.now()}`,
          },
        });
      }

      return updated;
    });

    // 异步发送邮件通知
    sendBonusEmail(normalizedEmail, SIGNUP_BONUS).catch((err) => {
      console.error("Failed to send bonus email:", err);
    });

    return NextResponse.json(
      {
        message: "邮箱验证成功，已赠送积分",
        success: true,
        bonusPoints: SIGNUP_BONUS,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          points: updatedUser.points,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "验证过程中出错，请稍后重试" },
      { status: 500 }
    );
  }
}
