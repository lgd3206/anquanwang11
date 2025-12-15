import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

export async function GET(request: NextRequest) {
  try {
    // 验证token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 404 });
    }

    // 检查是否是管理员
    const isAdmin = ADMIN_EMAILS.includes(user.email);

    return NextResponse.json({
      isAdmin,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "验证失败" },
      { status: 500 }
    );
  }
}
