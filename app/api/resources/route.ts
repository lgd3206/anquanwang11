import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const freeOnly = searchParams.get("freeOnly") === "true"; // 新增：免积分筛选
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (category) {
      where.category = {
        name: category,
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (freeOnly) {
      where.pointsCost = 0; // 筛选积分为0的资源
    }

    // Get resources - 不返回敏感字段
    const resources = await prisma.resource.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Get total count
    const total = await prisma.resource.count({ where });

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get resources error:", error);
    return NextResponse.json(
      { message: "获取资源失败" },
      { status: 500 }
    );
  }
}
