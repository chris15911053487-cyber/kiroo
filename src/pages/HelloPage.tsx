import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import { IS_LZU_MODE } from '../types'

export default function HelloPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // 已登录用户自动跳转到测评页
  useEffect(() => {
    if (user) {
      navigate('/select', { replace: true })
    }
  }, [user, navigate])

  // ========== 兰大模式 ==========
  if (IS_LZU_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F1A2E] via-[#1A2D4A] to-[#1E3A5F] text-white overflow-hidden">
        {/* 星空背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-1 h-1 bg-[#F4C550] rounded-full opacity-60 animate-pulse" />
          <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-[#F4C550] rounded-full opacity-40" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-white rounded-full opacity-30" />
          <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-[#F4C550] rounded-full opacity-50" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 left-20 w-1 h-1 bg-white rounded-full opacity-20" />
          <div className="absolute top-1/2 right-10 w-1 h-1 bg-[#F4C550] rounded-full opacity-40" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Hero区域 */}
        <section className="relative pt-20 pb-8 px-6 text-center">
          {/* Logo/品牌标识 */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F4C550] to-amber-500 flex items-center justify-center shadow-[0_8px_32px_rgba(244,197,80,0.3)]">
              <span className="text-4xl">🎓</span>
            </div>
          </div>

          {/* 主标题 */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            兰州大学管理学院
            <br />
            <span className="text-[#F4C550]">研究生职业发展测评</span>
          </h1>

          {/* 副标题 */}
          <p className="text-base text-white/70 max-w-md mx-auto mb-10 leading-relaxed">
            3大核心维度 × AI智能分析
            <br />
            全面评估您的职业发展潜能
          </p>

          {/* CTA按钮 */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F4C550] to-amber-500 text-[#1E3A5F] font-bold text-lg shadow-[0_8px_32px_rgba(244,197,80,0.35)] hover:shadow-[0_12px_40px_rgba(244,197,80,0.45)] hover:scale-[1.02] transition-all duration-300"
          >
            开始测评
            <span className="text-xl">✨</span>
          </Link>
        </section>

        {/* 核心卖点卡片 */}
        <section className="relative px-6 pb-10">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <span className="text-2xl shrink-0">🧭</span>
              <div>
                <h3 className="font-bold text-sm mb-1">领导风格评估</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  基于情境领导理论（LASI），从指令型、教练型、支持型、授权型四个维度评估您的领导风格倾向
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <span className="text-2xl shrink-0">🧠</span>
              <div>
                <h3 className="font-bold text-sm mb-1">人格特质分析</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  基于16PF理论，从创造力潜质、心理健康水平、管理潜能三个核心维度深度测评
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <span className="text-2xl shrink-0">💡</span>
              <div>
                <h3 className="font-bold text-sm mb-1">创造力障碍诊断</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  从心理、认知、环境三个层面识别阻碍创造力发挥的因素，提供针对性改善建议
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <span className="text-2xl shrink-0">🏆</span>
              <div>
                <h3 className="font-bold text-sm mb-1">AI综合交叉分析</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  DeepSeek大模型综合三项测评结果，生成个性化职业发展报告，专家团队审核把关
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 测评流程 */}
        <section className="relative px-6 pb-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-center text-lg font-bold mb-6">测评流程</h2>
            <div className="flex items-center justify-between">
              {['登录注册', '完成三项测评', '提交审核', '查看报告'].map((step, idx) => (
                <div key={step} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[#F4C550]/20 border border-[#F4C550]/40 flex items-center justify-center text-[#F4C550] font-bold text-sm">
                    {idx + 1}
                  </div>
                  <span className="text-[10px] text-white/50 text-center">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 数据背书 */}
        <section className="relative px-6 pb-10">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-[#F4C550]">3项</p>
              <p className="text-[10px] text-white/40 mt-1">核心测评</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-[#F4C550]">AI</p>
              <p className="text-[10px] text-white/40 mt-1">智能分析</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-[#F4C550]">专业</p>
              <p className="text-[10px] text-white/40 mt-1">专家审核</p>
            </div>
          </div>
        </section>

        {/* 底部CTA */}
        <section className="relative px-6 pb-16 text-center">
          <p className="text-white/50 text-sm mb-4">准备好开始您的职业发展测评了吗？</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#F4C550] to-amber-500 text-[#1E3A5F] font-bold text-lg shadow-[0_8px_32px_rgba(244,197,80,0.35)] hover:shadow-[0_12px_40px_rgba(244,197,80,0.45)] hover:scale-[1.02] transition-all duration-300"
          >
            开始测评 ✨
          </Link>
        </section>
      </div>
    )
  }

  // ========== 通用模式 ==========
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1A2E] via-[#1A2D4A] to-[#1E3A5F] text-white overflow-hidden">
      {/* 星空背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-1 h-1 bg-[#F4C550] rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-[#F4C550] rounded-full opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-white rounded-full opacity-30" />
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-[#F4C550] rounded-full opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-white rounded-full opacity-20" />
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-[#F4C550] rounded-full opacity-40" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Hero区域 */}
      <section className="relative pt-20 pb-8 px-6 text-center">
        {/* Logo/品牌标识 */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F4C550] to-amber-500 flex items-center justify-center shadow-[0_8px_32px_rgba(244,197,80,0.3)]">
            <span className="text-4xl">⭐</span>
          </div>
        </div>

        {/* 主标题 */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          多维测评，点亮你的
          <br />
          <span className="text-[#F4C550]">潜能星图</span>
        </h1>

        {/* 副标题 */}
        <p className="text-base text-white/70 max-w-md mx-auto mb-10 leading-relaxed">
          基于7大权威量表 × AI智能分析
          <br />
          发现你独一无二的优势组合
        </p>

        {/* CTA按钮 */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F4C550] to-amber-500 text-[#1E3A5F] font-bold text-lg shadow-[0_8px_32px_rgba(244,197,80,0.35)] hover:shadow-[0_12px_40px_rgba(244,197,80,0.45)] hover:scale-[1.02] transition-all duration-300"
        >
          立刻探索潜能
          <span className="text-xl">✨</span>
        </Link>
      </section>

      {/* 核心卖点卡片 */}
      <section className="relative px-6 pb-10">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">🔬</span>
            <div>
              <h3 className="font-bold text-sm mb-1">7大权威量表</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                涵盖大五人格、MBTI、16PF、霍兰德等国际权威心理学量表，多维度深度测评
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">🧠</span>
            <div>
              <h3 className="font-bold text-sm mb-1">AI智能交叉分析</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                基于DeepSeek大模型，综合所有问卷结果进行交叉分析，发现你的优势组合
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">🛡️</span>
            <div>
              <h3 className="font-bold text-sm mb-1">专家团队审核</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                专业人才测评团队把关每一份报告，确保分析质量与专业性
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">💫</span>
            <div>
              <h3 className="font-bold text-sm mb-1">正向赋能</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                聚焦潜能发现，用积极视角解读每一个数据点，帮助你认识最好的自己
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 测评流程 */}
      <section className="relative px-6 pb-10">
        <div className="max-w-md mx-auto">
          <h2 className="text-center text-lg font-bold mb-6">测评流程</h2>
          <div className="flex items-center justify-between">
            {['选择问卷', '完成测评', '生成报告', '查看结果'].map((step, idx) => (
              <div key={step} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#F4C550]/20 border border-[#F4C550]/40 flex items-center justify-center text-[#F4C550] font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="text-[10px] text-white/50 text-center">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据背书 */}
      <section className="relative px-6 pb-10">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-[#F4C550]">1000+</p>
            <p className="text-[10px] text-white/40 mt-1">已服务用户</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-[#F4C550]">7套</p>
            <p className="text-[10px] text-white/40 mt-1">权威量表</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-[#F4C550]">专业</p>
            <p className="text-[10px] text-white/40 mt-1">专家团队</p>
          </div>
        </div>
      </section>

      {/* 底部CTA */}
      <section className="relative px-6 pb-16 text-center">
        <p className="text-white/50 text-sm mb-4">准备好发现你的潜能了吗？</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#F4C550] to-amber-500 text-[#1E3A5F] font-bold text-lg shadow-[0_8px_32px_rgba(244,197,80,0.35)] hover:shadow-[0_12px_40px_rgba(244,197,80,0.45)] hover:scale-[1.02] transition-all duration-300"
        >
          立刻探索潜能 ✨
        </Link>
      </section>
    </div>
  )
}
