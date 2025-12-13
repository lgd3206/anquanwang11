import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            安全资源分享网
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              首页
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-blue-600 transition">
              资源库
            </Link>
            <Link href="/login" className="btn-primary">
              登录
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 bg-gray-50">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">免责声明</h1>
          <p className="text-gray-500 text-sm mb-8">最后更新：2025年12月13日</p>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">1. 平台性质</h2>
              <p className="text-gray-700 leading-relaxed">
                本网站是资源分享和学习交流平台。所有资源均由用户上传和分享，我们仅提供存储、访问和管理服务，不创建或审核内容。
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">2. 用户责任</h2>
              <p className="text-gray-700 leading-relaxed">
                您应自行判断资源的合法性、真实性和安全性。建议仅用于合法、教育目的，并遵守所有适用法律法规。
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">3. 内容免责</h2>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>本网站不对资源的准确性、完整性、合法性或安全性提供任何保证</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>资源以"现状"提供，包括但不限于病毒、恶意软件或知识产权风险</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>对于第三方链接或外部网站，我们不负责其内容或实践</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>如资源涉及知识产权，所有权归原作者。如有侵权，请<a href="#contact" className="text-blue-600 hover:underline">联系我们</a></span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">4. 付费说明</h2>
              <p className="text-gray-700 leading-relaxed">
                付费（积分充值）仅用于维持服务器、带宽和运营成本，不代表购买资源所有权或质量保证。
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">5. 责任限制</h2>
              <p className="text-gray-700 leading-relaxed">
                用户使用本网站资源导致的任何损害、损失、法律纠纷或其他后果，本网站及其运营者不承担责任（法律强制要求除外）。
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">6. 数据隐私</h2>
              <p className="text-gray-700 leading-relaxed">
                我们不收集或分享用户上传资源的个人数据，详见<Link href="/privacy" className="text-blue-600 hover:underline">隐私政策</Link>。
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">7. 违规举报</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                如发现违规、侵权或有害内容，请通过以下方式联系我们：
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">📧</span>
                    <span>邮箱：<a href="mailto:1591605408@qq.com" className="text-blue-600 hover:underline">1591605408@qq.com</a></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">📱</span>
                    <span>QQ：<span className="font-mono">1591605408</span></span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                我们将在24小时内核查并处理。
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">8. 更新与适用法律</h2>
              <p className="text-gray-700 leading-relaxed">
                本声明受中华人民共和国法律管辖。如有更新，将在此公布。
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
              <div className="flex gap-4">
                <span className="text-3xl flex-shrink-0">⚠️</span>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2">重要提示</h3>
                  <p className="text-yellow-800 text-sm">
                    使用本网站即表示您已阅读、理解并同意本免责声明的所有条款。如您不同意，请停止使用本网站。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← 返回首页
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
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
