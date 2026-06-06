import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportService, type ReportDetail } from '../services/reportService'
import { GaugeChart, RadarChart, BarChart, PieChart, HexagonChart } from '../components/charts'
import LoadingSpinner from '../components/LoadingSpinner'
import { QUESTIONNAIRE_PRIORITY } from '../types'

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

function getQuestionnaireName(qid: string): string {
  const q = QUESTIONNAIRE_PRIORITY.find(q => q.id === qid)
  return q?.name || qid
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

  // 审核轮询
  useEffect(() => {
    if (report && report.reviewStatus === 'pending') {
      const timer = setTimeout(loadReport, 5000)
      return () => clearTimeout(timer)
    }
  }, [report])

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

  // ============ Pending ============
  if (report.reviewStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="bg-white border-b border-black/[0.04]">
          <div className="flex items-center gap-3 px-6 h-14 max-w-4xl mx-auto">
            <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
            <h1 className="text-sm font-bold text-[#1a1a2e]">综合报告</h1>
          </div>
        </header>
        <main className="px-6 py-10 max-w-2xl mx-auto text-center">
          <div className="bg-white border border-black/[0.04] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-lg font-bold text-[#1a1a2e] mb-2">报告审核中</h2>
            <p className="text-gray-400 text-sm mb-4">你的综合报告已提交，正在等待专家审核</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="text-xs font-bold text-gray-500 mb-2">已完成的问卷：</p>
              <div className="flex flex-wrap gap-2">
                {report.questionnairesCompleted.map((qid: string) => (
                  <span key={qid} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    ✓ {getQuestionnaireName(qid)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ============ Rejected ============
  if (report.reviewStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="bg-white border-b border-black/[0.04]">
          <div className="flex items-center gap-3 px-6 h-14 max-w-4xl mx-auto">
            <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
            <h1 className="text-sm font-bold text-[#1a1a2e]">综合报告</h1>
          </div>
        </header>
        <main className="px-6 py-10 max-w-2xl mx-auto text-center">
          <div className="bg-white border border-black/[0.04] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-lg font-bold text-[#1a1a2e] mb-2">报告正在修订中</h2>
            <p className="text-gray-400 text-sm">专家正在对您的报告进行修订优化，请耐心等待</p>
            {report.reviewComment && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <p className="text-amber-700 text-sm">{report.reviewComment}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ============ Approved - Full Report ============
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

  // 完整的结构化报告渲染
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
