/**
 * 网盘文件处理工具
 * 用于从百度网盘等获取文件内容进行预览
 */

interface BaiduPanShareLink {
  shareId: string;
  password?: string;
}

/**
 * 解析百度网盘分享链接
 * 链接格式：https://pan.baidu.com/s/1xxxx?pwd=xxxx
 */
export function parseBaiduPanLink(link: string): BaiduPanShareLink | null {
  try {
    const url = new URL(link);
    const path = url.pathname;
    const pwd = url.searchParams.get("pwd");

    // 提取 shareId: /s/1xxxx -> 1xxxx
    const match = path.match(/\/s\/(\w+)/);
    if (!match) return null;

    return {
      shareId: match[1],
      password: pwd || undefined
    };
  } catch {
    return null;
  }
}

/**
 * 解析夸克网盘分享链接
 * 链接格式：https://pan.quark.cn/s/xxxx
 */
export function parseQuarkPanLink(link: string): BaiduPanShareLink | null {
  try {
    const url = new URL(link);
    const path = url.pathname;
    const pwd = url.searchParams.get("pwd");

    // 提取 shareId: /s/xxxx -> xxxx
    const match = path.match(/\/s\/(\w+)/);
    if (!match) return null;

    return {
      shareId: match[1],
      password: pwd || undefined
    };
  } catch {
    return null;
  }
}

/**
 * 根据文件名推断文件类型
 */
export function inferFileType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  // PDF
  if (ext === "pdf") return "pdf";

  // 图片
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext))
    return "image";

  // 视频
  if (["mp4", "avi", "mov", "mkv", "webm", "flv"].includes(ext))
    return "video";

  // 音频
  if (["mp3", "wav", "flac", "aac"].includes(ext)) return "audio";

  // Office文档
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "ppt";

  // 压缩包
  if (["zip", "rar", "7z", "tar"].includes(ext)) return "archive";

  // 纯文本
  if (["txt", "md", "log"].includes(ext)) return "text";

  return "other";
}

/**
 * 验证文件类型是否支持预览
 */
export function isSupportedForPreview(fileType: string): boolean {
  return ["pdf", "image", "video", "text"].includes(fileType);
}

/**
 * 获取文件MIME类型
 */
export function getFileMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    image: "image/*",
    video: "video/mp4",
    audio: "audio/mpeg",
    word: "application/msword",
    excel: "application/vnd.ms-excel",
    ppt: "application/vnd.ms-powerpoint",
    text: "text/plain",
    archive: "application/zip"
  };

  return mimeTypes[fileType] || "application/octet-stream";
}
