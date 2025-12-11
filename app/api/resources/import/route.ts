import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { resources, importType } = await request.json();

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { message: "没有资源数据" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const resource of resources) {
      try {
        // Get or create category
        let category = await prisma.category.findUnique({
          where: { name: resource.category || "安全课件" },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: resource.category || "安全课件",
              pointsCost: resource.pointsCost || 10,
            },
          });
        }

        // Create resource
        await prisma.resource.create({
          data: {
            title: resource.title,
            categoryId: category.id,
            description: resource.description || "",
            mainLink: resource.link,
            password: resource.password,
            source: resource.source,
            pointsCost: resource.pointsCost || category.pointsCost,
            isNew: true,
          },
        });

        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`资源 "${resource.title}" 导入失败: ${error}`);
      }
    }

    // Log import
    await prisma.importLog.create({
      data: {
        totalCount: resources.length,
        successCount,
        failedCount,
        importData: { importType, resources },
      },
    });

    return NextResponse.json(
      {
        message: "导入完成",
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { message: "导入失败，请稍后重试" },
      { status: 500 }
    );
  }
}
