import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">安全资源分享网</div>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              首页
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-blue-600">
              资源库
            </Link>
            <Link href="/login" className="btn-primary">
              登录
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-4">安全资源分享平台</h1>
          <p className="text-xl mb-8 opacity-90">
            汇聚安全课件、事故报告、标准规范、警示视频、管理书籍等优质资源
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100">
              免费注册
            </Link>
            <Link href="/resources" className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600">
              浏览资源
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">平台特色</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">丰富资源</h3>
              <p className="text-gray-600">
                涵盖安全课件、事故调查报告、标准规范等多个分类
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-2">安全可靠</h3>
              <p className="text-gray-600">
                用户认证、积分管理、安全下载，保护您的隐私
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">灵活付费</h3>
              <p className="text-gray-600">
                注册赠送积分，支持微信/支付宝充值，按需消费
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
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
