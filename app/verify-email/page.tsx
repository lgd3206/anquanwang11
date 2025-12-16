"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { safeToast } from "@/lib/toast";
import FormError from "@/components/ui/FormError";
import FormSuccess from "@/components/ui/FormSuccess";
import Spinner from "@/components/ui/Spinner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 重发验证邮件
  const handleResendEmail = async () => {
    if (!email) {
      setError("邮箱信息丢失，请重新注册");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "发送验证邮件失败");
        safeToast.error(data.message || "发送验证邮件失败");
        return;
      }

      setMessage("验证邮件已重新发送，请检查收件箱");
      safeToast.success("验证邮件已重新发送");
      setCountdown(60); // 60秒倒计时
    } catch (err) {
      setError("网络错误，请稍后重试");
      safeToast.error("网络错误，请稍后重试");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">验证邮箱</h1>
          <p className="text-gray-600">请检查您的邮箱完成验证</p>
        </div>

        <FormError message={error} />
        <FormSuccess message={message} />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>已发送到:</strong> <span className="text-blue-600 font-medium">{email}</span>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            • 请检查收件箱和垃圾邮件文件夹
            <br />
            • 验证链接24小时内有效
            <br />
            • 验证后可享受下载权限和积分充值功能
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block text-center btn-secondary w-full"
          >
            返回登录
          </Link>

          <button
            onClick={handleResendEmail}
            disabled={resending || countdown > 0}
            className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {resending ? (
              <>
                <Spinner size="sm" />
                <span>发送中...</span>
              </>
            ) : countdown > 0 ? (
              `${countdown}秒后重试`
            ) : (
              "重新发送验证邮件"
            )}
          </button>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          验证完成后，您可以：
          <br />
          ✓ 下载资源
          <br />
          ✓ 充值积分
          <br />
          ✓ 解锁全部功能
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
