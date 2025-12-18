import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inferFileType, isSupportedForPreview } from "@/lib/file-preview";

/**
 * 预览内容API - 通过服务器代理获取网盘文件内容
 * GET /api/resources/[id]/preview-content
 *
 * 功能：从服务器端获取网盘文件，避免CORS问题
 * 特点：完全免费，无需认证，不扣积分
 * 安全：服务器端代理，用户看不到原始网盘链接
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

    // 从网盘获取文件内容
    if (!resource.mainLink) {
      return NextResponse.json(
        { message: "网盘链接不存在" },
        { status: 400 }
      );
    }

    try {
      // 使用服务器端 fetch 获取文件
      const fileResponse = await fetch(resource.mainLink, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "*/*",
          "Referer": resource.mainLink,
        },
        // 不跟随重定向，因为我们要处理 302 响应
        redirect: "manual",
      });

      // 如果是 302 重定向，获取实际文件 URL
      if (fileResponse.status === 302 || fileResponse.status === 301) {
        const redirectUrl = fileResponse.headers.get("location");
        if (redirectUrl) {
          const actualResponse = await fetch(redirectUrl, {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          if (!actualResponse.ok) {
            return NextResponse.json(
              { message: "文件获取失败（重定向失败）" },
              { status: 500 }
            );
          }

          const arrayBuffer = await actualResponse.arrayBuffer();
          const mimeType = getMimeType(fileType);

          return new Response(arrayBuffer, {
            headers: {
              "Content-Type": mimeType,
              "Content-Length": arrayBuffer.byteLength.toString(),
              "Cache-Control": "private, max-age=3600",
              "Content-Disposition": "inline",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
      }

      if (!fileResponse.ok) {
        return NextResponse.json(
          { message: `文件获取失败 (${fileResponse.status})` },
          { status: 500 }
        );
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      const mimeType = getMimeType(fileType);

      return new Response(arrayBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Length": arrayBuffer.byteLength.toString(),
          "Cache-Control": "private, max-age=3600",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (fetchError) {
      console.error("Failed to fetch file from network drive:", fetchError);
      return NextResponse.json(
        {
          message:
            "无法从网盘获取文件，可能是网络连接问题或链接已过期",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Preview content API error:", error);
    return NextResponse.json(
      { message: "预览失败，请稍后重试" },
      { status: 500 }
    );
  }
}

function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    image: "image/jpeg",
    video: "video/mp4",
    text: "text/plain",
    audio: "audio/mpeg",
  };
  return mimeTypes[fileType] || "application/octet-stream";
}
