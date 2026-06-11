import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportService, type ReportDetail } from '../services/reportService'
import { GaugeChart, RadarChart, BarChart, PieChart, HexagonChart } from '../components/charts'
import LoadingSpinner from '../components/LoadingSpinner'

// ==================== 兰大专属报告类型 ====================

interface LZULeadershipAnalysis {
  s1Score: number
  s2Score: number
  s3Score: number
  s4Score: number
  dominantStyle: string
  adaptabilityIndex: number
  adaptabilityLevel: string
  interpretation: string
}

interface LZUDimensionDetail {
  raw: number
  standard: number
  level: string
}

interface LZUPersonalityAnalysis {
  creativityPotential: LZUDimensionDetail
  mentalHealth: LZUDimensionDetail
  managementPotential: LZUDimensionDetail
  interpretation: string
}

interface LZUBarrierDetail {
  score: number
  max: number
  level: string
}

interface LZUCreativityBarrierAnalysis {
  psychologicalBarrier: LZUBarrierDetail
  cognitiveBarrier: LZUBarrierDetail
  environmentalBarrier: LZUBarrierDetail
  primaryBarrierType: string
  interpretation: string
  suggestions: string[]
}

interface LZUImprovementPlan {
  shortTerm: string[]
  midTerm: string[]
  longTerm: string[]
}

interface LZUStructuredReport {
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

// ==================== 结构化报告数据类型 ====================

interface AdvantageItem { title: string; score: number; description: string }

interface Big5Data { openness: number; conscientiousness: number; extraversion: number; agreeableness: number; neuroticism: number }
interface Big5InterpretationItem { dimension: string; score: number; interpretation: string }
interface PersonalityAnalysis { big5: Big5Data; big5Interpretation: Big5InterpretationItem[] }

interface LeadershipStyle { name: string; score: number; percentage: number }
interface LeadershipAnalysis { styles: LeadershipStyle[]; interpretation: string }

interface TemperamentType { name: string; score: number }
interface TemperamentAnalysis { types: TemperamentType[]; dominant: string; interpretation: string }

interface MBTIAnalysis { type: string; dimensions: Record<string, number>; interpretation: string }

interface DerivedTrait { name: string; score: number; level: string; description: string }
interface SixteenPFAnalysis { factors: Record<string, number>; derivedTraits: DerivedTrait[]; interpretation: string }

interface CreativityAnalysis { totalScore: number; maxScore: number; barriers: string[]; interpretation: string }

interface HollandScores { R: number; I: number; A: number; S: number; E: number; C: number }
interface HollandAnalysis { scores: HollandScores; dominantType: string; interpretation: string }

interface CareerSuggestion { direction: string; reason: string }

interface TeamRole { primary: string; secondary: string; description: string }

interface StructuredReport {
  userName: string
  reportDate: string
  reportId: string
  comprehensiveScore: number
  coreEvaluation: string
  coreAdvantages: AdvantageItem[]
  personalityAnalysis: PersonalityAnalysis | null
  leadershipAnalysis: LeadershipAnalysis | null
  temperamentAnalysis: TemperamentAnalysis | null
  mbtiAnalysis: MBTIAnalysis | null
  sixteenPFAnalysis: SixteenPFAnalysis | null
  creativityAnalysis: CreativityAnalysis | null
  hollandAnalysis: HollandAnalysis | null
  careerSuggestions: CareerSuggestion[]
  improvementSuggestions: string[]
  teamRole: TeamRole
  summary: string
}

// ==================== Helpers ====================

function parseReportData(content: string | null): StructuredReport | null {
  if (!content) return null
  try {
    return JSON.parse(content) as StructuredReport
  } catch {
    return null
  }
}

// ==================== Section Components ====================

function ScoreSection({ score }: { score: number }) {
  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] via-[#1A2D4A] to-[#1E3A5F] rounded-2xl p-8 text-white text-center mb-6 shadow-[0_8px_30px_rgba(30,58,95,0.3)]">
      <p className="text-sm text-white/60 mb-1">人才综合测评报告</p>
      <GaugeChart value={score} min={65} max={85} size={180} />
      <p className="text-xs text-white/40 mt-2">综合得分 · 满分100分</p>
    </div>
  )
}

function CoreEvaluationSection({ evaluation, advantages }: { evaluation: string; advantages: AdvantageItem[] }) {
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
        核心评价
      </h2>
      <p className="text-gray-600 leading-relaxed text-sm mb-5">{evaluation}</p>

      {advantages.length > 0 && (
        <>
          <h3 className="font-bold text-sm text-[#1a1a2e] mb-3">核心优势</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advantages.map((adv, i) => (
              <div key={i} className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100/50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-indigo-700">{adv.title}</h4>
                  <span className="text-xs font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-full">{adv.score}分</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{adv.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PersonalitySection({ data }: { data: PersonalityAnalysis }) {
  const radarData = [
    { label: '开放性', value: data.big5.openness, maxValue: 100 },
    { label: '尽责性', value: data.big5.conscientiousness, maxValue: 100 },
    { label: '外倾性', value: data.big5.extraversion, maxValue: 100 },
    { label: '宜人性', value: data.big5.agreeableness, maxValue: 100 },
    { label: '神经质', value: data.big5.neuroticism, maxValue: 100 },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
        人格特质分析（大五人格）
      </h2>

      <div className="flex justify-center mb-4">
        <RadarChart data={radarData} size={260} color="#6366F1" />
      </div>

      <div className="space-y-3">
        {data.big5Interpretation.map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-16 text-center shrink-0">
              <span className="text-lg font-extrabold text-indigo-600">{item.score}</span>
              <span className="text-[10px] text-gray-400 block">/100</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1a1a2e]">{item.dimension}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{item.interpretation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LeadershipSection({ data }: { data: LeadershipAnalysis }) {
  const pieData = data.styles.map(s => ({
    label: s.name,
    value: s.percentage,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-amber-500" />
        领导力风格分析
      </h2>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <PieChart data={pieData} size={220} innerRadius={55} />
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{data.interpretation}</p>
      </div>
    </div>
  )
}

function TemperamentSection({ data }: { data: TemperamentAnalysis }) {
  const barData = data.types.map(t => ({
    label: t.name,
    value: t.score,
    maxValue: Math.max(...data.types.map(tt => tt.score), 1) * 1.2,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-pink-500" />
        气质类型分析
      </h2>
      <BarChart data={barData} height={220} color="#EC4899" />
      <div className="mt-4 bg-pink-50 rounded-xl p-4">
        <p className="text-sm font-bold text-pink-700 mb-1">主导气质：{data.dominant}</p>
        <p className="text-xs text-gray-600">{data.interpretation}</p>
      </div>
    </div>
  )
}

function MBTISection({ data }: { data: MBTIAnalysis }) {
  const dimData = Object.entries(data.dimensions).map(([k, v]) => ({
    label: k,
    value: v,
    maxValue: 100,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500" />
        MBTI 性格类型
      </h2>
      <div className="text-center mb-4">
        <span className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-3xl font-extrabold shadow-[0_4px_16px_rgba(139,92,246,0.3)]">
          {data.type}
        </span>
      </div>
      <BarChart data={dimData} height={180} color="#8B5CF6" />
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

function SixteenPFSection({ data }: { data: SixteenPFAnalysis }) {
  const factorBarData = Object.entries(data.factors).map(([k, v]) => ({
    label: k,
    value: v,
    maxValue: 20,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-slate-500" />
        16PF 深度分析
      </h2>

      <h3 className="font-bold text-sm text-gray-600 mb-3">16种人格因素得分</h3>
      <BarChart data={factorBarData} height={250} color="#64748B" />

      <h3 className="font-bold text-sm text-gray-600 mt-6 mb-3">二元性格特征（基于公式计算）</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium text-gray-600 border-b">特征</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">得分</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">等级</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 border-b">描述</th>
            </tr>
          </thead>
          <tbody>
            {data.derivedTraits.map((trait, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2.5 font-medium text-gray-700">{trait.name}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {trait.score}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    trait.level.includes('高') || trait.level.includes('优秀') || trait.level.includes('健康')
                      ? 'bg-green-50 text-green-700'
                      : trait.level.includes('中') || trait.level.includes('良好')
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {trait.level}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{trait.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

function CreativitySection({ data }: { data: CreativityAnalysis }) {
  const pct = Math.round((data.totalScore / data.maxScore) * 100)

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-orange-500" />
        创造力分析
      </h2>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">创造力得分</span>
          <span className="font-bold text-orange-600">{data.totalScore} / {data.maxScore}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-amber-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {data.barriers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">创造力障碍因素：</p>
          <div className="flex flex-wrap gap-2">
            {data.barriers.map((b, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

function HollandSection({ data }: { data: HollandAnalysis }) {
  const hexData = [
    { label: 'R(实操)', value: data.scores.R, maxValue: 50 },
    { label: 'I(研究)', value: data.scores.I, maxValue: 50 },
    { label: 'A(艺术)', value: data.scores.A, maxValue: 50 },
    { label: 'S(社会)', value: data.scores.S, maxValue: 50 },
    { label: 'E(企业)', value: data.scores.E, maxValue: 50 },
    { label: 'C(常规)', value: data.scores.C, maxValue: 50 },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-teal-500" />
        霍兰德职业兴趣
      </h2>
      <HexagonChart data={hexData} size={280} color="#10B981" />
      <div className="mt-4 bg-teal-50 rounded-xl p-4">
        <p className="text-sm font-bold text-teal-700 mb-1">主导类型：{data.dominantType}</p>
        <p className="text-xs text-gray-600">{data.interpretation}</p>
      </div>
    </div>
  )
}

// ==================== LZU-Specific Section Components ====================

function isLZUReport(data: StructuredReport | LZUStructuredReport): data is LZUStructuredReport {
  return 'grade' in data && 'leadershipAnalysis' in data && 's1Score' in (data as any).leadershipAnalysis
}

function LZUScoreSection({ score, grade, gradeDescription }: { score: number; grade: string; gradeDescription: string }) {
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

function LZULeadershipSection({ data }: { data: LZULeadershipAnalysis }) {
  const barData = [
    { label: 'S1 指令型', value: data.s1Score, maxValue: 12 },
    { label: 'S2 教练型', value: data.s2Score, maxValue: 12 },
    { label: 'S3 支持型', value: data.s3Score, maxValue: 12 },
    { label: 'S4 授权型', value: data.s4Score, maxValue: 12 },
  ]

  const adaptColor = data.adaptabilityLevel === '强' ? 'text-green-600 bg-green-50' :
    data.adaptabilityLevel === '一般' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-amber-500" />
        领导风格分析
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

function LZUPersonalitySection({ data }: { data: LZUPersonalityAnalysis }) {
  const dims = [
    { label: '创造力潜质', detail: data.creativityPotential, color: '#8B5CF6' },
    { label: '心理健康', detail: data.mentalHealth, color: '#10B981' },
    { label: '管理潜能', detail: data.managementPotential, color: '#3B82F6' },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500" />
        人格特质分析（16PF）
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
                dim.detail.level === '优秀' || dim.detail.level === '良好' ? 'bg-green-50 text-green-700' :
                dim.detail.level === '中等' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>{dim.detail.level}</span>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

function LZUCreativityBarrierSection({ data }: { data: LZUCreativityBarrierAnalysis }) {
  const barriers = [
    { label: '心理障碍', detail: data.psychologicalBarrier, color: '#EF4444' },
    { label: '认知障碍', detail: data.cognitiveBarrier, color: '#F59E0B' },
    { label: '环境与资源障碍', detail: data.environmentalBarrier, color: '#3B82F6' },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-orange-500" />
        创造力障碍分析
      </h2>

      <p className="text-xs text-gray-400 mb-4">注意：得分越高表示障碍越少，创造力发挥越顺畅</p>

      <div className="space-y-4 mb-4">
        {barriers.map((b, i) => {
          const pct = (b.detail.score / b.detail.max) * 100
          const barColor = b.detail.level === '低障碍' ? 'bg-green-400' :
            b.detail.level === '中障碍' ? 'bg-amber-400' : 'bg-red-400'
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
          <p className="text-sm text-orange-700">
            <span className="font-bold">主要障碍类型：</span>{data.primaryBarrierType}
          </p>
        </div>
      )}

      {data.suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">突破建议：</p>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-500 mt-0.5">💡</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-600 leading-relaxed">{data.interpretation}</p>
    </div>
  )
}

function LZUImprovementPlanSection({ plan }: { plan: LZUImprovementPlan }) {
  const sections = [
    { title: '近期行动（0-6个月）', items: plan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
    { title: '中期规划（6个月-2年）', items: plan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
    { title: '长期发展（2-5年）', items: plan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
        能力提升计划
      </h2>
      <div className="space-y-3">
        {sections.filter(s => s.items.length > 0).map((s, i) => (
          <div key={i} className={`border-l-4 rounded-r-xl p-4 ${s.color}`}>
            <h3 className="font-bold text-sm text-[#1a1a2e] mb-2">{s.title}</h3>
            <ul className="space-y-1">
              {s.items.map((item, j) => (
                <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function LZUCareerSection({ suggestions }: { suggestions: CareerSuggestion[] }) {
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
        职业发展建议
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => {
          const stars = (s as any).matchLevel || '★★★★☆'
          return (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-sm text-blue-700">{s.direction}</h4>
                <span className="text-xs text-amber-500">{stars}</span>
              </div>
              <p className="text-xs text-gray-500">{s.reason}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== Original Career Section ====================

function CareerSection({ suggestions, improvements, teamRole }: {
  suggestions: CareerSuggestion[]
  improvements: string[]
  teamRole: TeamRole
}) {
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
        发展潜力与建议
      </h2>

      {/* 职业方向 */}
      {suggestions.length > 0 && (
        <div className="mb-5">
          <h3 className="font-bold text-sm text-gray-600 mb-3">适合的职业方向</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
                <h4 className="font-bold text-sm text-blue-700 mb-1">{s.direction}</h4>
                <p className="text-xs text-gray-500">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 能力提升建议 */}
      {improvements.length > 0 && (
        <div className="mb-5">
          <h3 className="font-bold text-sm text-gray-600 mb-3">能力提升建议</h3>
          <ul className="space-y-2">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✦</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 团队角色 */}
      <div>
        <h3 className="font-bold text-sm text-gray-600 mb-2">团队角色定位（贝尔宾模型）</h3>
        <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-4">
          <div className="text-center shrink-0">
            <span className="block text-lg font-extrabold text-purple-700">{teamRole.primary}</span>
            <span className="text-[10px] text-purple-400">主要角色</span>
          </div>
          <div className="w-px h-10 bg-purple-200" />
          <div className="text-center shrink-0">
            <span className="block text-lg font-extrabold text-purple-500">{teamRole.secondary}</span>
            <span className="text-[10px] text-purple-300">次要角色</span>
          </div>
          <p className="text-xs text-gray-600 flex-1">{teamRole.description}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [reportData, setReportData] = useState<StructuredReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) { navigate('/history', { replace: true }); return }
    loadReport()
  }, [id, user])

  async function loadReport() {
    try {
      const data = await reportService.getDetail(Number(id))
      setReport(data.report)
      if (data.report.reportContent) {
        setReportData(parseReportData(data.report.reportContent))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取报告失败')
    } finally {
      setLoading(false)
    }
  }

  // ============ Loading ============
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <LoadingSpinner label="加载报告中…" />
      </div>
    )
  }

  // ============ Error ============
  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl mb-2">😔</div>
        <p className="text-red-500">{error || '报告不存在'}</p>
        <Link to="/history" className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold">返回报告列表</Link>
      </div>
    )
  }

  // ============ Report Content ============
  // 优先使用标准化HTML报告
  if (report.reportHtml) {
    return (
      <div className="min-h-screen bg-[#fafafa] pb-20">
        <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-14 max-w-4xl mx-auto">
            <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
            <h1 className="text-sm font-bold text-[#1a1a2e]">综合测评报告</h1>
            <div className="w-12" />
          </div>
        </header>
        <main className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
          <iframe
            srcDoc={report.reportHtml}
            title="综合测评报告"
            className="w-full border-0 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            style={{ height: '80vh', minHeight: '800px' }}
            sandbox="allow-same-origin"
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => {
                const token = localStorage.getItem('token')
                fetch(`/api/reports/${report.id}/pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.blob()).then(blob => {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `人才测评报告_${report.id}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                }).catch(() => alert('下载失败'))
              }}
              className="px-6 py-3 rounded-xl bg-white border border-black/[0.04] text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 transition-all text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              📥 下载报告
            </button>
            <Link
              to="/history"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all text-center"
            >
              我的报告列表
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!reportData) {
    // 报告内容解析失败，显示原始文本
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-14 max-w-4xl mx-auto">
            <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
            <h1 className="text-sm font-bold text-[#1a1a2e]">综合测评报告</h1>
            <div className="w-12" />
          </div>
        </header>
        <main className="px-6 py-6 max-w-4xl mx-auto">
          <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.reportContent || '暂无报告内容'}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 检测是否为兰大格式报告
  const lzuData = reportData && isLZUReport(reportData) ? reportData : null

  // ============ 兰大专属报告渲染 ============
  if (lzuData) {
    return (
      <div className="min-h-screen bg-[#fafafa] pb-20">
        <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-14 max-w-4xl mx-auto">
            <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
            <h1 className="text-sm font-bold text-[#1a1a2e]">兰大研究生职业发展测评报告</h1>
            <div className="w-12" />
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
          {/* 报告封面 */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400">{lzuData.reportId || 'LZU-REPORT'}</p>
            <p className="text-lg font-bold text-[#1a1a2e]">{lzuData.userName || '测评用户'}</p>
            <p className="text-xs text-gray-400">{lzuData.reportDate || ''}</p>
          </div>

          {/* 综合得分 + 等级 */}
          <LZUScoreSection score={lzuData.comprehensiveScore} grade={lzuData.grade} gradeDescription={lzuData.gradeDescription} />

          {/* 核心评价 */}
          <CoreEvaluationSection evaluation={lzuData.coreEvaluation} advantages={lzuData.coreAdvantages} />

          {/* 领导风格分析 */}
          {lzuData.leadershipAnalysis && <LZULeadershipSection data={lzuData.leadershipAnalysis} />}

          {/* 人格特质分析 */}
          {lzuData.personalityAnalysis && <LZUPersonalitySection data={lzuData.personalityAnalysis} />}

          {/* 创造力障碍分析 */}
          {lzuData.creativityBarrierAnalysis && <LZUCreativityBarrierSection data={lzuData.creativityBarrierAnalysis} />}

          {/* 职业建议 */}
          {lzuData.careerSuggestions.length > 0 && <LZUCareerSection suggestions={lzuData.careerSuggestions} />}

          {/* 能力提升计划 */}
          {lzuData.improvementPlan && <LZUImprovementPlanSection plan={lzuData.improvementPlan} />}

          {/* 总结 */}
          {lzuData.summary && (
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] rounded-2xl p-6 text-white mb-6 shadow-[0_4px_20px_rgba(30,58,95,0.25)]">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
                总结与展望
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">{lzuData.summary}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              to={`/api/reports/${report.id}/pdf`}
              className="px-6 py-3 rounded-xl bg-white border border-black/[0.04] text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 transition-all text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              📥 下载PDF
            </Link>
            <Link
              to="/history"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all text-center"
            >
              我的报告列表
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ============ 原有通用报告渲染 ============
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-4xl mx-auto">
          <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-sm font-bold text-[#1a1a2e]">综合测评报告</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {/* 报告封面 */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400">{reportData.reportId}</p>
          <p className="text-lg font-bold text-[#1a1a2e]">{reportData.userName}</p>
          <p className="text-xs text-gray-400">{reportData.reportDate}</p>
        </div>

        {/* 综合得分 */}
        <ScoreSection score={reportData.comprehensiveScore} />

        {/* 核心评价 */}
        <CoreEvaluationSection evaluation={reportData.coreEvaluation} advantages={reportData.coreAdvantages} />

        {/* 各维度分析 - 条件渲染 */}
        {reportData.personalityAnalysis && <PersonalitySection data={reportData.personalityAnalysis} />}
        {reportData.leadershipAnalysis && <LeadershipSection data={reportData.leadershipAnalysis} />}
        {reportData.temperamentAnalysis && <TemperamentSection data={reportData.temperamentAnalysis} />}
        {reportData.mbtiAnalysis && <MBTISection data={reportData.mbtiAnalysis} />}
        {reportData.sixteenPFAnalysis && <SixteenPFSection data={reportData.sixteenPFAnalysis} />}
        {reportData.creativityAnalysis && <CreativitySection data={reportData.creativityAnalysis} />}
        {reportData.hollandAnalysis && <HollandSection data={reportData.hollandAnalysis} />}

        {/* 发展建议 */}
        <CareerSection
          suggestions={reportData.careerSuggestions}
          improvements={reportData.improvementSuggestions}
          teamRole={reportData.teamRole}
        />

        {/* 总结 */}
        {reportData.summary && (
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] rounded-2xl p-6 text-white mb-6 shadow-[0_4px_20px_rgba(30,58,95,0.25)]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
              总结与展望
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">{reportData.summary}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            to={`/api/reports/${report.id}/pdf`}
            className="px-6 py-3 rounded-xl bg-white border border-black/[0.04] text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 transition-all text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            📥 下载PDF
          </Link>
          <Link
            to="/history"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all text-center"
          >
            我的报告列表
          </Link>
        </div>
      </main>
    </div>
  )
}
