import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import { validateInput } from "@/lib/validation";
import { withRateLimitAsync } from "@/lib/rateLimit";
import { z } from "zod";

const prisma = new PrismaClient();

// 管理员邮箱白名单
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

// 分类创建schema
const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "分类名称不能为空")
    .max(100, "分类名称过长"),
  pointsCost: z
    .number()
    .int("积分成本必须是整数")
    .min(0, "积分成本不能为负数")
    .max(10000, "积分成本过高")
    .optional()
    .default(10),
  description: z
    .string()
    .max(500, "描述过长")
    .optional(),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { message: "获取分类失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitCheck = await withRateLimitAsync(request, "api");
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    // 验证token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Token无效或已过期" }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true },
    });

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { message: "仅管理员可创建分类" },
        { status: 403 }
      );
    }

    // 验证请求数据
    const body = await request.json();
    const validationResult = validateInput(createCategorySchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error },
        { status: 400 }
      );
    }

    const { name, pointsCost, description } = validationResult.data;

    // 检查分类是否已存在
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "该分类已存在" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        pointsCost,
        description,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { message: "创建分类失败" },
      { status: 500 }
    );
  }
}
