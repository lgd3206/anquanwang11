"use client";

import { useState } from "react";

interface VerificationBannerProps {
  email: string;
  isVerified: boolean;
}

export default function VerificationBanner({
  email,
  isVerified,
}: VerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  if (isVerified) {
    return null; // 已验证则不显示
  }

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType("success");
        setMessage("✅ 验证邮件已发送！请检查您的邮箱（含垃圾箱）");
      } else {
        setMessageType("error");
        setMessage(`❌ ${data.message || "发送失败，请稍后重试"}`);
      }
    } catch (error) {
      setMessageType("error");
      setMessage("❌ 网络错误，请稍后重试");
      console.error("Resend error:", error);
    } finally {
      setLoading(false);
      // 3秒后隐藏消息
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-red-800 mb-1">⚠️ 邮箱未验证</h3>
          <p className="text-sm text-red-700 mb-3">
            您的邮箱尚未验证。为了确保账户安全和获取完整功能，请验证您的邮箱。
          </p>

          {message && (
            <p
              className={`text-sm mb-3 p-2 rounded ${
                messageType === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </p>
          )}

          <button
            onClick={handleResendEmail}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
            }`}
          >
            {loading ? "⏳ 发送中..." : "📧 立即验证邮箱"}
          </button>
        </div>

        {/* 验证步骤提示 */}
        <div className="hidden sm:block text-xs text-red-600 bg-white p-3 rounded flex-shrink-0">
          <div className="font-semibold mb-2">验证步骤：</div>
          <div className="space-y-1">
            <div>1️⃣ 点击按钮发送邮件</div>
            <div>2️⃣ 查收验证邮件</div>
            <div>3️⃣ 点击链接验证</div>
          </div>
        </div>
      </div>

      {/* 帮助信息 */}
      <details className="mt-3 text-xs text-red-600 cursor-pointer">
        <summary className="font-semibold hover:text-red-800">
          💡 未收到邮件？
        </summary>
        <div className="mt-2 p-2 bg-white rounded text-red-700 space-y-1">
          <p>• 检查垃圾邮件/垃圾箱文件夹</p>
          <p>• 确保邮箱地址正确（{email}）</p>
          <p>• 检查网络连接是否正常</p>
          <p>• 稍候几分钟后重试</p>
        </div>
      </details>
    </div>
  );
}
