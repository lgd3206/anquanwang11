"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Counter } from "@/app/components/Counter";

export default function Home() {
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

  return (
    <main className="flex-1">
      {/* Header with search */}
      <Header showSearch={true} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white min-h-[80vh] flex items-center justify-center relative overflow-hidden">
        <div className="container text-center z-10 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            安全资源分享平台
          </h1>
          <p className="text-lg md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto text-center">
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
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">平台特色</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto text-lg leading-relaxed">
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
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">平台数据</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto text-lg leading-relaxed">
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

      {/* 重要提示 - 移到 Footer 上方，改为折叠样式 */}
      <section className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-gray-900 transition">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="font-medium">重要提示与免责声明</span>
              </div>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-2">
              <p>
                本网站仅为资源分享交流学习平台，所有资源均来自用户分享。用户应自行判断资源的合法性和真实性。
              </p>
              <p>
                本网站不对资源内容的准确性、完整性、合法性负责。付费仅为维持网站日常服务器等正常费用。
              </p>
              <p>
                用户使用本网站资源产生的任何后果，本网站不承担任何责任。
              </p>
              <Link href="/disclaimer" className="text-blue-600 underline hover:text-blue-800 font-medium inline-block mt-2">
                查看完整免责声明 →
              </Link>
            </div>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container text-center">
          <p>&copy; 2025 安全资源分享网. 保留所有权利。</p>
          <p className="text-sm mt-4 space-x-4">
            <Link href="/disclaimer" className="hover:text-white transition">
              免责声明
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-white transition">
              隐私政策
            </Link>
            <span>|</span>
            <span>仅供学习交流使用</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
