import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inferFileType, isSupportedForPreview } from "@/lib/file-preview";

/**
 * 预览内容API - 获取资源预览信息（包括可预览的URL）
 * GET /api/resources/[id]/preview-content
 *
 * 功能：返回资源的预览URL和信息
 * 特点：完全免费，无需认证，不扣积分
 * 安全：只返回预览URL，不返回下载链接
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
      },
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
        { status: 403 }
      );
    }

    // 推断文件类型
    const fileType = resource.fileType || inferFileType(resource.title);

    // 检查是否支持预览
    if (!isSupportedForPreview(fileType)) {
      return NextResponse.json(
        { message: `暂不支持 ${fileType} 类型文件的预览` },
        { status: 400 }
      );
    }

    // 返回预览信息 - 只返回预览URL，由客户端CORS处理
    // 注意：这里直接返回网盘链接给客户端，客户端通过浏览器加载
    // 这样可以规避服务器端的网络限制
    return NextResponse.json({
      success: true,
      previewContent: {
        id: resource.id,
        title: resource.title,
        fileType: fileType,
        previewUrl: resource.mainLink, // 直接返回网盘链接给客户端
        source: resource.source,
      },
    });
  } catch (error) {
    console.error("Preview content API error:", error);
    return NextResponse.json(
      { message: "预览失败，请稍后重试" },
      { status: 500 }
    );
  }
}
