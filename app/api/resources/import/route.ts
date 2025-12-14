import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { resourceImportSchema, validateInput } from "@/lib/validation";
import { findDuplicates } from "@/lib/deduplication";

const prisma = new PrismaClient();

// 管理员邮箱列表（生产环境应存储在数据库或环境变量中）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    // 认证检查
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

    // 管理员权限检查
    if (!ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 输入验证
    const validation = validateInput(resourceImportSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    const { resources, importType } = validation.data;

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const duplicates: Array<{
      index: number;
      title: string;
      link: string;
      existingId: number;
      existingTitle: string;
      duplicateType: "link" | "title";
      reason: string;
    }> = [];

    // 获取所有现有资源用于查重
    const existingResources = await prisma.resource.findMany({
      select: {
        id: true,
        title: true,
        mainLink: true,
        categoryId: true,
        pointsCost: true,
      },
    });

    // 检查重复
    const duplicateResults = findDuplicates(
      resources.map((r) => ({ title: r.title, link: r.link })),
      existingResources,
      0.8 // 80% 相似度阈值
    );

    for (const dup of duplicateResults) {
      duplicates.push({
        index: dup.resourceIndex,
        title: dup.title,
        link: dup.link,
        existingId: dup.duplicateInfo.duplicate.id,
        existingTitle: dup.duplicateInfo.duplicate.title,
        duplicateType: dup.duplicateInfo.type as "link" | "title",
        reason: dup.duplicateInfo.reason,
      });
    }

    // 如果有重复资源，返回重复信息，不执行导入
    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          message: "检测到重复资源，请查证后重新导入",
          hasDuplicates: true,
          duplicateCount: duplicates.length,
          duplicates: duplicates,
          successCount: 0,
          failedCount: 0,
        },
        { status: 200 }
      );
    }

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
            title: resource.title.slice(0, 500), // 截断过长标题
            categoryId: category.id,
            description: (resource.description || "").slice(0, 5000),
            mainLink: resource.link,
            password: resource.password?.slice(0, 50),
            source: resource.source?.slice(0, 50),
            pointsCost: resource.pointsCost || category.pointsCost,
            isNew: true,
          },
        });

        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`资源 "${resource.title.slice(0, 50)}" 导入失败`);
      }
    }

    // Log import
    await prisma.importLog.create({
      data: {
        totalCount: resources.length,
        successCount,
        failedCount,
        importData: { importType, adminEmail: payload.email },
      },
    });

    return NextResponse.json(
      {
        message: "导入完成",
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
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
