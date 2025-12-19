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
  source: string;
  description: string;
  category: string;
  pointsCost: number;
}

export default function PreviewModal({
  resourceId,
  resourceTitle,
  onClose
}: PreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/resources/${resourceId}/preview`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "加载失败");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              资源预览
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none flex-shrink-0"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">正在加载...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-xl font-bold text-gray-800 mb-2">{error}</p>
              <button onClick={onClose} className="btn-primary mt-4">
                关闭
              </button>
            </div>
          ) : previewData ? (
            <div className="flex flex-col items-center text-center">
              {/* 图标 */}
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>

              {/* 标题 */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {resourceTitle}
              </h3>

              {/* 资源信息 */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span>{previewData.source === 'baidu' ? '百度网盘' : previewData.source === 'quark' ? '夸克网盘' : '网盘'}</span>
                <span>•</span>
                <span>{previewData.category}</span>
                <span>•</span>
                <span className="text-blue-600 font-medium">{previewData.pointsCost} 积分</span>
              </div>

              {/* 说明文字 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🚧</div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      在线预览功能正在开发中
                    </p>
                    <p className="text-xs text-yellow-700">
                      由于网盘分享链接的技术限制，我们正在开发更好的预览解决方案。
                      目前请使用下载功能获取完整资源。
                    </p>
                  </div>
                </div>
              </div>

              {/* 下载提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">💡</div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      如何获取此资源？
                    </p>
                    <p className="text-xs text-blue-700">
                      点击"确定"关闭此窗口，然后在资源卡片上点击"下载"按钮，
                      系统会自动扣除 {previewData.pointsCost} 积分并提供网盘下载链接。
                    </p>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              {previewData.description && (
                <div className="text-left w-full max-w-md mb-6">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {previewData.description}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 底部按钮 */}
        {previewData && !loading && !error && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-center">
            <button onClick={onClose} className="btn-primary px-8">
              确定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
