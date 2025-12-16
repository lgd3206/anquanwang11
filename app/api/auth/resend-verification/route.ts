import { NextRequest, NextResponse } from "next/server";
import { generateVerificationToken, getVerificationTokenExpiry } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { validateInput } from "@/lib/validation";
import { withRateLimitAsync } from "@/lib/rateLimit";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 重发验证邮件的schema
const resendVerificationSchema = z.object({
  email: z
    .string()
    .email("邮箱格式不正确")
    .max(255, "邮箱过长"),
});

/**
 * POST /api/auth/resend-verification
 * 重新发送验证邮件
 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = await withRateLimitAsync(request, "api");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const body = await request.json();

    // 验证输入
    const validation = validateInput(resendVerificationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

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
        { message: "邮箱已验证，无需重新发送" },
        { status: 400 }
      );
    }

    // 生成新的验证token
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = getVerificationTokenExpiry();

    // 更新用户的验证token
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        verificationToken,
        verificationExpiresAt,
      },
    });

    // 发送验证邮件
    await sendVerificationEmail(normalizedEmail, verificationToken);

    return NextResponse.json(
      { message: "验证邮件已重新发送，请检查收件箱" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "发送验证邮件失败，请稍后重试" },
      { status: 500 }
    );
  }
}
