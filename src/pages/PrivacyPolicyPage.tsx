import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center px-6 h-14 max-w-3xl mx-auto">
          <Link to="/register" className="text-gray-400 hover:text-gray-600 text-sm">← 返回注册</Link>
          <h1 className="flex-1 text-center text-sm font-bold text-gray-800">隐私政策</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto text-sm text-gray-700 leading-relaxed space-y-6">
        <p className="text-gray-400 text-xs">更新日期：2026年6月19日 &nbsp;|&nbsp; 生效日期：2026年6月19日</p>

        <p className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-indigo-700 text-sm">
          AI 测评小助手（以下简称"我们"）深知个人信息对您的重要性。我们将按照法律法规要求，采取严格的安全保护措施，保护您的个人信息安全。本隐私政策将详细说明我们如何收集、使用、存储和保护您的个人信息。
        </p>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">一、我们收集哪些信息</h2>
          <p>在您使用本平台服务的过程中，我们可能收集以下类型的信息：</p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-2">1.1 您主动提供的信息</h3>
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">必填</span>
              <span><strong>手机号</strong>：用于注册账号、登录认证和账号安全保护。</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">选填</span>
              <span><strong>真实姓名</strong>：用于测评报告的署名和个性化展示。</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">选填</span>
              <span><strong>学历信息、毕业意向</strong>：用于报告的职业建议个性化分析。</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-2">1.2 使用服务过程中产生的信息</h3>
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <p><strong>测评作答数据</strong>：您在测评问卷中对各题目的选项选择及得分结果。这是为您生成测评报告的核心依据。</p>
            <p><strong>设备与日志信息</strong>：包括IP地址、浏览器类型、访问时间等，用于保障服务安全和正常运行。</p>
          </div>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-2">1.3 我们不会收集的信息</h3>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <ul className="space-y-1">
              <li>✅ 我们不收集您的位置信息（GPS定位）</li>
              <li>✅ 我们不读取您的通讯录</li>
              <li>✅ 我们不读取您的相册或文件</li>
              <li>✅ 我们不收集您的身份证号、银行卡号等敏感身份信息</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">二、我们如何使用信息</h2>
          <p>我们收集的信息仅用于以下目的：</p>
          <div className="bg-white border rounded-lg p-4 mt-2 space-y-2">
            <p><strong>2.1 提供核心服务</strong>：基于您的作答数据计算得分、生成测评报告。</p>
            <p><strong>2.2 账号管理</strong>：手机号用于注册、登录和账号安全验证。</p>
            <p><strong>2.3 服务改进</strong>：匿名的统计分析用于优化测评模型和用户体验（此用途的数据已经过脱敏处理，无法识别到个人）。</p>
            <p><strong>2.4 安全防护</strong>：日志信息用于防范恶意攻击和保障系统安全。</p>
          </div>
          <p className="mt-3 text-gray-500">我们<strong>不会</strong>将您的个人信息用于用户画像、自动化决策、精准广告推送，也<strong>不会</strong>将您的数据出售给第三方。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">三、信息存储与安全</h2>
          <p><strong>3.1 存储地点</strong>：您的个人信息存储于中华人民共和国境内的服务器上。</p>
          <p className="mt-2"><strong>3.2 存储期限</strong>：在您使用服务期间及账号注销后的合理期限内存储您的信息。超过期限后将进行删除或匿名化处理。</p>
          <p className="mt-2"><strong>3.3 安全措施</strong>：我们采取以下措施保护您的信息安全：</p>
          <div className="bg-white border rounded-lg p-4 mt-2 space-y-1">
            <p>🔐 数据传输全程加密（HTTPS/TLS）</p>
            <p>🔑 密码经加密算法（bcrypt）处理后存储，不保存明文密码</p>
            <p>🛡️ JWT Token 认证 + 过期机制，保障接口访问安全</p>
            <p>📋 数据库访问权限控制，仅授权管理员可查看后台数据</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">四、信息的共享与披露</h2>
          <p><strong>4.1 我们不会主动共享</strong>：未经您明确同意，我们不会将您的个人信息提供给任何第三方。</p>
          <p className="mt-2"><strong>4.2 法定例外</strong>：在以下情形中，我们可能依法披露您的信息：</p>
          <div className="bg-white border rounded-lg p-4 mt-2 space-y-1">
            <p>• 根据法律法规、政府部门或司法机关的强制性要求</p>
            <p>• 为保护我们或公众的合法权益（如防范欺诈、网络安全威胁等）</p>
            <p>• 在合并、收购等涉及资产转让的情况下，我们将要求接收方继续履行本隐私政策的义务</p>
          </div>
          <p className="mt-2"><strong>4.3 AI服务商</strong>：报告生成过程中，您的作答分数（不包括手机号、姓名等个人标识）可能被发送至AI服务商（如DeepSeek），用于生成测评报告文本。AI服务商受协议约束，不得将数据用于其他目的。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">五、您的权利</h2>
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <p><strong>5.1 查阅权</strong>：您可以在"我的报告"页面随时查看您的测评结果和报告。</p>
            <p><strong>5.2 更正权</strong>：如您的个人信息有变更，可通过"我的"页面进行修改。</p>
            <p><strong>5.3 删除权</strong>：您可以申请注销账号，我们将删除或匿名化处理您的个人信息。</p>
            <p><strong>5.4 撤回同意权</strong>：您可以随时撤回对个人信息收集的同意，但可能导致部分服务无法继续使用。</p>
          </div>
          <p className="mt-3">行使上述权利，请通过本政策第九章所述的联系方式与我们联系。我们将在15个工作日内响应您的请求。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">六、未成年人保护</h2>
          <p>本平台主要面向成年人提供人才测评服务。如果您是未满18周岁的未成年人，请在使用本平台前取得您监护人的同意。我们如发现未经监护人同意收集了未成年人的个人信息，将尽快删除相关数据。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">七、Cookie 及同类技术</h2>
          <p>本平台使用 localStorage 在您的设备上存储登录认证 Token，以便您在浏览器会话期间保持登录状态。该 Token 不含个人信息，退出登录或清除浏览器数据后即被删除。我们不使用第三方 Cookie 或追踪器。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">八、政策更新</h2>
          <p>我们可能适时修订本隐私政策。修订后的政策将在本平台公布，并以适当方式（如站内通知）提醒您。若变更涉及您的重大权益，我们将重新取得您的同意。请您定期查阅本隐私政策以了解最新内容。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">九、联系我们</h2>
          <div className="bg-white border rounded-lg p-4">
            <p>如您对本隐私政策或个人信息保护有任何疑问、意见或投诉，请通过以下方式联系我们：</p>
            <p className="mt-2">📧 <strong>联系渠道</strong>：请添加测评平台展示的微信二维码联系平台管理员</p>
            <p className="mt-2">⏰ <strong>响应时效</strong>：我们将在收到您的请求后15个工作日内予以回复</p>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        AI 测评小助手 &copy; 2026
      </footer>
    </div>
  )
}
