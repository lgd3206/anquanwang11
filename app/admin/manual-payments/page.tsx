"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Spinner from "@/components/ui/Spinner";
import { safeToast } from "@/lib/toast";

interface ManualPaymentOrder {
  id: number;
  orderId: string;
  userEmail: string;
  userName: string;
  userCurrentPoints: number;
  amount: number;
  pointsAdded: number;
  paymentMethod: string;
  createdAt: string;
  waitingMinutes: number;
}

function ManualPaymentsContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<ManualPaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // 加载待确认订单列表
  const loadOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/admin/manual-payments/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        safeToast.error("登录已过期，请重新登录");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        safeToast.error("无权限访问此页面");
        router.push("/dashboard");
        return;
      }

      if (!response.ok) {
        safeToast.error("加载订单失败");
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Failed to load orders:", error);
      safeToast.error("网络错误，请检查您的连接");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadOrders();
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      loadOrders();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(timer);
  }, [autoRefresh]);

  // 确认订单
  const handleConfirmOrder = async (orderId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // 二次确认
    const confirmed = window.confirm(
      "确认要为此用户充值积分吗？\n此操作不可撤销，请仔细核对订单信息。"
    );
    if (!confirmed) return;

    setConfirming(orderId);

    try {
      const response = await fetch("/api/admin/manual-payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        safeToast.success(
          `订单确认成功！已为 ${data.user.email} 充值 ${data.payment.pointsAdded} 积分`
        );
        // 刷新列表
        await loadOrders();
      } else if (response.status === 404) {
        safeToast.error("订单不存在或已被删除");
        await loadOrders();
      } else if (response.status === 400) {
        safeToast.error(data.message || "无法确认订单，请刷新后重试");
        await loadOrders();
      } else {
        safeToast.error(data.message || "确认订单失败");
      }
    } catch (error) {
      console.error("Failed to confirm order:", error);
      safeToast.error("网络错误，请稍后重试");
    } finally {
      setConfirming(null);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN");
  };

  // 格式化等待时间
  const formatWaitingTime = (minutes: number) => {
    if (minutes < 1) return "1分钟内";
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 标题和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">手动支付订单管理</h1>
              <p className="text-gray-600">
                客服微信支付待确认订单列表
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadOrders()}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                {loading ? <Spinner size="sm" /> : "🔄"}
                手动刷新
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">自动刷新</span>
              </label>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">待确认订单</p>
              <p className="text-3xl font-bold text-yellow-600">{orders.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {lastRefreshTime
                  ? `最后更新: ${lastRefreshTime.toLocaleTimeString("zh-CN")}`
                  : ""}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">待充值金额</p>
              <p className="text-3xl font-bold text-blue-600">
                ¥{orders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {orders.length} 个订单
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">待充积分</p>
              <p className="text-3xl font-bold text-green-600">
                {orders.reduce((sum, o) => sum + o.pointsAdded, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                约 {orders.length} 位用户
              </p>
            </div>
          </div>

          {/* 订单列表 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-gray-600 mt-4">加载订单中...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-2">✨ 暂无待确认订单</p>
              <p className="text-sm text-gray-500">
                所有手动支付订单已处理完毕
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">
                      订单号
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">
                      用户信息
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">
                      金额
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">
                      积分
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">
                      支付方式
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">
                      提交时间
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit">
                          {order.orderId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {order.userName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {order.userEmail}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          当前积分: {order.userCurrentPoints}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        ¥{order.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        +{order.pointsAdded}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {order.paymentMethod === "manual_wechat"
                            ? "微信"
                            : "支付宝"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="text-sm">{formatTime(order.createdAt)}</div>
                        <div className="text-xs text-yellow-600 mt-1">
                          ⏱ {formatWaitingTime(order.waitingMinutes)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={confirming === order.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mx-auto"
                        >
                          {confirming === order.id && <Spinner size="sm" />}
                          确认充值
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 操作说明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-bold text-blue-900 mb-2">⚠️ 操作说明</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>仔细核对用户信息、订单号和金额，确认收款后再点击"确认充值"</li>
              <li>点击后系统将自动为用户充值相应积分，此操作不可撤销</li>
              <li>如果发现金额不符，请拒绝该订单或联系技术支持</li>
              <li>页面会自动每30秒刷新一次，也可手动点击"刷新"按钮</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 mt-12">
        <div className="container py-6 text-center text-sm text-gray-600">
          <p>手动支付管理系统 © 2024 - 仅供管理员使用</p>
        </div>
      </footer>
    </div>
  );
}

export default function ManualPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ManualPaymentsContent />
    </Suspense>
  );
}
