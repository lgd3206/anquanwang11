"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { safeToast } from "@/lib/toast";
import FormError from "@/components/ui/FormError";
import FormSuccess from "@/components/ui/FormSuccess";
import Spinner from "@/components/ui/Spinner";

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
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 实时验证错误状态
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // 调试：检查环境变量是否加载
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  useEffect(() => {
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

    // 实时验证
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError("请输入有效的邮箱地址");
      } else {
        setEmailError("");
      }
    }

    if (name === "password") {
      if (value && value.length < 6) {
        setPasswordError("密码至少6个字符");
      } else {
        setPasswordError("");
      }
      // 同时验证确认密码
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setConfirmPasswordError("两次输入的密码不一致");
      } else {
        setConfirmPasswordError("");
      }
    }

    if (name === "confirmPassword") {
      if (value && value !== formData.password) {
        setConfirmPasswordError("两次输入的密码不一致");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleCaptchaChange = (token: string) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      safeToast.error("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    // 验证hCaptcha
    if (!captchaToken) {
      setError("请完成人类验证");
      safeToast.error("请完成人类验证");
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
        safeToast.error("人类验证失败，请重试");
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
        safeToast.error(data.message || "注册失败");
        // 重置captcha以便重试
        captchaRef.current?.resetCaptcha();
        return;
      }

      // 注册成功
      setSuccess("注册成功！正在跳转到登录页面...");
      safeToast.success("注册成功！请检查邮箱验证");
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1500);
    } catch (err) {
      setError("注册过程中出错，请重试");
      safeToast.error("注册过程中出错，请重试");
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

        <FormError message={error} />
        <FormSuccess message={success} />

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
            {emailError && <FormError message={emailError} className="mt-1" />}
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
            {passwordError && <FormError message={passwordError} className="mt-1" />}
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
            {confirmPasswordError && <FormError message={confirmPasswordError} className="mt-1" />}
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
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span>注册中...</span>
              </>
            ) : (
              "注册"
            )}
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
