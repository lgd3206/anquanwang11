import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 管理员邮箱列表
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { message: "无效的资源ID" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        title: true,
        description: true,
        pointsCost: true,
        downloads: true,
        isNew: true,
        createdAt: true,
        updatedAt: true,
        source: true,
        category: {
          select: {
            id: true,
            name: true,
            pointsCost: true,
            description: true,
          },
        },
        // 明确不返回: mainLink, password, backupLink1, backupLink2
      },
    });

    if (!resource) {
      return NextResponse.json(
        { message: "资源不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { message: "获取资源失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Token无效或已过期" }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true },
    });

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
    }

    const { id } = await params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return NextResponse.json({ message: "无效的资源ID" }, { status: 400 });
    }

    // 检查资源是否存在
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        category: true,
        _count: {
          select: {
            downloadRecords: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ message: "资源不存在" }, { status: 404 });
    }

    // 使用事务删除资源及其相关数据
    await prisma.$transaction(async (tx) => {
      // 1. 删除所有下载记录
      await tx.download.deleteMany({
        where: { resourceId: resourceId },
      });

      // 2. 删除资源本身
      await tx.resource.delete({
        where: { id: resourceId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "资源删除成功",
      deletedResource: {
        id: resource.id,
        title: resource.title,
        category: resource.category.name,
        downloadsCount: resource._count.downloadRecords,
      },
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    return NextResponse.json(
      { message: "服务器错误，删除失败" },
      { status: 500 }
    );
  }
}
