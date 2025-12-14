"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

interface User {
  id: number;
  email: string;
  name: string;
  points: number;
  createdAt: string;
}

interface Download {
  id: number;
  resource: {
    id: number;
    title: string;
    category: string;
  };
  pointsSpent: number;
  downloadedAt: string;
}

interface Payment {
  id: number;
  transactionId: string;
  amount: number;
  pointsAdded: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "downloads" | "payments">("info");
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError("获取用户信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const fetchDownloads = async () => {
    setDownloadsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/downloads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDownloads(data.downloads);
      }
    } catch (err) {
      console.error("Failed to fetch downloads:", err);
    } finally {
      setDownloadsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white shadow-sm">
          <div className="container py-4 flex justify-between items-center">
            <div className="h-8 w-40 bg-gray-300 rounded animate-pulse"></div>
            <div className="flex gap-6 items-center">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <DashboardSkeleton type="profile" />
            </div>
            <div className="lg:col-span-2">
              <DashboardSkeleton type="table" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">用户信息加载失败</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            安全资源分享网
          </Link>
          <nav className="flex gap-6 items-center">
            <Link href="/resources" className="text-gray-700 hover:text-blue-600">
              资源库
            </Link>
            <div className="text-gray-700">
              积分: <span className="font-bold text-blue-600">{user.points}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-red-600"
            >
              退出登录
            </button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">个人信息</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">用户名</p>
                  <p className="text-lg font-medium text-gray-800">{user.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">邮箱</p>
                  <p className="text-lg font-medium text-gray-800">{user.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">注册时间</p>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">当前积分</p>
                  <div className="text-4xl font-bold text-blue-600 mb-4">
                    {user.points}
                  </div>
                  <Link
                    href="/recharge"
                    className="w-full btn-primary text-center block"
                  >
                    充值积分
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition-colors ${
                    activeTab === "info"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  个人信息
                </button>
                <button
                  onClick={() => {
                    setActiveTab("downloads");
                    fetchDownloads();
                  }}
                  className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition-colors ${
                    activeTab === "downloads"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  下载历史
                </button>
                <button
                  onClick={() => {
                    setActiveTab("payments");
                    fetchPayments();
                  }}
                  className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition-colors ${
                    activeTab === "payments"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  充值记录
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "info" && (
              <div className="space-y-8">
                {/* Points Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">积分说明</h2>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <span className="font-medium">注册赠送:</span> 新用户注册时赠送 30 点积分
                    </p>
                    <p>
                      <span className="font-medium">消费规则:</span> 下载资源时消费相应点数，具体根据资料价值由管理员设定
                    </p>
                    <p>
                      <span className="font-medium">充值方式:</span> 支持微信支付和支付宝充值
                    </p>
                    <p>
                      <span className="font-medium">有效期:</span> 积分长期有效，不设过期时间
                    </p>
                  </div>
                </div>

                {/* Points Pricing */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">资源消费标准</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            资源分类
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            消耗点数
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            说明
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-3">安全课件</td>
                          <td className="px-4 py-3 font-bold text-blue-600">5-20</td>
                          <td className="px-4 py-3 text-gray-600">培训资料、讲座PPT</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">标准规范</td>
                          <td className="px-4 py-3 font-bold text-blue-600">1-15</td>
                          <td className="px-4 py-3 text-gray-600">国家标准、行业规程</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">事故调查报告</td>
                          <td className="px-4 py-3 font-bold text-blue-600">1-10</td>
                          <td className="px-4 py-3 text-gray-600">各类事故调查报告</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">事故警示视频</td>
                          <td className="px-4 py-3 font-bold text-blue-600">3-20</td>
                          <td className="px-4 py-3 text-gray-600">警示教育视频</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">安全管理书籍</td>
                          <td className="px-4 py-3 font-bold text-blue-600">10-60</td>
                          <td className="px-4 py-3 text-gray-600">专业电子书籍</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recharge Plans */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">充值套餐</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { points: 50, price: 4.9, badge: "试水" },
                      { points: 100, price: 9.9 },
                      { points: 300, price: 24.9, badge: "推荐" },
                      { points: 500, price: 39.9 },
                      { points: 1000, price: 59.9, badge: "热销" },
                      { points: 2000, price: 99.9 },
                      { points: 5000, price: 199.9, badge: "最划算" },
                    ].map((plan) => (
                      <div
                        key={plan.points}
                        className="relative border border-gray-200 rounded-lg p-3 text-center hover:border-blue-600 hover:shadow-md transition-all"
                      >
                        {plan.badge && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </div>
                        )}
                        <p className="text-2xl font-bold text-blue-600 mb-1">
                          {plan.points}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">积分</p>
                        <p className="text-lg font-bold text-gray-800 mb-2">
                          ¥{plan.price}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          ¥{(plan.price / plan.points).toFixed(3)}/点
                        </p>
                        <Link
                          href={`/recharge?plan=${plan.points}`}
                          className="btn-primary w-full text-center block text-sm py-2"
                        >
                          充值
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 text-center font-medium">
                      💎 充值越多越划算！大额套餐最高优惠60%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Downloads Tab */}
            {activeTab === "downloads" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">下载历史</h2>
                {downloadsLoading ? (
                  <DashboardSkeleton type="table" />
                ) : downloads.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无下载记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            资源名称
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            分类
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            消耗积分
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            下载时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {downloads.map((download) => (
                          <tr key={download.id}>
                            <td className="px-4 py-3">
                              <Link
                                href={`/resources/${download.resource.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {download.resource.title}
                              </Link>
                            </td>
                            <td className="px-4 py-3">{download.resource.category}</td>
                            <td className="px-4 py-3 font-bold text-blue-600">
                              {download.pointsSpent}
                            </td>
                            <td className="px-4 py-3">
                              {new Date(download.downloadedAt).toLocaleDateString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">充值记录</h2>
                {paymentsLoading ? (
                  <DashboardSkeleton type="table" />
                ) : payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无充值记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            交易ID
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            金额
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            获得积分
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            支付方式
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            状态
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 font-mono text-xs">
                              {payment.transactionId.substring(0, 12)}...
                            </td>
                            <td className="px-4 py-3">¥{payment.amount}</td>
                            <td className="px-4 py-3 font-bold text-blue-600">
                              +{payment.pointsAdded}
                            </td>
                            <td className="px-4 py-3">
                              {payment.paymentMethod === "wechat" ? "微信支付" : "支付宝"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  payment.status === "success"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {payment.status === "success"
                                  ? "成功"
                                  : payment.status === "pending"
                                  ? "待支付"
                                  : "失败"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {new Date(payment.createdAt).toLocaleDateString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
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
