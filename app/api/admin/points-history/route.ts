import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 管理员邮箱白名单
const ADMIN_EMAILS = ["329938313@qq.com"];

interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * GET /api/admin/points-history
 * 查询积分变动历史记录
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return NextResponse.json({ message: "Token无效" }, { status: 401 });
    }

    // 验证管理员身份
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!admin || !ADMIN_EMAILS.includes(admin.email)) {
      return NextResponse.json({ message: "无权限访问" }, { status: 403 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, gift, revoke, signup_bonus, recharge, download
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userEmail = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 构建查询条件
    const where: any = {};

    // 类型筛选
    if (type !== "all") {
      where.paymentMethod = type;
    } else {
      // 只显示管理相关的操作
      where.paymentMethod = {
        in: ["gift", "revoke", "signup_bonus", "recharge"],
      };
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 用户邮箱筛选
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase().trim() },
      });
      if (user) {
        where.userId = user.id;
      } else {
        // 用户不存在，返回空结果
        return NextResponse.json({
          records: [],
          total: 0,
          statistics: {
            todayGift: 0,
            todayRevoke: 0,
            monthGift: 0,
            monthRevoke: 0,
            totalGift: 0,
            totalRevoke: 0,
          },
        });
      }
    }

    // 查询记录
    const [records, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    // 计算统计数据
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayGift, todayRevoke, monthGift, monthRevoke, totalGift, totalRevoke] =
      await Promise.all([
        // 今日赠送
        prisma.payment.aggregate({
          where: {
            paymentMethod: "gift",
            createdAt: { gte: todayStart },
          },
          _sum: { pointsAdded: true },
        }),
        // 今日撤回
        prisma.payment.aggregate({
          where: {
            paymentMethod: "revoke",
            createdAt: { gte: todayStart },
          },
          _sum: { pointsAdded: true },
        }),
        // 本月赠送
        prisma.payment.aggregate({
          where: {
            paymentMethod: "gift",
            createdAt: { gte: monthStart },
          },
          _sum: { pointsAdded: true },
        }),
        // 本月撤回
        prisma.payment.aggregate({
          where: {
            paymentMethod: "revoke",
            createdAt: { gte: monthStart },
          },
          _sum: { pointsAdded: true },
        }),
        // 总赠送
        prisma.payment.aggregate({
          where: { paymentMethod: "gift" },
          _sum: { pointsAdded: true },
        }),
        // 总撤回
        prisma.payment.aggregate({
          where: { paymentMethod: "revoke" },
          _sum: { pointsAdded: true },
        }),
      ]);

    // 格式化记录
    const formattedRecords = records.map((record) => ({
      id: record.id,
      transactionId: record.transactionId,
      userEmail: record.user.email,
      userName: record.user.name || "未设置",
      type: record.paymentMethod,
      pointsChange: record.pointsAdded,
      amount: record.amount,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    }));

    return NextResponse.json({
      records: formattedRecords,
      total,
      limit,
      offset,
      statistics: {
        todayGift: todayGift._sum.pointsAdded || 0,
        todayRevoke: Math.abs(todayRevoke._sum.pointsAdded || 0),
        monthGift: monthGift._sum.pointsAdded || 0,
        monthRevoke: Math.abs(monthRevoke._sum.pointsAdded || 0),
        totalGift: totalGift._sum.pointsAdded || 0,
        totalRevoke: Math.abs(totalRevoke._sum.pointsAdded || 0),
      },
    });
  } catch (error) {
    console.error("Query points history error:", error);
    return NextResponse.json(
      { message: "查询失败，请稍后重试" },
      { status: 500 }
    );
  }
}
