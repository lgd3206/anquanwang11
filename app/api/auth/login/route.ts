import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { signToken } from "@/lib/auth";
import { loginSchema, validateInput } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = withRateLimit(request, "login");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    // 输入验证
    const validation = validateInput(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // 使用固定延迟防止用户枚举
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json(
        { message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        message: "登录成功",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          points: user.points,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
