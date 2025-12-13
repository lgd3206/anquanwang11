"use client";

import { useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

function RegisterContent() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 调试：检查环境变量是否加载
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  React.useEffect(() => {
    if (!siteKey) {
      console.error("❌ NEXT_PUBLIC_HCAPTCHA_SITE_KEY 未在Vercel配置");
      setError("hCaptcha配置错误，请联系管理员");
    } else {
      console.log("✅ hCaptcha sitekey已加载:", siteKey.substring(0, 10) + "...");
    }
  }, [siteKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCaptchaChange = (token: string) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    // 验证hCaptcha
    if (!captchaToken) {
      setError("请完成人类验证");
      setLoading(false);
      return;
    }

    try {
      // 先验证captcha
      const captchaVerifyResponse = await fetch("/api/hcaptcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
      });

      if (!captchaVerifyResponse.ok) {
        setError("人类验证失败，请重试");
        // 重置captcha
        captchaRef.current?.resetCaptcha();
        return;
      }

      // captcha通过，提交注册
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "注册失败");
        // 重置captcha以便重试
        captchaRef.current?.resetCaptcha();
        return;
      }

      // 注册成功
      router.push("/login?registered=true");
    } catch (err) {
      setError("注册过程中出错，请重试");
      captchaRef.current?.resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
          注册账户
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用户名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="至少6个字符"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="再次输入密码"
            />
          </div>

          {/* hCaptcha 组件 */}
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            {siteKey ? (
              <HCaptcha
                ref={captchaRef}
                sitekey={siteKey}
                onVerify={handleCaptchaChange}
                theme="light"
                size="normal"
              />
            ) : (
              <div className="text-red-600 font-medium">hCaptcha配置错误</div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          已有账户？{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
