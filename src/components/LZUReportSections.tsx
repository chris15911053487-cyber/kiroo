// 兰大综合报告渲染组件 — 管理员后台和用户报告页共用
// 管理员审核时看到的报告与用户审核通过后看到的报告完全一致

import { GaugeChart, BarChart } from './charts'

// ==================== 类型 ====================

export interface LZUDimensionDetail {
  raw: number
  standard: number
  level: string
}

export interface LZULeadershipAnalysis {
  s1Score: number
  s2Score: number
  s3Score: number
  s4Score: number
  dominantStyle: string
  adaptabilityIndex: number
  adaptabilityLevel: string
  interpretation: string
}

export interface LZUPersonalityAnalysis {
  creativityPotential: LZUDimensionDetail
  mentalHealth: LZUDimensionDetail
  managementPotential: LZUDimensionDetail
  interpretation: string
}

export interface LZUBarrierDetail {
  score: number
  max: number
  level: string
}

export interface LZUCreativityBarrierAnalysis {
  psychologicalBarrier: LZUBarrierDetail
  cognitiveBarrier: LZUBarrierDetail
  environmentalBarrier: LZUBarrierDetail
  primaryBarrierType: string
  interpretation: string
  suggestions: string[]
}

export interface LZUImprovementPlan {
  shortTerm: string[]
  midTerm: string[]
  longTerm: string[]
}

interface AdvantageItem { title: string; score: number; description: string }
interface CareerSuggestion { direction: string; matchLevel?: string; reason: string }

export interface LZUStructuredReport {
  comprehensiveScore: number
  grade: string
  gradeDescription: string
  coreEvaluation: string
  coreAdvantages: AdvantageItem[]
  leadershipAnalysis: LZULeadershipAnalysis
  personalityAnalysis: LZUPersonalityAnalysis
  creativityBarrierAnalysis: LZUCreativityBarrierAnalysis
  careerSuggestions: CareerSuggestion[]
  improvementPlan: LZUImprovementPlan
  summary: string
  userName?: string
  reportDate?: string
  reportId?: string
}

// ==================== 判断函数 ====================

export function isLZUReport(data: any): data is LZUStructuredReport {
  return data && typeof data === 'object' && 'grade' in data && 'leadershipAnalysis' in data
    && data.leadershipAnalysis && typeof data.leadershipAnalysis === 'object'
    && ('s1Score' in data.leadershipAnalysis || 's1Score' in data.leadershipAnalysis)
}

// ==================== 解析函数 ====================

export function parseReportJSON(reportContent: string | null): LZUStructuredReport | null {
  if (!reportContent) return null
  try {
    const data = JSON.parse(reportContent)
    if (isLZUReport(data)) return data
    return null
  } catch {
    return null
  }
}

// ==================== 报告区块 ====================

export function LZUScoreSection({ score, grade, gradeDescription }: {
  score: number; grade: string; gradeDescription: string
}) {
  const gradeColors: Record<string, string> = {
    '卓越型': 'from-amber-400 to-orange-500',
    '进取型': 'from-blue-400 to-indigo-500',
    '成长型': 'from-emerald-400 to-teal-500',
    '待发展型': 'from-gray-400 to-slate-500',
  }
  const color = gradeColors[grade] || 'from-indigo-500 to-violet-500'

  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] via-[#1A2D4A] to-[#1E3A5F] rounded-2xl p-8 text-white text-center mb-6 shadow-[0_8px_30px_rgba(30,58,95,0.3)]">
      <p className="text-sm text-white/60 mb-1">兰州大学管理学院 · 研究生职业发展测评</p>
      <GaugeChart value={score} min={0} max={100} size={180} />
      <p className="text-xs text-white/40 mt-2">综合得分 · 满分100分</p>
      <div className={`inline-block mt-3 px-5 py-1.5 rounded-full bg-gradient-to-r ${color} text-white text-sm font-bold shadow-lg`}>
        {grade} · {gradeDescription}
      </div>
    </div>
  )
}

export function LZULeadershipSection({ data }: { data: LZULeadershipAnalysis }) {
  const barData = [
    { label: 'S1 指令型', value: data.s1Score, maxValue: 12 },
    { label: 'S2 教练型', value: data.s2Score, maxValue: 12 },
    { label: 'S3 支持型', value: data.s3Score, maxValue: 12 },
    { label: 'S4 授权型', value: data.s4Score, maxValue: 12 },
  ]
  const adaptColor = data.adaptabilityLevel === '强' ? 'text-green-600 bg-green-50'
    : data.adaptabilityLevel === '一般' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-amber-500" />领导风格分析
      </h2>
      <BarChart data={barData} height={200} color="#F59E0B" />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="bg-amber-50 rounded-xl px-4 py-2">
          <span className="text-xs text-amber-600">主导风格：</span>
          <span className="text-sm font-bold text-amber-800">{data.dominantStyle}</span>
        </div>
        <div className={`rounded-xl px-4 py-2 ${adaptColor}`}>
          <span className="text-xs">情境适应性：</span>
          <span className="text-sm font-bold">{data.adaptabilityLevel}（{data.adaptabilityIndex}）</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

export function LZUPersonalitySection({ data }: { data: LZUPersonalityAnalysis }) {
  const dims = [
    { label: '创造力潜质', detail: data.creativityPotential, color: '#8B5CF6' },
    { label: '心理健康', detail: data.mentalHealth, color: '#10B981' },
    { label: '管理潜能', detail: data.managementPotential, color: '#3B82F6' },
  ]
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500" />人格特质分析（16PF）
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {dims.map((dim, i) => {
          const pct = (dim.detail.raw / 10) * 100
          return (
            <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{dim.label}</p>
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={dim.color} strokeWidth="6"
                    strokeDasharray={`${pct * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold" style={{ color: dim.color }}>
                  {dim.detail.raw}
                </span>
              </div>
              <p className="text-xs text-gray-400">满分10 · 标准分{dim.detail.standard}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                dim.detail.level === '优秀' || dim.detail.level === '良好' ? 'bg-green-50 text-green-700'
                  : dim.detail.level === '中等' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>{dim.detail.level}</span>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

export function LZUCreativityBarrierSection({ data }: { data: LZUCreativityBarrierAnalysis }) {
  const barriers = [
    { label: '心理障碍', detail: data.psychologicalBarrier, color: '#EF4444' },
    { label: '认知障碍', detail: data.cognitiveBarrier, color: '#F59E0B' },
    { label: '环境与资源障碍', detail: data.environmentalBarrier, color: '#3B82F6' },
  ]
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-orange-500" />创造力障碍分析
      </h2>
      <p className="text-xs text-gray-400 mb-4">注意：得分越高表示障碍越少，创造力发挥越顺畅</p>
      <div className="space-y-4 mb-4">
        {barriers.map((b, i) => {
          const pct = (b.detail.score / b.detail.max) * 100
          const barColor = b.detail.level === '低障碍' ? 'bg-green-400'
            : b.detail.level === '中障碍' ? 'bg-amber-400' : 'bg-red-400'
          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{b.label}</span>
                <span className="font-bold" style={{ color: b.color }}>
                  {b.detail.score}/{b.detail.max} · {b.detail.level}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      {data.primaryBarrierType && (
        <div className="bg-orange-50 rounded-xl p-3 mb-3">
          <p className="text-sm text-orange-700"><span className="font-bold">主要障碍类型：</span>{data.primaryBarrierType}</p>
        </div>
      )}
      {(data.suggestions?.length ?? 0) > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">突破建议：</p>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-500 mt-0.5">💡</span><span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

export function LZUImprovementPlanSection({ plan }: { plan: LZUImprovementPlan }) {
  const sections = [
    { title: '近期行动（0-6个月）', items: plan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
    { title: '中期规划（6个月-2年）', items: plan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
    { title: '长期发展（2-5年）', items: plan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
  ]
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-emerald-500" />能力提升计划
      </h2>
      <div className="space-y-3">
        {sections.filter(s => (s.items?.length ?? 0) > 0).map((s, i) => (
          <div key={i} className={`border-l-4 rounded-r-xl p-4 ${s.color}`}>
            <h3 className="font-bold text-sm text-[#1a1a2e] mb-2">{s.title}</h3>
            <ul className="space-y-1">
              {s.items.map((item, j) => (
                <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-xs mt-1">•</span><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LZUCareerSection({ suggestions }: { suggestions: CareerSuggestion[] }) {
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />职业发展建议
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm text-blue-700">{s.direction}</h4>
              <span className="text-xs text-amber-500">{s.matchLevel || '★★★★☆'}</span>
            </div>
            <p className="text-xs text-gray-500">{s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LZUReportSummary({ evaluation, advantages, summary }: {
  evaluation: string; advantages: AdvantageItem[]; summary: string
}) {
  return (
    <>
      {/* 核心评价 */}
      <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500" />核心评价
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{evaluation}</p>
        {(advantages?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advantages.map((a, i) => (
              <div key={i} className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-indigo-700">{a.title}</h4>
                  <span className="text-xs font-bold text-indigo-500">{a.score}</span>
                </div>
                <p className="text-xs text-gray-500">{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 总结 */}
      <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-pink-500" />报告总结
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
        <p className="text-xs text-gray-400 mt-4">📌 本报告仅作为职业规划的参考依据，不建议作为单一决策标准。测评结果反映近期的心理状态，建议每6-12个月复测一次。</p>
      </div>
    </>
  )
}
