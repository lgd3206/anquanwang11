import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

/**
 * 管理员查询注册用户列表
 * GET /api/admin/users
 *
 * 查询参数:
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20，最大100）
 * - search: 搜索关键词（邮箱或用户名）
 * - sortBy: 排序字段（createdAt, points, email）
 * - sortOrder: 排序方向（asc, desc）
 * - verified: 是否已验证邮箱（true, false, all）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "未授权访问" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "令牌无效" },
        { status: 401 }
      );
    }

    // 获取用户信息并验证管理员权限
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true },
    });

    if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email)) {
      return NextResponse.json(
        { message: "无管理员权限" },
        { status: 403 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const verified = searchParams.get("verified") || "all";

    // 构建查询条件
    const where: any = {};

    // 搜索条件
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // 邮箱验证状态筛选
    if (verified === "true") {
      where.emailVerifiedAt = { not: null };
    } else if (verified === "false") {
      where.emailVerifiedAt = null;
    }

    // 排序配置
    const validSortFields = ["createdAt", "points", "email", "name"];
    const orderBy: any = {};
    orderBy[validSortFields.includes(sortBy) ? sortBy : "createdAt"] = sortOrder;

    // 查询总数
    const total = await prisma.user.count({ where });

    // 查询用户列表
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        points: true,
        emailVerifiedAt: true,
        signupBonusGranted: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: true,
            payments: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // 计算统计信息
    const stats = await prisma.user.aggregate({
      _count: { id: true },
      _sum: { points: true },
      _avg: { points: true },
    });

    const verifiedCount = await prisma.user.count({
      where: { emailVerifiedAt: { not: null } },
    });

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        emailVerified: !!user.emailVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        signupBonusGranted: user.signupBonusGranted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        downloadCount: user._count.downloads,
        paymentCount: user._count.payments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalUsers: stats._count.id,
        verifiedUsers: verifiedCount,
        unverifiedUsers: stats._count.id - verifiedCount,
        totalPoints: stats._sum.points || 0,
        avgPoints: Math.round(stats._avg.points || 0),
      },
    });
  } catch (error) {
    console.error("Admin users query error:", error);
    return NextResponse.json(
      { message: "查询失败，请稍后重试" },
      { status: 500 }
    );
  }
}
