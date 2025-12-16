import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registerSchema, validateInput } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import { generateVerificationToken, getVerificationTokenExpiry } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { isDisposableEmail } from "@/lib/disposableEmail";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = withRateLimit(request, "register");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    // 输入验证
    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 检查是否为一次性邮箱
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { message: "不支持使用一次性邮箱注册" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // 使用固定延迟防止用户枚举
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json(
        { message: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // Hash password with cost factor 12
    const hashedPassword = await hash(password, 12);

    // 生成验证token
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = getVerificationTokenExpiry();

    // 创建用户，初始积分为0，不立即发放
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || email.split("@")[0],
        points: 0, // 初始积分为0，等待邮箱验证后再发放
        verificationToken,
        verificationExpiresAt,
        emailVerifiedAt: null,
        signupBonusGranted: false,
      },
    });

    console.log("✅ 用户创建成功，准备发送验证邮件:", {
      email: normalizedEmail,
      userId: user.id,
      tokenLength: verificationToken.length,
    });

    // 同步发送验证邮件，确保邮件发送
    try {
      const emailSent = await sendVerificationEmail(
        normalizedEmail,
        verificationToken,
        process.env.NEXT_PUBLIC_APP_URL || "https://www.hseshare.com"
      );

      if (emailSent) {
        console.log("✅ 验证邮件发送成功:", normalizedEmail);
      } else {
        console.error("❌ 验证邮件发送失败（返回false）:", normalizedEmail);
      }
    } catch (emailError) {
      console.error("❌ 验证邮件发送异常:", emailError);
      // 即使邮件发送失败，用户也已创建，不影响注册流程
    }

    return NextResponse.json(
      {
        message: "注册成功！请检查邮箱完成验证",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
