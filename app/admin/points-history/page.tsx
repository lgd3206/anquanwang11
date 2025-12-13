"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PointsRecord {
  id: number;
  transactionId: string;
  userEmail: string;
  userName: string;
  type: string;
  pointsChange: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface Statistics {
  todayGift: number;
  todayRevoke: number;
  monthGift: number;
  monthRevoke: number;
  totalGift: number;
  totalRevoke: number;
}

const TYPE_LABELS: Record<string, string> = {
  gift: "管理员赠送",
  revoke: "管理员撤回",
  signup_bonus: "注册赠送",
  recharge: "积分充值",
  download: "资源下载",
};

const TYPE_COLORS: Record<string, string> = {
  gift: "text-green-600 bg-green-50",
  revoke: "text-red-600 bg-red-50",
  signup_bonus: "text-blue-600 bg-blue-50",
  recharge: "text-purple-600 bg-purple-50",
  download: "text-gray-600 bg-gray-50",
};

export default function PointsHistoryPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    todayGift: 0,
    todayRevoke: 0,
    monthGift: 0,
    monthRevoke: 0,
    totalGift: 0,
    totalRevoke: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 筛选参数
  const [filterType, setFilterType] = useState("all");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState("all"); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // 权限检查
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
        fetchHistory();
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
        setTimeout(() => alert("验证失败，请重新登录"), 100);
      }
    };

    checkAuth();
  }, [router]);

  // 获取历史记录
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", ((currentPage - 1) * pageSize).toString());

      if (filterType !== "all") {
        params.append("type", filterType);
      }

      if (filterEmail.trim()) {
        params.append("email", filterEmail.trim());
      }

      // 时间范围
      const { startDate, endDate } = getDateRange(filterTimeRange);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/admin/points-history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setStatistics(data.statistics || {});
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取日期范围
  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startDate = weekStart.toISOString();
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "custom":
        if (customStartDate) startDate = new Date(customStartDate).toISOString();
        if (customEndDate) endDate = new Date(customEndDate).toISOString();
        break;
    }

    return { startDate, endDate };
  };

  // 应用筛选
  const applyFilter = () => {
    setCurrentPage(1);
    fetchHistory();
  };

  // 重置筛选
  const resetFilter = () => {
    setFilterType("all");
    setFilterEmail("");
    setFilterTimeRange("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setCurrentPage(1);
    setTimeout(() => fetchHistory(), 0);
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 分页
  const totalPages = Math.ceil(total / pageSize);
  const goToPage = (page: number) => {
    setCurrentPage(page);
    setTimeout(() => fetchHistory(), 0);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">验证权限中...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">积分变动历史</h1>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 统计面板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">今日统计</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">+{statistics.todayGift}</p>
                <p className="text-xs text-gray-500">赠送积分</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">-{statistics.todayRevoke}</p>
                <p className="text-xs text-gray-500">撤回积分</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">本月统计</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">+{statistics.monthGift}</p>
                <p className="text-xs text-gray-500">赠送积分</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">-{statistics.monthRevoke}</p>
                <p className="text-xs text-gray-500">撤回积分</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">累计统计</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">+{statistics.totalGift}</p>
                <p className="text-xs text-gray-500">总赠送</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">-{statistics.totalRevoke}</p>
                <p className="text-xs text-gray-500">总撤回</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">筛选条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 类型筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                操作类型
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="gift">管理员赠送</option>
                <option value="revoke">管理员撤回</option>
                <option value="signup_bonus">注册赠送</option>
                <option value="recharge">积分充值</option>
              </select>
            </div>

            {/* 时间范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                时间范围
              </label>
              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="today">今天</option>
                <option value="week">最近7天</option>
                <option value="month">本月</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            {/* 用户邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户邮箱
              </label>
              <input
                type="email"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="输入邮箱搜索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilter}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "查询中..." : "查询"}
              </button>
              <button
                onClick={resetFilter}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                重置
              </button>
            </div>
          </div>

          {/* 自定义日期范围 */}
          {filterTimeRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 记录列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              变动记录 ({total} 条)
            </h3>
            <button
              onClick={fetchHistory}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              🔄 刷新
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        积分变化
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        交易ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.userName}
                          </div>
                          <div className="text-sm text-gray-500">{record.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              TYPE_COLORS[record.type] || "text-gray-600 bg-gray-50"
                            }`}
                          >
                            {TYPE_LABELS[record.type] || record.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold ${
                              record.pointsChange >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {record.pointsChange >= 0 ? "+" : ""}
                            {record.pointsChange}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {record.transactionId.substring(0, 20)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    显示 {(currentPage - 1) * pageSize + 1} 到{" "}
                    {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 border rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
