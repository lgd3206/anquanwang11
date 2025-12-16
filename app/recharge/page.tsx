"use client";

import { useState, useEffect, Suspense } from "react";
import Footer from '@/components/Footer';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeToast } from "@/lib/toast";
import Spinner from "@/components/ui/Spinner";
import { RECHARGE_PACKAGES, RechargePackage } from "@/lib/recharge-packages";

function RechargeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [paymentType, setPaymentType] = useState<"auto" | "manual">("auto");
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay">("wechat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isFirstRecharge, setIsFirstRecharge] = useState(false);
  const [checkingFirstRecharge, setCheckingFirstRecharge] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [manualOrderData, setManualOrderData] = useState<any>(null);

  // 检查是否首次充值
  useEffect(() => {
    const checkFirstRecharge = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingFirstRecharge(false);
        return;
      }

      try {
        const response = await fetch("/api/user/first-recharge", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsFirstRecharge(data.isFirstRecharge);
        }
      } catch (err) {
        console.error("Check first recharge error:", err);
      } finally {
        setCheckingFirstRecharge(false);
      }
    };

    checkFirstRecharge();
  }, []);

  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam) {
      const plan = RECHARGE_PACKAGES.find((p) => p.points === parseInt(planParam));
      if (plan) {
        setSelectedPackage(plan);
      }
    }
  }, [searchParams]);

  // 支付状态轮询
  useEffect(() => {
    if (!paymentId || !qrCode) {
      return;
    }

    const pollPaymentStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`/api/payments/status/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.isCompleted) {
            // 支付成功
            setPaymentStatus("success");
            safeToast.success(`支付成功！已充值 ${data.payment.pointsAdded} 积分`);

            // 停止轮询
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }

            // 2秒后关闭弹窗并刷新页面
            setTimeout(() => {
              setQrCode(null);
              setPaymentId(null);
              setPaymentStatus("");
              router.push("/dashboard"); // 跳转到个人中心查看积分
            }, 2000);
          } else if (data.isFailed) {
            // 支付失败
            setPaymentStatus("failed");
            safeToast.error("支付失败，请重试");

            // 停止轮询
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
          }
        }
      } catch (err) {
        console.error("Poll payment status error:", err);
      }
    };

    // 立即检查一次
    pollPaymentStatus();

    // 每3秒轮询一次
    const interval = setInterval(pollPaymentStatus, 3000);
    setPollingInterval(interval);

    // 清理函数
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [paymentId, qrCode, router]);

  // 关闭二维码弹窗时停止轮询
  const handleCloseQrCode = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setQrCode(null);
    setPaymentId(null);
    setPaymentStatus("");
  };

  const handleInitiatePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      safeToast.error("请先登录");
      router.push("/login");
      return;
    }

    if (!selectedPackage) {
      setError("请选择充值套餐");
      safeToast.error("请选择充值套餐");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 根据支付类型选择不同的API
      const endpoint = paymentType === "manual"
        ? "/api/payments/initiate-manual"
        : "/api/payments/initiate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "支付初始化失败");
        safeToast.error(data.message || "支付初始化失败");
        return;
      }

      if (paymentType === "manual") {
        // 手动支付：显示客服二维码
        setManualOrderData(data);
        safeToast.success("订单创建成功，请添加客服微信完成支付");
      } else {
        // 自动支付：显示支付二维码并轮询
        setPaymentId(data.paymentId);
        setQrCode(data.qrCode || "mock-qr-code");
        safeToast.success("支付初始化成功，请扫描二维码");
      }
    } catch (err) {
      setError("支付过程中出错，请重试");
      safeToast.error("支付过程中出错，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 复制订单号到剪贴板
  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    safeToast.success("订单号已复制到剪贴板");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            安全资源分享网
          </Link>
          <nav className="flex gap-6">
            <Link href="/resources" className="text-gray-700 hover:text-blue-600">
              资源库
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
              个人中心
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">充值积分</h1>

          {/* 首次充值优惠提示 */}
          {!checkingFirstRecharge && isFirstRecharge && (
            <div className="mb-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg shadow-lg p-6 text-white animate-pulse">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl">🎉</span>
                <h2 className="text-2xl font-bold">首次充值特惠</h2>
                <span className="text-4xl">🎁</span>
              </div>
              <p className="text-center text-lg font-medium mb-2">
                恭喜您！首次充值额外赠送 <span className="text-3xl font-bold">30%</span> 积分
              </p>
              <p className="text-center text-sm opacity-90">
                例如：充值1000积分，实际到账1300积分！仅限首次充值享受
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Package Selection */}
            <div className="lg:col-span-2">
              {/* 支付类型选择 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">选择支付方式</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => {
                      setPaymentType("auto");
                      setManualOrderData(null);
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentType === "auto"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">在线支付</div>
                    <div className="text-sm text-gray-600 mt-1">扫码即时到账</div>
                    <div className="text-xs text-green-600 mt-2">推荐使用</div>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentType("manual");
                      setQrCode(null);
                      setPaymentStatus("");
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentType === "manual"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-yellow-300"
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">客服支付</div>
                    <div className="text-sm text-gray-600 mt-1">添加微信支付</div>
                    <div className="text-xs text-yellow-600 mt-2">人工确认</div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">选择充值套餐</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {RECHARGE_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300 hover:shadow"
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          {pkg.badge}
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 mb-1">
                          {pkg.points}
                        </p>
                        <p className="text-gray-600 text-xs mb-2">积分</p>
                        <p className="text-lg font-bold text-gray-800 mb-1">
                          ¥{pkg.price}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ¥{(pkg.price / pkg.points).toFixed(3)}/点
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 text-center">
                    💡 充值越多越划算！10000积分套餐单价仅¥0.05/点
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">选择支付方式</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="wechat"
                      checked={paymentMethod === "wechat"}
                      onChange={(e) => setPaymentMethod(e.target.value as "wechat")}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">微信支付</p>
                      <p className="text-sm text-gray-600">扫描二维码完成支付</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="alipay"
                      checked={paymentMethod === "alipay"}
                      onChange={(e) => setPaymentMethod(e.target.value as "alipay")}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">支付宝</p>
                      <p className="text-sm text-gray-600">扫描二维码完成支付</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">订单摘要</h2>

                {selectedPackage ? (
                  <>
                    <div className="space-y-4 mb-6 pb-6 border-b">
                      <div className="flex justify-between">
                        <span className="text-gray-600">充值积分</span>
                        <span className="font-bold text-blue-600">
                          {selectedPackage.points}
                        </span>
                      </div>
                      {isFirstRecharge && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              <span>🎁</span>
                              <span>首充奖励(+30%)</span>
                            </span>
                            <span className="font-bold">
                              +{Math.floor(selectedPackage.points * 0.3)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-800">
                              实际到账
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              {selectedPackage.points + Math.floor(selectedPackage.points * 0.3)} 点
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">支付金额</span>
                        <span className="font-bold text-gray-800">
                          ¥{selectedPackage.price}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">支付方式</span>
                        <span className="font-bold text-gray-800">
                          {paymentMethod === "wechat" ? "微信支付" : "支付宝"}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleInitiatePayment}
                      disabled={loading}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" />
                          <span>处理中...</span>
                        </>
                      ) : (
                        "立即支付"
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      点击支付后将显示二维码
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    请先选择充值套餐
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          {qrCode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4 text-center">
                  {paymentMethod === "wechat" ? "微信支付" : "支付宝"}
                </h3>

                {paymentStatus === "success" ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-2xl font-bold text-green-600 mb-2">支付成功！</p>
                    <p className="text-gray-600">即将跳转到个人中心...</p>
                  </div>
                ) : paymentStatus === "failed" ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-2xl font-bold text-red-600 mb-2">支付失败</p>
                    <p className="text-gray-600 mb-4">请重试或选择其他支付方式</p>
                    <button
                      onClick={handleCloseQrCode}
                      className="btn-primary"
                    >
                      关闭
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-100 p-4 rounded-lg mb-4 flex items-center justify-center">
                      {qrCode && qrCode !== "mock-qr-code" ? (
                        <img
                          src={qrCode}
                          alt="支付二维码"
                          className="w-64 h-64"
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-gray-600 mb-2">扫描二维码支付</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ¥{selectedPackage?.price}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              (测试模式：实际生产中会显示真实二维码)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 text-center mb-2">
                        请使用{paymentMethod === "wechat" ? "微信" : "支付宝"}扫描二维码
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">充值金额:</span>
                          <span className="font-bold">¥{selectedPackage?.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">获得积分:</span>
                          <span className="font-bold text-blue-600">
                            {selectedPackage?.points}
                            {isFirstRecharge && selectedPackage && (
                              <span className="text-green-600">
                                {" "}+ {Math.floor(selectedPackage.points * 0.3)} (首充)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Spinner size="sm" />
                      <p className="text-sm text-gray-500">等待支付中...</p>
                    </div>

                    <button
                      onClick={handleCloseQrCode}
                      className="w-full btn-secondary"
                    >
                      取消支付
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 手动支付二维码弹窗 */}
          {manualOrderData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4 text-center">
                  👋 添加客服微信支付
                </h3>

                {/* 客服微信二维码 */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4 flex justify-center">
                  <img
                    src={manualOrderData.customerServiceQrCode}
                    alt="客服微信二维码"
                    className="w-64 h-64"
                  />
                </div>

                {/* 订单号提示 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-3 font-medium">
                    📋 请告知客服以下订单号：
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono font-bold text-blue-600 break-all">
                      {manualOrderData.orderId}
                    </code>
                    <button
                      onClick={() => copyOrderId(manualOrderData.orderId)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 whitespace-nowrap transition-colors"
                    >
                      复制
                    </button>
                  </div>
                </div>

                {/* 支付信息 */}
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">支付金额:</span>
                    <span className="font-bold text-blue-600">
                      ¥{manualOrderData.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">获得积分:</span>
                    <span className="font-bold text-green-600">
                      +{manualOrderData.totalPoints}
                    </span>
                  </div>
                  {manualOrderData.isFirstRecharge && (
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="text-gray-600">🎁 首充奖励:</span>
                      <span className="font-bold text-green-600">
                        +{manualOrderData.bonusPoints}
                      </span>
                    </div>
                  )}
                </div>

                {/* 支付步骤 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 font-bold mb-2">📝 支付步骤：</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>扫描上方二维码添加客服微信</li>
                    <li>复制上方订单号发送给客服</li>
                    <li>通过微信转账支付 ¥{manualOrderData.amount.toFixed(2)}</li>
                    <li>等待客服确认（通常5-10分钟）</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setManualOrderData(null)}
                    className="flex-1 btn-secondary"
                  >
                    已添加客服，关闭
                  </button>
                  <button
                    onClick={() => copyOrderId(manualOrderData.orderId)}
                    className="flex-1 btn-primary"
                  >
                    复制订单号
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  💡 订单成功提交后，客服会在后台进行确认
                </p>
              </div>
            </div>
          )}
        </div>
      </main>      <Footer />
</div>
  );
}

export default function RechargePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RechargeContent />
    </Suspense>
  );
}
