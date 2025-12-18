"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

interface UserDetail {
  id: number;
  email: string;
  name: string | null;
  points: number;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  signupBonusGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalDownloads: number;
  totalPointsSpent: number;
  totalPayments: number;
  totalPointsRecharged: number;
}

interface Download {
  id: number;
  resourceId: number;
  resourceTitle: string;
  category: string;
  pointsSpent: number;
  downloadedAt: string;
}

interface Payment {
  id: number;
  amount: number;
  points: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"downloads" | "payments">("downloads");

  useEffect(() => {
    const fetchUserDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/admin/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (response.status === 403) {
          setError("无管理员权限");
          setLoading(false);
          return;
        }

        if (response.status === 404) {
          setError("用户不存在");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "查询失败");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUser(data.user);
        setStats(data.stats);
        setDownloads(data.downloads);
        setPayments(data.payments);
      } catch (err) {
        console.error("Fetch user detail error:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [id, router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "pending":
        return "待处理";
      case "failed":
        return "失败";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
            <div className="text-4xl mb-4">😢</div>
            <div className="text-xl font-bold mb-2">{error}</div>
            <button
              onClick={() => router.push("/admin/users")}
              className="mt-4 btn-primary"
            >
              返回用户列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/users")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 返回用户列表
          </button>
        </div>

        {/* 用户基本信息 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">用户详情</h1>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">用户ID</label>
                <div className="mt-1 text-lg font-semibold">{user.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">邮箱</label>
                <div className="mt-1 text-lg">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">用户名</label>
                <div className="mt-1 text-lg">{user.name || "-"}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">当前积分</label>
                <div className="mt-1 text-lg font-bold text-blue-600">{user.points}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">邮箱验证</label>
                <div className="mt-1">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      已验证
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      未验证
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">注册奖励</label>
                <div className="mt-1">
                  {user.signupBonusGranted ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      已领取
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      未领取
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">注册时间</label>
                <div className="mt-1 text-sm">{formatDate(user.createdAt)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">最后更新</label>
                <div className="mt-1 text-sm">{formatDate(user.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDownloads}</div>
              <div className="text-sm text-gray-500">总下载次数</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.totalPointsSpent}</div>
              <div className="text-sm text-gray-500">总消费积分</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.totalPayments}</div>
              <div className="text-sm text-gray-500">充值次数</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalPointsRecharged}</div>
              <div className="text-sm text-gray-500">总充值积分</div>
            </div>
          </div>
        )}

        {/* 记录标签页 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("downloads")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "downloads"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                下载记录 ({downloads.length})
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "payments"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                充值记录 ({payments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "downloads" && (
              <div className="overflow-x-auto">
                {downloads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无下载记录
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          资源ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          资源名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          分类
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          消费积分
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          下载时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {downloads.map((download) => (
                        <tr key={download.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {download.resourceId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {download.resourceTitle}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {download.category}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            -{download.pointsSpent}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(download.downloadedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="overflow-x-auto">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无充值记录
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          订单ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          金额
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          积分
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          支付方式
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          状态
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {payment.id}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ¥{payment.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            +{payment.points}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {payment.paymentMethod || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {getStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
