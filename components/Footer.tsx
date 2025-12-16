import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo 和介绍 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="HSE Share"
                height={32}
                width="auto"
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-white">HSE Share</span>
            </div>
            <p className="text-sm text-gray-400">
              HSE 安全资源分享平台，汇聚海量优质安全资源
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="font-bold text-white mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-blue-400 transition">
                  资源库
                </Link>
              </li>
              <li>
                <Link href="/recharge" className="hover:text-blue-400 transition">
                  充值积分
                </Link>
              </li>
            </ul>
          </div>

          {/* 帮助 */}
          <div>
            <h3 className="font-bold text-white mb-4">帮助</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-blue-400 transition">
                  免责声明
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h3 className="font-bold text-white mb-4">关于我们</h3>
            <p className="text-sm text-gray-400 mb-4">
              我们致力于为安全专业人士提供最优质的资源和服务
            </p>
            <div className="flex gap-2">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                微博
              </a>
              <span className="text-gray-600">|</span>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                微信
              </a>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <hr className="border-gray-700 mb-6" />

        {/* 底部信息 */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2025 HSE Share. 保留所有权利。</p>
          <p>Made with ❤️ for HSE Professionals</p>
        </div>
      </div>
    </footer>
  );
}
