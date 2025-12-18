"use client";

import { useState, useEffect } from "react";
import Spinner from "./ui/Spinner";

interface PreviewModalProps {
  resourceId: number;
  resourceTitle: string;
  onClose: () => void;
}

interface PreviewData {
  id: number;
  title: string;
  fileType: string;
  previewable: boolean;
  previewUrl: string;
  source: string;
  description: string;
  category: string;
}

export default function PreviewModal({
  resourceId,
  resourceTitle,
  onClose
}: PreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError("");
      setIframeError(false);
      setIframeLoading(true);

      try {
        const response = await fetch(`/api/resources/${resourceId}/preview`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "加载预览失败");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPreviewData(data.resource);

        // 设置超时检测：如果10秒内iframe没有加载成功，认为失败
        const timeoutId = setTimeout(() => {
          setIframeError(true);
          setIframeLoading(false);
        }, 10000);

        setLoading(false);
      } catch (err) {
        console.error("Preview fetch error:", err);
        setError("网络错误，请稍后重试");
        setLoading(false);
      }
    };

    fetchPreview();

    // ESC键关闭预览
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [resourceId, onClose]);

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoading(false);
    console.warn("iframe加载失败，可能是CSP限制或链接无效");
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              {resourceTitle}
            </h2>
            {previewData && (
              <p className="text-sm text-gray-500 mt-1">
                {previewData.source === 'baidu' ? '百度网盘' : previewData.source === 'quark' ? '夸克网盘' : '网盘'} •
                {previewData.category} • 免费预览
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none flex-shrink-0"
            aria-label="关闭预览"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-xl font-bold text-gray-800 mb-2">{error}</p>
              <p className="text-sm text-gray-600 mb-4">
                预览功能需要网盘分享链接有效且可访问
              </p>
              <button onClick={onClose} className="btn-primary">
                关闭
              </button>
            </div>
          ) : previewData ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Spinner size="lg" />
                </div>
              )}

              {/* iframe预览 */}
              <iframe
                src={previewData.previewUrl}
                className="w-full h-full border-0"
                title={`预览: ${previewData.title}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />

              {iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    完整预览功能开发中
                  </p>
                  <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                    我们正在为您开发更加安全和完善的预览功能。
                    <br />
                    敬请期待！
                  </p>
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-500">
                      ✨ 即将支持 PDF、Word、PPT、图片、视频等多种格式预览
                      <br />
                      ✨ 安全、流畅的预览体验
                    </p>
                  </div>
                  <button onClick={onClose} className="btn-secondary">
                    关闭
                  </button>
                </div>
              )}

              {/* 提示信息 */}
              {!iframeError && !iframeLoading && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap pointer-events-none">
                  💡 预览完全免费，不消耗积分
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 底部操作栏 */}
        {previewData && !loading && !error && !iframeError && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600 truncate flex-1 mr-4">
              {previewData.description || `${previewData.fileType?.toUpperCase() || ''}文件 - ${previewData.category}`}
            </div>
            <button onClick={onClose} className="btn-secondary flex-shrink-0">
              关闭预览
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

