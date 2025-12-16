import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "未授权" },
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get download records
    const downloads = await prisma.download.findMany({
      where: { userId: payload.userId },
      include: {
        resource: {
          include: { category: true },
        },
      },
      skip,
      take: limit,
      orderBy: { downloadedAt: "desc" },
    });

    // Get total count
    const total = await prisma.download.count({
      where: { userId: payload.userId },
    });

    return NextResponse.json({
      downloads: downloads.map((d) => ({
        id: d.id,
        resource: {
          id: d.resource.id,
          title: d.resource.title,
          category: d.resource.category.name,
        },
        pointsSpent: d.pointsSpent,
        downloadedAt: d.downloadedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get downloads error:", error);
    return NextResponse.json(
      { message: "获取下载历史失败" },
      { status: 500 }
    );
  }
}
