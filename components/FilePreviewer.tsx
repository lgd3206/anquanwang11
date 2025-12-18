"use client";

import { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import Spinner from "./ui/Spinner";

interface FilePreviewerProps {
  fileType: string;
  fileUrl: string;
  fileName: string;
  onError?: (error: string) => void;
}

export default function FilePreviewer({
  fileType,
  fileUrl,
  fileName,
  onError
}: FilePreviewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setImageLoaded(false);
    setVideoLoaded(false);

    // 禁用右键菜单和拖拽
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);

    // 对于图片和视频，设置加载超时
    let timeoutId: NodeJS.Timeout | null = null;
    if (fileType !== "pdf") {
      timeoutId = setTimeout(() => {
        if (!imageLoaded && !videoLoaded) {
          const errorMsg = "文件加载超时，请检查网络连接";
          setError(errorMsg);
          onError?.(errorMsg);
        }
      }, 8000);
    }

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fileUrl, fileType, imageLoaded, videoLoaded, onError]);

  // PDF文件处理
  if (fileType === "pdf") {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        <div className="flex-1 overflow-auto flex items-center justify-center bg-white">
          {loading ? (
            <Spinner size="lg" />
          ) : error ? (
            <div className="text-center p-8">
              <div className="text-6xl mb-4">❌</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <div className="w-full">
              <Document
                file={fileUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                  setLoading(false);
                }}
                onLoadError={(err) => {
                  const errorMsg = `PDF加载失败: ${err.message}`;
                  setError(errorMsg);
                  setLoading(false);
                  onError?.(errorMsg);
                }}
                loading={<Spinner size="lg" />}
              >
                <Page pageNumber={currentPage} />
              </Document>
            </div>
          )}
        </div>

        {/* PDF控制栏 */}
        {numPages && numPages > 1 && (
          <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              ← 上一页
            </button>

            <span className="text-sm">
              第 <input
                type="number"
                min="1"
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= numPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-12 px-2 py-1 bg-gray-700 text-white text-center rounded mx-1"
              /> / {numPages} 页
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage === numPages}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    );
  }

  // 图片文件处理
  if (fileType === "image") {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        {error ? (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : !imageLoaded && (
          <Spinner size="lg" />
        )}
        <div className="max-w-4xl max-h-full">
          <img
            src={fileUrl}
            alt={fileName}
            className={`max-w-full max-h-full object-contain select-none ${
              !imageLoaded ? "hidden" : ""
            }`}
            onLoad={() => {
              setImageLoaded(true);
              setLoading(false);
            }}
            onError={() => {
              const errorMsg = "图片加载失败";
              setError(errorMsg);
              setLoading(false);
              onError?.(errorMsg);
            }}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  // 视频文件处理
  if (fileType === "video") {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        {!videoLoaded && <Spinner size="lg" />}
        <video
          controls
          className={`max-w-full max-h-full ${!videoLoaded ? "hidden" : ""}`}
          controlsList="nodownload"
          onLoadedData={() => {
            setVideoLoaded(true);
            setLoading(false);
          }}
          onError={() => {
            const errorMsg = "视频加载失败";
            setError(errorMsg);
            setLoading(false);
            onError?.(errorMsg);
          }}
        >
          <source src={fileUrl} />
          您的浏览器不支持视频播放
        </video>
      </div>
    );
  }

  // 文本文件处理
  if (fileType === "text") {
    const [textContent, setTextContent] = useState("");
    const [textLoading, setTextLoading] = useState(true);

    useEffect(() => {
      const loadText = async () => {
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error("Failed to load text");
          const text = await response.text();
          setTextContent(text);
          setTextLoading(false);
          setLoading(false);
        } catch (err) {
          const errorMsg = "文本文件加载失败";
          setError(errorMsg);
          setTextLoading(false);
          setLoading(false);
          onError?.(errorMsg);
        }
      };
      loadText();
    }, [fileUrl, onError]);

    if (textLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-auto bg-white p-6">
        <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">
          {textContent}
        </pre>
      </div>
    );
  }

  // 不支持的文件类型
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-gray-600 mb-4">暂不支持该文件类型的预览</p>
        <p className="text-sm text-gray-500">文件类型: {fileType}</p>
      </div>
    </div>
  );
}
