"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Spinner from "@/components/ui/Spinner";
import { safeToast } from "@/lib/toast";

interface Resource {
  id: number;
  title: string;
  category: {
    name: string;
  };
  description: string;
  mainLink: string;
  password?: string;
  backupLink1?: string;
  backupLink2?: string;
  pointsCost: number;
  downloads: number;
  isNew: boolean;
  createdAt: string;
}

interface DownloadResult {
  mainLink: string;
  password?: string;
  backupLink1?: string;
  backupLink2?: string;
  pointsSpent: number;
  remainingPoints: number;
}

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resourceId = params.id as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/resources/${resourceId}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "资源不存在");
          return;
        }
        const data = await response.json();
        setResource(data.resource);
      } catch (err) {
        console.error("Failed to fetch resource:", err);
        setError("网络错误，请检查您的连接");
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId]);

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.user.points);
        }
      } catch (err) {
        console.error("Failed to fetch user points:", err);
      }
    };

    fetchUserPoints();
  }, []);

  const handleDownload = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      safeToast.error("请先登录");
      router.push("/login");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const response = await fetch("/api/resources/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resourceId: parseInt(resourceId) }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          safeToast.error("登录已过期，请重新登录");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (response.status === 400 && data.required) {
          safeToast.error(
            `积分不足！需要 ${data.required} 点，当前 ${data.current} 点`
          );
          setError(`积分不足！需要 ${data.required} 点，当前 ${data.current} 点`);
          return;
        }

        safeToast.error(data.message || "下载失败");
        setError(data.message || "下载失败");
        return;
      }

      setDownloadResult({
        mainLink: data.resource.mainLink,
        password: data.resource.password,
        backupLink1: data.resource.backupLink1,
        backupLink2: data.resource.backupLink2,
        pointsSpent: data.pointsSpent || 0,
        remainingPoints: data.remainingPoints || userPoints || 0,
      });

      setUserPoints(data.remainingPoints || userPoints);

      if (data.message === "您已下载过此资源") {
        safeToast.success("已为您显示下载链接");
      } else {
        safeToast.success(
          `下载成功！消耗 ${data.pointsSpent} 点，剩余 ${data.remainingPoints} 点`
        );
      }
    } catch (err) {
      console.error("Download error:", err);
      safeToast.error("下载失败，请稍后重试");
      setError("下载过程中出错，请重试");
    } finally {
      setDownloading(false);
    }
  };

  const isNewResource = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-8 flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </main>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {error || "资源不存在"}
            </h2>
            <p className="text-gray-600 mb-6">
              该资源可能已被删除或您输入的链接有误
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                重新加载
              </button>
              <Link href="/resources" className="btn-primary">
                返回资源库
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="container py-8">
        <Link href="/resources" className="text-blue-600 hover:underline mb-6 inline-block">
          ← 返回资源库
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-800 flex-1">
                  {resource.title}
                </h1>
                {isNewResource(resource.createdAt) && (
                  <span className="badge-new">新</span>
                )}
              </div>

              <div className="flex gap-4 mb-6">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
                  {resource.category.name}
                </span>
                <span className="text-gray-600 text-sm">
                  📅 {new Date(resource.createdAt).toLocaleDateString("zh-CN")}
                </span>
                <span className="text-gray-600 text-sm">
                  💾 {resource.downloads} 次下载
                </span>
              </div>

              {resource.description && (
                <div className="mb-8 pb-8 border-b">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">资源描述</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {resource.description}
                  </p>
                </div>
              )}

              {downloadResult && (
                <div className="mb-8 pb-8 border-b bg-green-50 p-6 rounded-lg">
                  <h2 className="text-lg font-bold text-green-800 mb-4">
                    ✓ 下载成功
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">主链接</p>
                      <a
                        href={downloadResult.mainLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {downloadResult.mainLink}
                      </a>
                    </div>

                    {downloadResult.password && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">提取码</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-3 py-2 rounded font-mono font-bold">
                            {downloadResult.password}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(downloadResult.password!);
                              alert("已复制到剪贴板");
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            复制
                          </button>
                        </div>
                      </div>
                    )}

                    {downloadResult.backupLink1 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">备用链接1</p>
                        <a
                          href={downloadResult.backupLink1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {downloadResult.backupLink1}
                        </a>
                      </div>
                    )}

                    {downloadResult.backupLink2 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">备用链接2</p>
                        <a
                          href={downloadResult.backupLink2}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {downloadResult.backupLink2}
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        消耗积分: <span className="font-bold">{downloadResult.pointsSpent}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        剩余积分: <span className="font-bold text-blue-600">{downloadResult.remainingPoints}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-8 pb-8 border-b bg-red-50 p-6 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">消耗积分</p>
                <p className="text-4xl font-bold text-blue-600">
                  {resource.pointsCost}
                </p>
              </div>

              {userPoints !== null && (
                <div className="mb-6 pb-6 border-b">
                  <p className="text-gray-600 text-sm mb-2">您的积分</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {userPoints}
                  </p>
                  {userPoints < resource.pointsCost && (
                    <p className="text-red-600 text-sm mt-2">
                      积分不足，请先充值
                    </p>
                  )}
                </div>
              )}

              {!downloadResult ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading || (userPoints !== null && userPoints < resource.pointsCost)}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <Spinner size="sm" />
                      <span>下载中...</span>
                    </>
                  ) : (
                    "立即下载"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setDownloadResult(null)}
                  className="w-full btn-secondary"
                >
                  关闭
                </button>
              )}

              {userPoints !== null && userPoints < resource.pointsCost && (
                <Link
                  href="/recharge"
                  className="w-full btn-secondary text-center block mt-3"
                >
                  充值积分
                </Link>
              )}

              <div className="mt-6 pt-6 border-t text-sm text-gray-600 space-y-2">
                <p>
                  <span className="font-medium">下载次数:</span> {resource.downloads}
                </p>
                <p>
                  <span className="font-medium">上传时间:</span>{" "}
                  {new Date(resource.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
        <div className="container text-center">
          <p>&copy; 2025 安全资源分享网. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
