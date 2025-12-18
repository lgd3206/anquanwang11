import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inferFileType, isSupportedForPreview } from "@/lib/file-preview";

/**
 * 预览内容API - 获取资源文件内容用于预览
 * GET /api/resources/[id]/preview-content
 *
 * 功能：返回资源的实际文件内容（PDF、图片、视频等）
 * 特点：完全免费，无需认证，不扣积分，无法下载
 * 安全：通过CSP头部和流媒体方式防止下载，不暴露网盘链接
 */

interface BaiduPanShareLink {
  shareId: string;
  password?: string;
}

/**
 * 模拟获取网盘文件内容
 * 注意：这是示例实现。实际场景需要：
 * 1. 使用SDK或API调用网盘服务
 * 2. 处理认证、过期等问题
 * 3. 缓存文件以避免重复请求
 */
async function getFileContentFromPan(
  resource: any
): Promise<ArrayBuffer | null> {
  try {
    // 这里需要根据实际的网盘类型来实现
    // 可以使用第三方库或网盘API

    // 临时方案：如果资源有直接链接，使用fetch获取
    if (resource.mainLink) {
      const response = await fetch(resource.mainLink, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.arrayBuffer();
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch file from pan:", error);
    return null;
  }
}

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
        pointsCost: true,
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

    // 获取文件内容
    const fileContent = await getFileContentFromPan(resource);

    if (!fileContent) {
      return NextResponse.json(
        { message: "预览文件获取失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 设置适当的MIME类型
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      image: "image/jpeg", // 默认为jpeg，实际会根据文件类型调整
      video: "video/mp4",
      text: "text/plain",
    };

    const mimeType = mimeTypes[fileType] || "application/octet-stream";

    // 返回文件内容，设置CSP头部防止下载
    return new Response(fileContent, {
      headers: {
        "Content-Type": mimeType,
        "Content-Security-Policy":
          "default-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600", // 缓存1小时
        "Content-Disposition": "inline", // 显示而不是下载
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
