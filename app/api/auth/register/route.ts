import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { registerSchema, validateInput } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";

const prisma = new PrismaClient();

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

    // Create user with initial points
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || email.split("@")[0],
        points: 100, // Initial points
      },
    });

    return NextResponse.json(
      {
        message: "注册成功",
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
