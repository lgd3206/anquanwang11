"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RevokeRecord {
  transactionId: string;
  userEmail: string;
  userName: string;
  revokedPoints: number;
  revokedAt: string;
}

export default function RevokePointsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [revokeHistory, setRevokeHistory] = useState<RevokeRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 页面加载时检查权限
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        setTimeout(() => alert("请先登录"), 100);
        return;
      }

      try {
        const response = await fetch("/api/admin/gift-points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            users: [{ email: "test@example.com" }],
            pointsPerUser: 0,
          }),
        });

        if (response.status === 403) {
          router.push("/dashboard");
          setTimeout(() => alert("无权限访问此页面"), 100);
          return;
        }

        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          setTimeout(() => alert("登录已过期，请重新登录"), 100);
          return;
        }

        setIsAuthorized(true);
        setChecking(false);
        fetchRevokeHistory();
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
        setTimeout(() => alert("验证失败，请重新登录"), 100);
      }
    };

    checkAuth();
  }, [router]);

  // 获取撤回历史
  const fetchRevokeHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setHistoryLoading(true);
    try {
      const response = await fetch("/api/admin/revoke-points", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRevokeHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch revoke history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理撤回
  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("请先登录");
        router.push("/login");
        return;
      }

      if (!email.trim()) {
        setMessage("请输入用户邮箱");
        setLoading(false);
        return;
      }

      if (!points || parseInt(points) <= 0) {
        setMessage("请输入有效的积分数量");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/revoke-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          points: parseInt(points),
          reason: reason || "管理员撤回",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`撤回失败: ${data.message}`);
        return;
      }

      setMessage(
        `✅ 撤回成功！已从 ${email} 用户撤回 ${points} 积分。当前积分: ${data.currentPoints}`
      );
      setEmail("");
      setPoints("");
      setReason("");
      fetchRevokeHistory();
    } catch (error) {
      setMessage(`撤回过程中出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (checking || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">验证权限中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-blue-600">积分撤回管理</h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revoke Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">撤回积分</h2>

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="例: user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    撤回积分数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="例: 1000"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    撤回原因 (可选)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="例: 知识星球赠送错误"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>

                {message && (
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.includes("✅")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {loading ? "处理中..." : "确认撤回"}
                </button>
              </form>

              {/* Warning */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>注意：</strong>此操作将从用户账户扣除指定积分。请仔细检查邮箱和积分数量。
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">操作说明</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-800 mb-1">📧 邮箱</p>
                <p>输入需要撤回的用户邮箱地址</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">💰 积分</p>
                <p>输入需要撤回的积分数量（正整数）</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">📝 原因</p>
                <p>可选，记录撤回原因供审计</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revoke History */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">撤回历史</h2>
            {historyLoading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : revokeHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无撤回记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        用户邮箱
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        用户名
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        撤回积分
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {revokeHistory.map((record) => (
                      <tr key={record.transactionId}>
                        <td className="px-4 py-3 text-blue-600">{record.userEmail}</td>
                        <td className="px-4 py-3">{record.userName}</td>
                        <td className="px-4 py-3 font-bold text-red-600">
                          -{record.revokedPoints}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(record.revokedAt).toLocaleDateString("zh-CN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
