import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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
    const { name, pointsCost, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "分类名称不能为空" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        pointsCost: pointsCost || 10,
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
