import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * 预览API - 获取资源预览信息
 * GET /api/resources/[id]/preview
 *
 * 功能：返回资源的预览URL和基本信息
 * 特点：完全免费，无需认证，不扣积分
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

    // 生成预览URL
    const previewUrl = generatePreviewUrl(resource.mainLink, resource.source);

    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        title: resource.title,
        fileType: resource.fileType || 'unknown',
        previewable: resource.previewable,
        previewUrl: previewUrl,
        source: resource.source || 'unknown',
        description: resource.description || '',
        category: resource.category.name
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

/**
 * 生成预览URL
 * 对于百度网盘和夸克网盘，直接返回分享链接用于iframe嵌入
 */
function generatePreviewUrl(mainLink: string, source: string | null): string {
  // 百度网盘分享链接
  if (source === 'baidu' || mainLink.includes('pan.baidu.com')) {
    return mainLink;
  }

  // 夸克网盘分享链接
  if (source === 'quark' || mainLink.includes('pan.quark.cn')) {
    return mainLink;
  }

  // 其他链接直接返回
  return mainLink;
}
