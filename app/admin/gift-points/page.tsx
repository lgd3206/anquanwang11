"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface GiftResult {
  email: string;
  success: boolean;
  message: string;
  pointsAdded?: number;
  newBalance?: number;
}

export default function GiftPointsPage() {
  const router = useRouter();
  const [emailsText, setEmailsText] = useState("");
  const [points, setPoints] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [results, setResults] = useState<GiftResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    successCount: number;
    failCount: number;
  } | null>(null);

  // 页面加载时检查登录和管理员权限
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // 未登录，跳转到登录页（不设置 checking=false，保持 loading 状态）
        router.push("/login");
        setTimeout(() => alert("请先登录"), 100);
        return;
      }

      // 通过调用管理员API来验证权限（后端会检查）
      try {
        const response = await fetch("/api/admin/gift-points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emails: ["test@example.com"], points: 1 }),
        });

        // 如果返回403，说明不是管理员
        if (response.status === 403) {
          router.push("/dashboard");
          setTimeout(() => alert("无权限访问此页面"), 100);
          return;
        }

        // 如果返回401，说明未登录或token过期
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          setTimeout(() => alert("登录已过期，请重新登录"), 100);
          return;
        }

        // 权限验证通过，显示页面内容
        setIsAuthorized(true);
        setChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
        setTimeout(() => alert("验证失败，请重新登录"), 100);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setSummary(null);

    try {
      // 解析邮箱列表（支持逗号、分号、换行分隔）
      const emails = emailsText
        .split(/[,;\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emails.length === 0) {
        alert("请输入至少一个邮箱");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/gift-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails, points }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "赠送失败");
        setLoading(false);
        return;
      }

      setResults(data.results);
      setSummary({
        total: data.total,
        successCount: data.successCount,
        failCount: data.failCount,
      });
    } catch (error) {
      console.error("Gift points error:", error);
      alert("赠送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 验证中或未授权时显示 loading
  if (checking || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">验证权限中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-600">
              知识星球积分赠送
            </h1>
            <button
              onClick={() => router.push("/admin/import")}
              className="text-blue-600 hover:underline"
            >
              返回管理后台
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                赠送积分数量
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min="1"
                max="10000"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                建议：知识星球用户赠送 1000 积分
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户邮箱列表
              </label>
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="请输入邮箱，每行一个，或用逗号分隔&#10;例如：&#10;user1@example.com&#10;user2@example.com&#10;或：user1@example.com, user2@example.com"
                rows={10}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                支持换行、逗号、分号分隔
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "处理中..." : "批量赠送积分"}
            </button>
          </form>

          {/* 结果汇总 */}
          {summary && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                处理结果汇总
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {summary.total}
                  </div>
                  <div className="text-sm text-gray-500">总计</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {summary.successCount}
                  </div>
                  <div className="text-sm text-gray-500">成功</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {summary.failCount}
                  </div>
                  <div className="text-sm text-gray-500">失败</div>
                </div>
              </div>
            </div>
          )}

          {/* 详细结果 */}
          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-700 mb-4">
                详细结果
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        邮箱
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        状态
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        消息
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        新余额
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <tr
                        key={index}
                        className={result.success ? "bg-white" : "bg-red-50"}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {result.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.success
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {result.success ? "✓ 成功" : "✗ 失败"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {result.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {result.newBalance !== undefined
                            ? `${result.newBalance} 点`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
