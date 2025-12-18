import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

/**
 * 管理员查询单个用户详情
 * GET /api/admin/users/[id]
 *
 * 返回用户完整信息、下载记录、充值记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "无效的用户ID" },
        { status: 400 }
      );
    }

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

    // 获取管理员用户信息
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

    // 查询用户详情
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        points: true,
        emailVerifiedAt: true,
        signupBonusGranted: true,
        createdAt: true,
        updatedAt: true,
        downloads: {
          select: {
            id: true,
            pointsSpent: true,
            downloadedAt: true,
            resource: {
              select: {
                id: true,
                title: true,
                category: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { downloadedAt: "desc" },
          take: 50, // 最近50条下载记录
        },
        payments: {
          select: {
            id: true,
            amount: true,
            pointsAdded: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50, // 最近50条充值记录
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }

    // 计算用户统计
    const totalDownloads = await prisma.download.count({
      where: { userId },
    });

    const totalSpent = await prisma.download.aggregate({
      where: { userId },
      _sum: { pointsSpent: true },
    });

    const totalPayments = await prisma.payment.aggregate({
      where: { userId, status: "completed" },
      _sum: { pointsAdded: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        emailVerified: !!user.emailVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        signupBonusGranted: user.signupBonusGranted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        totalDownloads,
        totalPointsSpent: totalSpent._sum.pointsSpent || 0,
        totalPayments: totalPayments._count.id,
        totalPointsRecharged: totalPayments._sum.pointsAdded || 0,
      },
      downloads: user.downloads.map((d) => ({
        id: d.id,
        resourceId: d.resource.id,
        resourceTitle: d.resource.title,
        category: d.resource.category.name,
        pointsSpent: d.pointsSpent,
        downloadedAt: d.downloadedAt,
      })),
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        points: p.pointsAdded,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { message: "查询失败，请稍后重试" },
      { status: 500 }
    );
  }
}
