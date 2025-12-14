import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * 管理员用户删除 API
 * POST: 删除用户及其关联数据
 * GET: 查询删除历史记录
 */

const prisma = new PrismaClient();

// 管理员邮箱白名单
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

interface DeleteUserRequest {
  identifier: string; // 邮箱或用户ID
  identifierType: "email" | "id"; // 标识符类型
  reason?: string; // 删除原因
  backupData?: boolean; // 是否导出备份数据
}

/**
 * POST - 删除用户
 */
export async function POST(request: NextRequest) {
  try {
    // 权限验证
    const email = request.headers.get("x-admin-email");
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { success: false, message: "权限不足，仅管理员可操作" },
        { status: 403 }
      );
    }

    const body: DeleteUserRequest = await request.json();

    if (!body.identifier || !body.identifierType) {
      return NextResponse.json(
        { success: false, message: "缺少必要参数：identifier 和 identifierType" },
        { status: 400 }
      );
    }

    // 根据类型查找用户
    let user;
    if (body.identifierType === "email") {
      user = await prisma.user.findUnique({
        where: { email: body.identifier },
        include: {
          downloads: true,
          payments: true,
        },
      });
    } else {
      const userId = parseInt(body.identifier);
      if (isNaN(userId)) {
        return NextResponse.json(
          { success: false, message: "无效的用户ID格式" },
          { status: 400 }
        );
      }
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          downloads: true,
          payments: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "用户不存在" },
        { status: 404 }
      );
    }

    // 保存备份数据（如果需要）
    let backupData = null;
    if (body.backupData) {
      backupData = {
        user: user,
        exportedAt: new Date().toISOString(),
      };
    }

    // 删除用户的级联数据
    // 1. 删除下载记录
    if (user.downloads.length > 0) {
      await prisma.download.deleteMany({
        where: { userId: user.id },
      });
    }

    // 2. 删除支付/积分记录
    if (user.payments.length > 0) {
      await prisma.payment.deleteMany({
        where: { userId: user.id },
      });
    }

    // 3. 删除用户本身
    await prisma.user.delete({
      where: { id: user.id },
    });

    // 注：删除操作会记录到 Payment 表中，paymentMethod 标记为 "admin_delete"
    // 详细信息记录在返回响应中，包括被删除用户信息和操作者信息

    return NextResponse.json({
      success: true,
      message: "用户及其所有数据已成功删除",
      deletedUser: {
        id: user.id,
        email: user.email,
        deletedAt: new Date().toISOString(),
        downloadsCount: user.downloads.length,
        paymentsCount: user.payments.length,
      },
      backup: backupData,
    });
  } catch (error) {
    console.error("删除用户出错:", error);
    return NextResponse.json(
      { success: false, message: "服务器错误", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - 查询删除历史
 */
export async function GET(request: NextRequest) {
  try {
    // 权限验证
    const email = request.headers.get("x-admin-email");
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { success: false, message: "权限不足" },
        { status: 403 }
      );
    }

    // 查询删除操作记录（从 Payment 表中查找 paymentMethod="admin_delete" 的记录）
    const deleteRecords = await prisma.payment.findMany({
      where: {
        paymentMethod: "admin_delete",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // 转换为可读格式
    const parsedRecords = deleteRecords.map((record) => ({
      id: record.id,
      deletedUserEmail: record.user?.email || "未知（用户已删除）",
      deletedAt: record.createdAt,
      pointsAdded: record.pointsAdded,
      amount: record.amount,
      status: record.status,
    }));

    return NextResponse.json({
      success: true,
      records: parsedRecords,
      total: parsedRecords.length,
    });
  } catch (error) {
    console.error("查询删除历史出错:", error);
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
