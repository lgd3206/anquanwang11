import Link from "next/link";
import AppLayout from "@/components/AppLayout";

export default function PrivacyPage() {
  return (
    <AppLayout>
      {/* Main Content */}
      <section className="py-12 bg-gray-50">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">隐私政策</h1>
          <p className="text-gray-500 text-sm mb-8">最后更新：2025年12月13日</p>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-gray-700 leading-relaxed">
                感谢您使用安全资源分享网。我们重视并保护您的隐私。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。使用本网站即表示您同意本政策。
              </p>
            </div>

            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">1. 信息收集</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                我们可能收集以下类型的信息：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>账户信息：</strong>邮箱地址、用户名、密码（加密存储）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>使用数据：</strong>下载记录、浏览历史、搜索关键词、积分消费记录</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>技术数据：</strong>IP地址、浏览器类型、设备信息、访问时间</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>支付信息：</strong>充值记录（通过第三方支付处理，我们不存储银行卡信息）</span>
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">2. 信息使用</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                我们使用收集的信息用于以下目的：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>提供、维护和改进服务（账户管理、资源下载、积分系统）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>处理交易和支付（积分充值、消费记录）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>发送邮箱验证邮件和重要通知（如积分到账、安全提醒）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>防止欺诈、滥用和非法活动（速率限制、防薅羊毛）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>分析网站使用情况，优化用户体验</span>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">3. 信息共享</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                我们<strong>不会</strong>出售、出租或交易您的个人信息。我们仅在以下情况共享信息：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>服务提供商：</strong>如支付处理商（Ping++、支付宝、微信支付）、邮件服务商、云服务商（Vercel、Neon）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>法律要求：</strong>遵守法律、法规、法院命令或政府机关要求</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>业务转让：</strong>在合并、收购或资产出售情况下，信息可能作为业务资产转让</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">4. 数据安全</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                我们采取合理的技术和管理措施保护您的数据：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>密码使用bcrypt加密（cost factor 12），不可逆</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>数据传输使用HTTPS加密（TLS/SSL）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>速率限制防止暴力破解和薅羊毛攻击</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>hCaptcha人类验证防止自动化脚本</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>邮箱验证确保账户真实性</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>定期安全审计和漏洞扫描</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                然而，没有任何系统是绝对安全的。您应妥善保管账户信息，不与他人共享密码。
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">5. Cookie和追踪技术</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                我们使用Cookie和类似技术来改善服务：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>身份验证Cookie：</strong>保持登录状态（JWT token）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>功能Cookie：</strong>记住用户偏好设置</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>分析Cookie：</strong>Google Analytics跟踪网站使用情况（匿名化）</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                您可以通过浏览器设置管理Cookie，但这可能影响网站功能。
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">6. 数据保留</h2>
              <p className="text-gray-700 leading-relaxed">
                我们保留您的个人信息，直到您的账户被删除或不再需要提供服务。部分数据（如交易记录）可能因法律要求保留更长时间（通常5年）。您可以通过联系我们申请删除账户和数据。
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">7. 您的权利</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                根据《个人信息保护法》，您拥有以下权利：
              </p>
              <ul className="text-gray-700 space-y-2 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>访问权：</strong>查看我们持有的关于您的数据</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>更正权：</strong>修改不准确或不完整的信息</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>删除权：</strong>要求删除您的个人数据（"被遗忘权"）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>限制处理权：</strong>限制我们如何使用您的数据</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>数据可携权：</strong>以结构化格式获取您的数据</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>反对权：</strong>反对我们处理您的数据</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                要行使这些权利，请通过下方联系方式与我们联系。我们将在15个工作日内回复。
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">8. 儿童隐私</h2>
              <p className="text-gray-700 leading-relaxed">
                本网站不面向14岁以下儿童。我们不会故意收集14岁以下儿童的个人信息。如果您认为我们收集了儿童信息，请立即联系我们，我们将删除该信息。
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">9. 第三方链接</h2>
              <p className="text-gray-700 leading-relaxed">
                本网站可能包含第三方网站（如百度网盘、阿里云盘）的链接。我们不对这些网站的隐私政策负责。访问第三方网站时，请查看其隐私政策。
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">10. 跨境数据传输</h2>
              <p className="text-gray-700 leading-relaxed">
                您的数据可能存储在境外服务器（如Vercel部署在美国、Neon数据库在新加坡）。我们确保这些服务商符合适当的数据保护标准。
              </p>
            </div>

            {/* Section 11 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">11. 政策更新</h2>
              <p className="text-gray-700 leading-relaxed">
                我们可能不时更新本隐私政策。更新后的政策将在此页面公布，并注明"最后更新"日期。如有重大变更，我们将通过邮件或网站通知您。继续使用本网站即表示您接受更新后的政策。
              </p>
            </div>

            {/* Section 12 */}
            <div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">12. 联系我们</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                如对本隐私政策有任何疑问、意见或数据请求，请通过以下方式联系我们：
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
                我们将在24小时内回复您的咨询。
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <div className="flex gap-4">
                <span className="text-3xl flex-shrink-0">🔐</span>
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">隐私承诺</h3>
                  <p className="text-blue-800 text-sm">
                    我们承诺保护您的隐私，绝不出售您的个人信息。如对数据处理有任何疑虑，请随时联系我们。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Links */}
          <div className="mt-8 text-center space-x-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← 返回首页
            </Link>
            <Link href="/disclaimer" className="text-blue-600 hover:text-blue-700 font-medium">
              查看免责声明 →
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
