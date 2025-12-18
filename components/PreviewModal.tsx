"use client";

import { useState, useEffect } from "react";
import Spinner from "./ui/Spinner";
import FilePreviewer from "./FilePreviewer";

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
  source: string;
  description: string;
  category: string;
  previewUrl?: string;
}

export default function PreviewModal({
  resourceId,
  resourceTitle,
  onClose
}: PreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError("");
      setPreviewError("");

      try {
        // 获取预览元数据
        const response = await fetch(`/api/resources/${resourceId}/preview`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "加载预览失败");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPreviewData(data.resource);
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

  const handlePreviewError = (errorMsg: string) => {
    setPreviewError(errorMsg);
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
                预览功能需要资源分享链接有效且可访问
              </p>
              <button onClick={onClose} className="btn-primary">
                关闭
              </button>
            </div>
          ) : previewData ? (
            <>
              {previewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    预览加载失败
                  </p>
                  <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                    {previewError}
                  </p>
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-500">
                      💡 请稍后重试或点击"关闭"
                    </p>
                  </div>
                  <button onClick={onClose} className="btn-secondary">
                    关闭
                  </button>
                </div>
              )}

              {/* 文件预览组件 */}
              {!previewError && (
                <FilePreviewer
                  fileType={previewData.fileType}
                  fileUrl={`/api/resources/${resourceId}/preview-content`}
                  fileName={previewData.title}
                  onError={handlePreviewError}
                />
              )}

              {/* 如果出错则显示提示 */}
              {previewError && (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    预览加载失败
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {previewError}
                  </p>
                </div>
              )}

              {/* 提示信息 */}
              {!previewError && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap pointer-events-none">
                  💡 预览完全免费，不消耗积分
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 底部操作栏 */}
        {previewData && !loading && !error && !previewError && (
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
