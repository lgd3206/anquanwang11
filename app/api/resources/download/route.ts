import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { downloadSchema, validateInput } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimitResult = withRateLimit(request, "download");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "令牌无效" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 输入验证
    const validation = validateInput(downloadSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { resourceId } = validation.data;

    // Get resource
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { message: "资源不存在" },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }

    // Check if user has enough points
    if (user.points < resource.pointsCost) {
      return NextResponse.json(
        {
          message: "积分不足",
          required: resource.pointsCost,
          current: user.points,
        },
        { status: 400 }
      );
    }

    // Check if already downloaded
    const existingDownload = await prisma.download.findFirst({
      where: {
        userId: payload.userId,
        resourceId: resourceId,
      },
    });

    if (existingDownload) {
      // Return existing download record
      return NextResponse.json({
        message: "您已下载过此资源",
        download: existingDownload,
        resource: {
          title: resource.title,
          mainLink: resource.mainLink,
          password: resource.password,
          backupLink1: resource.backupLink1,
          backupLink2: resource.backupLink2,
        },
      });
    }

    // Deduct points and create download record
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: { points: user.points - resource.pointsCost },
      }),
      prisma.download.create({
        data: {
          userId: payload.userId,
          resourceId: resourceId,
          pointsSpent: resource.pointsCost,
        },
      }),
      prisma.resource.update({
        where: { id: resourceId },
        data: { downloads: resource.downloads + 1 },
      }),
    ]);

    return NextResponse.json(
      {
        message: "下载成功",
        pointsSpent: resource.pointsCost,
        remainingPoints: user.points - resource.pointsCost,
        resource: {
          title: resource.title,
          mainLink: resource.mainLink,
          password: resource.password,
          backupLink1: resource.backupLink1,
          backupLink2: resource.backupLink2,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { message: "下载失败，请稍后重试" },
      { status: 500 }
    );
  }
}
