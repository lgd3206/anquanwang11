import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inferFileType, isSupportedForPreview } from "@/lib/file-preview";

/**
 * 预览API - 获取资源预览信息和内容
 * GET /api/resources/[id]/preview
 *
 * 功能：返回资源的预览信息（不返回下载链接）
 * 特点：完全免费，无需认证，不扣积分
 * 安全：不提供任何直接下载的方式
 */
export async function GET(
  request: NextRequest,
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

    // 获取资源信息
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        title: true,
        mainLink: true,
        source: true,
        fileType: true,
        previewable: true,
        description: true,
        pointsCost: true,
        downloads: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    if (!resource) {
      return NextResponse.json(
        { message: "资源不存在" },
        { status: 404 }
      );
    }

    if (!resource.previewable) {
      return NextResponse.json(
        { message: "该资源不支持预览" },
        { status: 400 }
      );
    }

    // 推断文件类型（如果没有标记）
    const fileType = resource.fileType || inferFileType(resource.title);

    // 检查是否支持预览
    if (!isSupportedForPreview(fileType)) {
      return NextResponse.json({
        success: true,
        resource: {
          id: resource.id,
          title: resource.title,
          fileType: fileType,
          previewable: false,
          description: resource.description || "",
          category: resource.category.name,
          pointsCost: resource.pointsCost,
          downloads: resource.downloads,
          message: `暂不支持 ${fileType} 类型文件的在线预览`
        }
      });
    }

    // 返回预览信息（不返回网盘链接）
    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        title: resource.title,
        fileType: fileType,
        previewable: true,
        description: resource.description || "",
        category: resource.category.name,
        pointsCost: resource.pointsCost,
        downloads: resource.downloads,
        source: resource.source || "unknown"
      }
    });
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { message: "预览失败，请稍后重试" },
      { status: 500 }
    );
  }
}

