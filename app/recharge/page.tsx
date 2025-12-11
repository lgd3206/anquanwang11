"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface RechargePackage {
  points: number;
  price: number;
  discount?: string;
}

const packages: RechargePackage[] = [
  { points: 100, price: 9.9 },
  { points: 500, price: 39.9, discount: "8折" },
  { points: 1000, price: 69.9, discount: "7折" },
  { points: 2000, price: 129.9, discount: "6.5折" },
];

export default function RechargePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay">("wechat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam) {
      const plan = packages.find((p) => p.points === parseInt(planParam));
      if (plan) {
        setSelectedPackage(plan);
      }
    }
  }, [searchParams]);

  const handleInitiatePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedPackage) {
      setError("请选择充值套餐");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          points: selectedPackage.points,
          amount: selectedPackage.price,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "支付初始化失败");
        return;
      }

      // In production, this would be a real QR code from payment provider
      setQrCode(data.qrCode || "mock-qr-code");
    } catch (err) {
      setError("支付过程中出错，请重试");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8">充值积分</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Package Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">选择充值套餐</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.points}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPackage?.points === pkg.points
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {pkg.points}
                          </p>
                          <p className="text-gray-600 text-sm">积分</p>
                        </div>
                        {pkg.discount && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {pkg.discount}
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-gray-800">
                        ¥{pkg.price}
                      </p>
                    </div>
                  ))}
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
                      <div className="flex justify-between">
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
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "处理中..." : "立即支付"}
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
                <div className="bg-gray-100 p-4 rounded-lg mb-4 flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">扫描二维码支付</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{selectedPackage?.price}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  请使用{paymentMethod === "wechat" ? "微信" : "支付宝"}扫描上方二维码完成支付
                </p>
                <button
                  onClick={() => setQrCode(null)}
                  className="w-full btn-secondary"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
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
