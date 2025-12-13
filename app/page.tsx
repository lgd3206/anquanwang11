"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Counter } from "@/app/components/Counter";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalResources: 1200,
    totalUsers: 500,
    totalTransactions: 3000,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">安全资源分享网</div>

          {/* 桌面端导航 + 搜索 */}
          <div className="hidden md:flex gap-6 items-center flex-1 ml-12">
            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索资源..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </form>
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              首页
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-blue-600 transition">
              资源库
            </Link>
            <Link href="/login" className="btn-primary">
              登录
            </Link>
          </div>

          {/* 手机端：汉堡菜单 */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="text-2xl">☰</span>
            </button>
          </div>
        </div>

        {/* 手机端下拉菜单 */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container py-4 space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索资源..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="btn-primary"
                >
                  搜索
                </button>
              </form>
              <Link
                href="/"
                className="block text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                href="/resources"
                className="block text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                资源库
              </Link>
              <Link
                href="/login"
                className="block btn-primary text-center"
                onClick={() => setMenuOpen(false)}
              >
                登录
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white min-h-[80vh] flex items-center justify-center relative overflow-hidden">
        <div className="container text-center z-10 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            安全资源分享平台
          </h1>
          <p className="text-lg md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            汇聚安全课件、事故报告、标准规范、警示视频、管理书籍等优质资源
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:shadow-lg hover:scale-105 transition-transform duration-300 inline-block"
            >
              免费注册
            </Link>
            <Link
              href="/resources"
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300 inline-block"
            >
              浏览资源
            </Link>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce text-white text-2xl cursor-pointer" onClick={() => window.scrollBy({top: window.innerHeight, behavior: 'smooth'})}>
          ↓
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">平台特色</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            为全球安全专业人士提供高质量的学习和参考资源
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📚</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">丰富资源</h3>
              <p className="text-gray-600">
                涵盖安全课件、事故调查报告、标准规范等多个分类
              </p>
            </div>
            <div className="card text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🔐</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">安全可靠</h3>
              <p className="text-gray-600">
                用户认证、积分管理、安全下载，保护您的隐私
              </p>
            </div>
            <div className="card text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">灵活付费</h3>
              <p className="text-gray-600">
                注册赠送积分，支持微信/支付宝充值，按需消费
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">平台数据</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            获得全球安全专业人士的信任
          </p>
          {!statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
                <Counter target={stats.totalResources} label="优质资源" icon="📚" />
              </div>
              <div className="text-center p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
                <Counter target={stats.totalUsers} label="活跃用户" icon="👥" />
              </div>
              <div className="text-center p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
                <Counter target={stats.totalTransactions} label="成功交易" icon="💳" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-8 rounded-lg bg-white shadow-md animate-pulse">
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="bg-yellow-50 border-l-4 border-yellow-400 py-8">
        <div className="container">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ 免责声明</h3>
          <p className="text-yellow-700 text-sm">
            本网站仅为资源分享交流学习平台，所有资源均来自用户分享。用户应自行判断资源的合法性和真实性。
            本网站不对资源内容的准确性、完整性、合法性负责。付费仅为维持网站日常服务器等正常费用。
            用户使用本网站资源产生的任何后果，本网站不承担任何责任。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
        <div className="container text-center">
          <p>&copy; 2025 安全资源分享网. 保留所有权利。</p>
          <p className="text-sm mt-2">仅供学习交流使用</p>
        </div>
      </footer>
    </main>
  );
}
