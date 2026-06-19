import { Link } from 'react-router-dom'

export default function UserAgreementPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center px-6 h-14 max-w-3xl mx-auto">
          <Link to="/register" className="text-gray-400 hover:text-gray-600 text-sm">← 返回注册</Link>
          <h1 className="flex-1 text-center text-sm font-bold text-gray-800">用户服务协议</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto text-sm text-gray-700 leading-relaxed space-y-6">
        <p className="text-gray-400 text-xs">更新日期：2026年6月19日 &nbsp;|&nbsp; 生效日期：2026年6月19日</p>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">一、总则</h2>
          <p>1.1 欢迎使用 AI 测评小助手（以下简称"本平台"）。本协议是您与本平台运营方之间关于使用本平台服务所订立的协议。</p>
          <p className="mt-2">1.2 请您在注册和使用本平台前仔细阅读本协议。您点击"同意并注册"按钮即视为您已阅读、理解并同意接受本协议全部条款的约束。</p>
          <p className="mt-2">1.3 本平台有权根据需要不时修订本协议，修订后的协议将在本平台公示。若您不同意修订内容，应停止使用本平台服务。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">二、服务内容</h2>
          <p>2.1 本平台为您提供在线人才测评服务，包括但不限于：心理测评问卷作答、综合测评报告生成、测评结果查看与管理。</p>
          <p className="mt-2">2.2 测评报告基于您的问卷作答数据，结合心理学理论模型和AI分析生成，仅供个人发展和职业规划参考，不构成任何形式的诊断或承诺。</p>
          <p className="mt-2">2.3 本平台保留根据实际情况调整服务内容、服务方式及服务收费的权利（如涉及收费，将另行通知并取得您的同意）。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">三、用户账号</h2>
          <p>3.1 您注册时须提供真实、准确的个人信息（手机号、姓名），并在信息变更时及时更新。因信息不真实或不准确导致的一切后果由您自行承担。</p>
          <p className="mt-2">3.2 您应妥善保管账号和密码，不得将账号出借、转让或泄露给他人。因账号保管不善导致的损失由您自行承担。</p>
          <p className="mt-2">3.3 如发现账号被未经授权使用，您应立即通知本平台。本平台在接到通知后将采取合理措施。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">四、用户行为规范</h2>
          <p>4.1 您承诺在使用本平台服务过程中遵守中华人民共和国法律法规，不得利用本平台从事任何违法违规活动。</p>
          <p className="mt-2">4.2 您不得干扰本平台的正常运营，不得利用技术手段恶意攻击、入侵本平台系统，不得爬取、盗用本平台数据。</p>
          <p className="mt-2">4.3 您在测评问卷中的作答应真实、认真，以确保测评结果的准确性和参考价值。恶意作答将影响报告质量。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">五、知识产权</h2>
          <p>5.1 本平台的所有内容，包括但不限于测评问卷、算法模型、报告模版、界面设计、文字、图表、软件等，其知识产权归本平台运营方所有。</p>
          <p className="mt-2">5.2 您生成的测评报告仅供个人使用，未经本平台书面许可，不得将报告用于商业目的或公开发布。</p>
          <p className="mt-2">5.3 您在平台上的作答数据和测评结果，您拥有数据的所有权，本平台仅在提供服务所必需的范围内使用。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">六、免责条款</h2>
          <p>6.1 本平台提供的测评报告基于心理学理论和AI模型分析，其结果仅供参考，不构成就业、晋升、诊断或任何形式的决策依据。</p>
          <p className="mt-2">6.2 因不可抗力（包括但不限于自然灾害、网络故障、黑客攻击、系统维护等）导致的服务中断或数据丢失，本平台不承担责任，但将尽力减少因此给您带来的影响。</p>
          <p className="mt-2">6.3 您理解并同意，AI生成的内容可能存在不准确之处，本平台不对AI生成内容的绝对准确性和完整性作任何保证。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">七、协议终止</h2>
          <p>7.1 您可以通过联系平台管理员申请注销账号。账号注销后，我们将按照隐私政策的约定处理您的个人信息。</p>
          <p className="mt-2">7.2 如您违反本协议约定或法律法规，本平台有权暂停或终止向您提供服务，并保留追究法律责任的权利。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">八、法律适用与争议解决</h2>
          <p>8.1 本协议的订立、执行和解释均适用中华人民共和国法律。</p>
          <p className="mt-2">8.2 因本协议引起的或与之相关的争议，双方应友好协商解决；协商不成的，任何一方均可向本平台运营方所在地有管辖权的人民法院提起诉讼。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">九、联系方式</h2>
          <p>如您对本协议有任何疑问、意见或建议，请通过以下方式联系我们：</p>
          <p className="mt-2">📧 联系渠道：请添加测评报告中提供的微信二维码联系平台管理员</p>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        AI 测评小助手 &copy; 2026
      </footer>
    </div>
  )
}
