import { Link } from 'react-router-dom'
import { GaugeChart, RadarChart } from '../components/charts'
import {
  computeMidsF2,
  MIDS_DIMENSION_KEYS,
  MIDS_DIMENSION_NAMES,
  type MidsF2Result,
} from '../lib/midsF2Scoring'

// ==================== 报告数据结构 ====================

interface MidsF2AIInsight {
  dimensionKey: string
  interpretation: string
  suggestion: string
}

interface MidsF2AIReport {
  comprehensiveScore: number
  coreEvaluation: string
  dimensionInsights: MidsF2AIInsight[]
  careerSuggestions?: { direction: string; reason: string }[]
  improvementPlan?: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
  summary: string
  userName?: string
  reportDate?: string
  reportId?: string
}

// ==================== 截面组件 ====================

function ScoreSection({ score, result }: { score: number; result: MidsF2Result }) {
  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] via-[#1A2D4A] to-[#1E3A5F] rounded-2xl p-8 text-white text-center mb-6 shadow-[0_8px_30px_rgba(30,58,95,0.3)]">
      <p className="text-sm text-white/60 mb-1">家族二代多维创新力量表（MIDS-F2）</p>
      <GaugeChart value={score} min={20} max={100} size={180} />
      <p className="text-xs text-white/40 mt-2">综合得分 · 满分100分</p>
      <div className="inline-block mt-3 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold shadow-lg">
        {result.decisionEmoji} {result.decisionLabel}
      </div>
    </div>
  )
}

function RadarSection({ result }: { result: MidsF2Result }) {
  const radarData = MIDS_DIMENSION_KEYS.map(key => ({
    label: MIDS_DIMENSION_NAMES[key],
    value: result.dimensionAverages[key] ?? 0,
    maxValue: 5,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
        五维雷达图
      </h2>
      <div className="flex justify-center mb-4">
        <RadarChart data={radarData} size={280} color="#6366F1" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {MIDS_DIMENSION_KEYS.map(key => (
          <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">{MIDS_DIMENSION_NAMES[key]}</p>
            <p className="font-bold text-indigo-600">{result.dimensionAverages[key]?.toFixed(1) ?? '-'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionMatrixSection({ result }: { result: MidsF2Result }) {
  const cards: { label: string; key: string; score: number; threshold: number; isHigh: boolean }[] = [
    { label: 'S 战略破局力', key: 'S', score: result.sScore, threshold: 3.5, isHigh: result.sScore >= 3.5 },
    { label: 'P 执行颠覆力', key: 'P', score: result.pScore, threshold: 3.5, isHigh: result.pScore >= 3.5 },
    { label: 'F 资源匹配度', key: 'F', score: result.fScore, threshold: 3.5, isHigh: result.fScore >= 3.5 },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-amber-500" />
        S-P-F 三维决策矩阵
      </h2>

      {/* 三卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(c => (
          <div
            key={c.key}
            className={`rounded-xl p-4 text-center border-2 transition-all ${
              c.isHigh
                ? 'bg-green-50 border-green-300'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.isHigh ? 'text-green-600' : 'text-orange-500'}`}>
              {c.score.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-400">阈值 {c.threshold}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                c.isHigh ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
              }`}
            >
              {c.isHigh ? '✓ 高' : '— 中/低'}
            </span>
          </div>
        ))}
      </div>

      {/* 推荐路径 */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100">
        <p className="text-3xl mb-2">{result.decisionEmoji}</p>
        <p className="text-lg font-bold text-indigo-700 mb-1">推荐路径：{result.decisionLabel}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{result.decisionLogic}</p>
      </div>
    </div>
  )
}

function WarningsSection({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-red-500" />
        ⚠️ 特别警示
      </h2>
      <ul className="space-y-2">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-red-700 leading-relaxed">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DimensionInsightsSection({ insights, dimensionAverages }: {
  insights: MidsF2AIInsight[]
  dimensionAverages: Record<string, number>
}) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500" />
        维度深度解读
      </h2>
      <div className="space-y-4">
        {insights.map(insight => (
          <div key={insight.dimensionKey} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#1a1a2e]">
                {MIDS_DIMENSION_NAMES[insight.dimensionKey] || insight.dimensionKey}
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {dimensionAverages[insight.dimensionKey]?.toFixed(1) ?? '-'} / 5
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{insight.interpretation}</p>
            <p className="text-xs text-indigo-600 flex items-start gap-1">
              <span>💡</span>
              <span>{insight.suggestion}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImprovementPlanSection({ plan }: {
  plan: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
}) {
  if (!plan) return null

  const sections = [
    { title: '近期行动（0-6个月）', items: plan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
    { title: '中期规划（6个月-2年）', items: plan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
    { title: '长期发展（2-5年）', items: plan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
  ].filter(s => s.items && s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
        发展建议
      </h2>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className={`border-l-4 rounded-r-xl p-4 ${s.color}`}>
            <h3 className="font-bold text-sm text-[#1a1a2e] mb-2">{s.title}</h3>
            <ul className="space-y-1">
              {s.items.map((item: string, j: number) => (
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

function SummarySection({ summary }: { summary: string }) {
  if (!summary) return null

  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] rounded-2xl p-6 text-white mb-6 shadow-[0_4px_20px_rgba(30,58,95,0.25)]">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
        总结与展望
      </h2>
      <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
    </div>
  )
}

// ==================== 主组件 ====================

export interface MidsF2ReportPageProps {
  scoreResult: Record<string, number>  // 维度均分 (由 scoringEngine compute 返回的 dimensionScores)
  aiReport?: MidsF2AIReport | null
  reportId?: number
}

export default function MidsF2ReportPage({ scoreResult, aiReport, reportId }: MidsF2ReportPageProps) {
  const result = computeMidsF2(scoreResult)

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-3xl mx-auto">
          <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-sm font-bold text-[#1a1a2e]">MIDS-F2 创新力报告</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {/* 报告封面 */}
        {aiReport && (
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400">{aiReport.reportId || ''}</p>
            <p className="text-lg font-bold text-[#1a1a2e]">{aiReport.userName || '测评用户'}</p>
            <p className="text-xs text-gray-400">{aiReport.reportDate || ''}</p>
          </div>
        )}

        {/* 综合得分 */}
        <ScoreSection score={result.totalScore} result={result} />

        {/* 五维雷达图 */}
        <RadarSection result={result} />

        {/* S-P-F 决策矩阵 */}
        <DecisionMatrixSection result={result} />

        {/* 特别警示 */}
        <WarningsSection warnings={result.warnings} />

        {/* AI 维度解读 */}
        {aiReport?.dimensionInsights && (
          <DimensionInsightsSection
            insights={aiReport.dimensionInsights}
            dimensionAverages={result.dimensionAverages}
          />
        )}

        {/* 发展建议 */}
        {aiReport?.improvementPlan && (
          <ImprovementPlanSection plan={aiReport.improvementPlan} />
        )}

        {/* 总结 */}
        <SummarySection summary={aiReport?.summary || ''} />

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {reportId && (
            <button
              onClick={() => {
                const token = localStorage.getItem('token')
                fetch(`/api/reports/${reportId}/pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.blob()).then(blob => {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `MIDS-F2创新力报告_${reportId}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                }).catch(() => alert('下载失败'))
              }}
              className="px-6 py-3 rounded-xl bg-white border border-black/[0.04] text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 transition-all text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              📥 下载报告
            </button>
          )}
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
