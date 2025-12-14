"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  showSearch?: boolean; // 是否显示搜索框（首页需要）
}

export default function Header({ showSearch = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserPoints(data.user.points);
          setUserName(data.user.name);
        } else {
          // Token 无效，清除
          localStorage.removeItem("token");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [pathname]); // pathname 变化时重新检查

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources?search=${encodeURIComponent(searchQuery)}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserPoints(null);
    setUserName("");
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition"
        >
          安全资源分享网
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex gap-6 items-center">
          {/* 搜索框（首页显示） */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索资源..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </form>
          )}

          {/* 导航链接 */}
          <Link
            href="/"
            className={`transition ${
              isActive("/")
                ? "text-blue-600 font-medium"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            首页
          </Link>
          <Link
            href="/resources"
            className={`transition ${
              isActive("/resources") || pathname?.startsWith("/resources/")
                ? "text-blue-600 font-medium"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            资源库
          </Link>

          {/* 登录状态相关 */}
          {isLoggedIn ? (
            <>
              {/* 积分显示 */}
              {userPoints !== null && (
                <div className="text-gray-700 px-3 py-1 bg-blue-50 rounded-lg">
                  积分:{" "}
                  <span className="font-bold text-blue-600">{userPoints}</span>
                </div>
              )}

              {/* 充值按钮 */}
              <Link
                href="/recharge"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                充值
              </Link>

              {/* 个人中心 */}
              <Link
                href="/dashboard"
                className={`transition ${
                  isActive("/dashboard")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                个人中心
              </Link>

              {/* 退出登录 */}
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 transition"
              >
                退出
              </button>
            </>
          ) : (
            <>
              {/* 未登录：显示登录和注册 */}
              <Link
                href="/login"
                className={`transition ${
                  isActive("/login")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                登录
              </Link>
              <Link href="/register" className="btn-primary">
                注册
              </Link>
            </>
          )}
        </div>

        {/* 手机端：汉堡菜单 */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="菜单"
          >
            <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* 手机端下拉菜单 */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-4 space-y-4">
            {/* 搜索框（首页显示） */}
            {showSearch && (
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索资源..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button type="submit" className="btn-primary">
                  搜索
                </button>
              </form>
            )}

            {/* 导航链接 */}
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`block py-2 transition ${
                isActive("/")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              首页
            </Link>
            <Link
              href="/resources"
              onClick={() => setMenuOpen(false)}
              className={`block py-2 transition ${
                isActive("/resources") || pathname?.startsWith("/resources/")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              资源库
            </Link>

            {/* 登录状态相关 */}
            {isLoggedIn ? (
              <>
                {/* 积分显示 */}
                {userPoints !== null && (
                  <div className="py-2 text-gray-700">
                    积分:{" "}
                    <span className="font-bold text-blue-600">{userPoints}</span>
                  </div>
                )}

                <Link
                  href="/recharge"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  充值
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 transition ${
                    isActive("/dashboard")
                      ? "text-blue-600 font-medium"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  个人中心
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 hover:text-red-600 transition"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 transition ${
                    isActive("/login")
                      ? "text-blue-600 font-medium"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 btn-primary text-center"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
