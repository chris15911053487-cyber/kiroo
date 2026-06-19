import { Link } from 'react-router-dom'
import { GaugeChart, RadarChart } from '../components/charts'
import {
  computeMidsF2,
  MIDS_DIMENSION_KEYS,
  MIDS_DIMENSION_NAMES,
  type MidsF2Result,
} from '../lib/midsF2Scoring'

// ==================== 报告数据结构 ====================

interface MidsF2EntryAnalysis {
  sequence: number
  text: string
  score: number
  comment: string
}

interface MidsF2EntryHighlight {
  sequence: number
  text: string
  score: number
  highlight: string
}

interface MidsF2AIInsight {
  dimensionKey: string
  dimensionName: string
  tier: string
  score: number
  level: string
  coreDefinition?: string
  entryAnalysis: MidsF2EntryAnalysis[]
  // 新版字段（优势视角）
  coreStrength?: string
  growthSpace?: string
  entryHighlights?: MidsF2EntryHighlight[]
  careerInsight?: string
  // 向后兼容旧版
  analysis?: string
  impactOnSuccession?: string
  interpretation?: string
  suggestion?: string
}

interface MidsF2CapabilityImprovement {
  dimensionKey: string
  dimensionName: string
  direction: string
  reason: string
}

interface MidsF2PathEvaluation {
  path: string
  rating: string
  score: number
  basis: string
  risk: string
}

interface MidsF2RoadmapPhase {
  phase: string
  timeline: string
  title: string
  goal: string
  recommendation?: string
  coreTasks?: string[]
}

interface MidsF2CareerPathAnalysis {
  corePotentialDiagnosis: string
  corePotentialDescription: string
  pathEvaluations: MidsF2PathEvaluation[]
  roadmap: MidsF2RoadmapPhase[]
  ultimateConclusion: string
}

interface MidsF2AIReport {
  frameworkExplanation?: string
  comprehensiveOverview?: {
    totalScore: number
    scoreLabel: string
    overallAssessment: string
    spfConclusion?: {
      sScore: number
      pScore: number
      fScore: number
      decisionPath: string
      decisionLabel: string
      decisionEmoji: string
      reasoning: string
    }
  }
  dimensionInsights: MidsF2AIInsight[]
  developmentSuggestions?: {
    integratedJudgment?: {
      tierSummary: string
      tierTable?: string
    }
    developmentDirection?: string
    capabilityImprovements?: MidsF2CapabilityImprovement[]
    stakeholderAdvice?: string
  }
  careerPathAnalysis?: MidsF2CareerPathAnalysis
  summary: string
  userName?: string
  reportDate?: string
  reportId?: string
  // backward compat
  comprehensiveScore?: number
  coreEvaluation?: string
  careerSuggestions?: { direction: string; reason: string }[]
  improvementPlan?: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
  [key: string]: any
}

// ==================== 通用组件 ====================

/** 解析 AI 生成的 **粗体** markdown，渲染为 <strong> */
function RichText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

/** 一级章节标题 */
function ChapterHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 mt-8 first:mt-0 pb-3 border-b-2 border-[#1E3A5F]">
      <span className="text-2xl font-bold text-[#1E3A5F] tracking-wide">{number}</span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  )
}

/** 二级小节标题 */
function SubSectionHeading({ number, title, rightLabel }: {
  number: string
  title: string
  rightLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold text-gray-800">
        <span className="text-[#1E3A5F] font-semibold mr-1.5">{number}</span>
        {title}
      </h3>
      {rightLabel && (
        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
          {rightLabel}
        </span>
      )}
    </div>
  )
}

// ==================== 章节组件 ====================

/** 一、认识你自己 */
function FrameworkSection({ text }: { text: string }) {
  if (!text) return null
  return (
    <div>
      <ChapterHeading number="一、" title="认识你自己" />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <RichText text={text} className="text-base text-gray-700 leading-loose" />
      </div>
    </div>
  )
}

/** 二、五维能力画像 */
function OverviewSection({ score, result, overallAssessment }: {
  score: number
  result: MidsF2Result
  overallAssessment?: string
}) {
  return (
    <div>
      <ChapterHeading number="二、" title="五维能力画像" />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 综合得分 + 路径 */}
        <div className="flex flex-col items-center">
          <GaugeChart value={score} min={20} max={100} size={160} />
          <p className="text-sm text-gray-500 mt-2">综合得分 · 满分100分</p>
          <div className="inline-block mt-3 px-4 py-1 border border-gray-300 rounded text-sm font-bold text-gray-700">
            {result.decisionEmoji} {result.decisionLabel}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-100" />

        {/* 五维雷达图 */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3 text-center">五维能力画像</h3>
          <RadarChartBlock result={result} />
        </div>

        {/* 五维能力画像文字 */}
        {overallAssessment && (
          <>
            <div className="border-t border-gray-100" />
            <RichText text={overallAssessment} className="text-base text-gray-700 leading-loose" />
          </>
        )}
      </div>
    </div>
  )
}

function RadarChartBlock({ result }: { result: MidsF2Result }) {
  const radarData = MIDS_DIMENSION_KEYS.map(key => ({
    label: MIDS_DIMENSION_NAMES[key],
    value: result.dimensionAverages[key] ?? 0,
    maxValue: 5,
  }))

  return (
    <div className="flex justify-center">
      <RadarChart data={radarData} size={280} color="#6366F1" />
    </div>
  )
}

/** 特别警示（非编号，红色提醒） */
function WarningsSection({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <h2 className="text-base font-bold text-red-700 mb-3">⚠️ 特别警示</h2>
      <ul className="space-y-2">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 三、维度深度解读 */
function DimensionInsightsSection({ insights, dimensionAverages }: {
  insights: MidsF2AIInsight[]
  dimensionAverages: Record<string, number>
}) {
  if (!insights || insights.length === 0) return null

  const dimensionIndexMap: Record<string, number> = {
    strategic_breakthrough: 1,
    execution_disruption: 2,
    resource_integration: 3,
    adversity_quotient: 4,
    ethics_vision: 5,
  }

  return (
    <div>
      <ChapterHeading number="三、" title="维度深度解读" />

      <div className="space-y-4">
        {insights.map(insight => {
          const dimensionName = insight.dimensionName
            || MIDS_DIMENSION_NAMES[insight.dimensionKey]
            || insight.dimensionKey
          const idx = dimensionIndexMap[insight.dimensionKey] || 0
          const score = dimensionAverages[insight.dimensionKey]?.toFixed(1)
            ?? insight.score?.toFixed(1) ?? '-'

          // 判断是否为新版结构（有 coreStrength 字段）
          const hasNewFields = !!insight.coreStrength

          return (
            <div key={insight.dimensionKey} className="bg-white border border-gray-200 rounded-lg p-6">
              <SubSectionHeading
                number={`3.${idx}`}
                title={`${dimensionName}`}
                rightLabel={`${score} / 5  ${insight.level || ''}`}
              />

              {/* 层级标签 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#1E3A5F] bg-[#EEF2F7] px-2 py-0.5 rounded font-medium">
                  {insight.tier || ''}
                </span>
              </div>

              {/* 条目得分标签（全部条目） */}
              {insight.entryAnalysis && insight.entryAnalysis.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {insight.entryAnalysis.map(entry => (
                    <span
                      key={entry.sequence}
                      className="inline-flex items-center gap-1 text-[10px] bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-600"
                      title={entry.comment}
                    >
                      <span className="font-bold text-gray-700">{entry.score}</span>
                      <span className="truncate max-w-[120px]">{entry.text}</span>
                    </span>
                  ))}
                </div>
              )}

              {hasNewFields ? (
                <>
                  {/* 新版：核心优势 → 成长空间 → 条目亮点 → 职业启示 */}
                  {insight.coreStrength && (
                    <div className="mb-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <p className="text-xs text-indigo-500 font-medium mb-1.5">核心优势</p>
                      <RichText
                        text={insight.coreStrength}
                        className="text-base text-gray-700 leading-loose"
                      />
                    </div>
                  )}

                  {insight.growthSpace && (
                    <div className="mb-4 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <p className="text-xs text-amber-600 font-medium mb-1.5">成长空间</p>
                      <RichText
                        text={insight.growthSpace}
                        className="text-base text-gray-700 leading-loose"
                      />
                    </div>
                  )}

                  {insight.entryHighlights && insight.entryHighlights.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium mb-2">条目亮点</p>
                      <div className="space-y-1.5">
                        {insight.entryHighlights.map(eh => (
                          <div key={eh.sequence} className="flex items-start gap-2 text-sm">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700 text-xs font-bold shrink-0 mt-0.5">
                              {eh.score}
                            </span>
                            <span className="text-gray-600">{eh.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.careerInsight && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">职业方向启示</p>
                      <RichText
                        text={insight.careerInsight}
                        className="text-sm text-gray-700 leading-relaxed"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 旧版兼容：analysis + impactOnSuccession */}
                  <div className="mb-4">
                    <RichText
                      text={insight.analysis || insight.interpretation || ''}
                      className="text-base text-gray-700 leading-loose"
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">职业方向启示</p>
                    <RichText
                      text={insight.impactOnSuccession || insight.suggestion || ''}
                      className="text-sm text-gray-700 leading-relaxed"
                    />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 四、发展建议 */
function DevelopmentSuggestionsSection({ suggestions }: {
  suggestions: NonNullable<MidsF2AIReport['developmentSuggestions']>
}) {
  if (!suggestions) return null
  const { integratedJudgment, developmentDirection, capabilityImprovements, stakeholderAdvice } = suggestions
  const hasContent = integratedJudgment?.tierSummary || developmentDirection
    || (capabilityImprovements && capabilityImprovements.length > 0) || stakeholderAdvice
  if (!hasContent) return null

  let subIdx = 0

  return (
    <div>
      <ChapterHeading number="四、" title="发展建议" />

      <div className="space-y-4">
        {/* 层级综合分析 */}
        {integratedJudgment?.tierSummary && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`4.${++subIdx}`} title="层级综合分析" />
            <RichText text={integratedJudgment.tierSummary} className="text-base text-gray-700 leading-loose mb-3" />
            {integratedJudgment.tierTable && (
              <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded p-3">{integratedJudgment.tierTable}</p>
            )}
          </div>
        )}

        {/* 整体发展方向 */}
        {developmentDirection && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`4.${++subIdx}`} title="整体发展方向" />
            <RichText text={developmentDirection} className="text-base text-gray-700 leading-loose" />
          </div>
        )}

        {/* 能力提升建议 */}
        {capabilityImprovements && capabilityImprovements.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`4.${++subIdx}`} title="能力提升建议" />
            <div className="space-y-4">
              {capabilityImprovements.map(item => (
                <div key={item.dimensionKey} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-800 mb-1">{item.dimensionName}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.direction}</p>
                  {item.reason && (
                    <RichText text={item.reason} className="text-sm text-gray-600 leading-relaxed mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 利益相关者沟通建议 */}
        {stakeholderAdvice && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`4.${++subIdx}`} title="利益相关者沟通建议" />
            <RichText text={stakeholderAdvice} className="text-base text-gray-700 leading-loose" />
          </div>
        )}
      </div>
    </div>
  )
}

/** 五、总结与展望 */
function SummarySection({ summary, overallAssessment }: {
  summary: string
  overallAssessment?: string
}) {
  if (!summary && !overallAssessment) return null
  return (
    <div>
      <ChapterHeading number="五、" title="总结与展望" />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {overallAssessment && (
          <RichText text={overallAssessment} className="text-base text-gray-700 leading-loose mb-4" />
        )}
        {summary && (
          <RichText text={summary} className="text-base text-gray-700 leading-loose" />
        )}
      </div>
    </div>
  )
}

// ==================== 六、职业发展核心潜能与路径建议 ====================

/** 星级渲染 */
function StarRating({ rating }: { rating: string }) {
  return <span className="text-sm tracking-wider font-bold text-amber-500">{rating}</span>
}

function CareerPathSection({ data }: { data: MidsF2CareerPathAnalysis }) {
  if (!data) return null

  const pathColorMap: Record<string, { bg: string; border: string; label: string }> = {
    '立即继承家业': { bg: 'bg-red-50', border: 'border-red-200', label: '低适配' },
    '自主创业（外部独立）': { bg: 'bg-amber-50', border: 'border-amber-200', label: '中低适配' },
    '选择性就业 / 外部机构历练': { bg: 'bg-green-50', border: 'border-green-200', label: '当前最优解' },
  }

  let subIdx = 0

  return (
    <div>
      <ChapterHeading number="六、" title="职业发展核心潜能与路径建议" />

      <div className="space-y-4">
        {/* 核心潜能诊断 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SubSectionHeading number={`6.${++subIdx}`} title="核心潜能诊断" />
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-sm rounded mb-3">
            {data.corePotentialDiagnosis}
          </div>
          <RichText text={data.corePotentialDescription} className="text-base text-gray-700 leading-loose" />
        </div>

        {/* 三大路径适配度评估 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SubSectionHeading number={`6.${++subIdx}`} title="三大路径适配度深度评估" />
          <div className="space-y-4">
            {data.pathEvaluations.map((pe, i) => {
              const colors = pathColorMap[pe.path] || { bg: 'bg-gray-50', border: 'border-gray-200', label: '' }
              return (
                <div key={i} className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-gray-800">{pe.path}</h4>
                    <div className="flex items-center gap-2">
                      {colors.label && (
                        <span className="text-xs text-gray-500 font-medium">{colors.label}</span>
                      )}
                      <StarRating rating={pe.rating} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">适配依据</p>
                      <p className="text-gray-700 leading-relaxed">{pe.basis}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">风险提示</p>
                      <p className="text-gray-600 leading-relaxed">{pe.risk}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 终极发展路线图 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SubSectionHeading number={`6.${++subIdx}`} title="终极发展路线图（分阶段策略）" />
          <div className="space-y-4">
            {data.roadmap.map((phase, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-indigo-300 pb-4 last:pb-0">
                {/* 时间线圆点 */}
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {phase.timeline}
                  </span>
                  <span className="text-xs text-gray-400">{phase.phase}</span>
                </div>
                <h4 className="font-bold text-sm text-gray-800 mb-1">{phase.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{phase.goal}</p>
                {phase.recommendation && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="text-xs text-gray-500">推荐去向：</span>
                    {phase.recommendation}
                  </p>
                )}
                {phase.coreTasks && phase.coreTasks.length > 0 && (
                  <ul className="space-y-1">
                    {phase.coreTasks.map((task, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-400 text-xs mt-1">◆</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 终极结论 */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 text-center">
          <p className="text-xs text-indigo-400 font-medium mb-2">一句话终极结论</p>
          <p className="text-lg font-bold text-indigo-800 leading-relaxed">{data.ultimateConclusion}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

export interface MidsF2ReportPageProps {
  scoreResult: Record<string, number>  // 维度均分
  aiReport?: MidsF2AIReport | null
  reportId?: number
  userName?: string  // 兜底：旧报告 JSON 可能不含 userName
  userEducation?: string
  userGraduationIntention?: string
}

export default function MidsF2ReportPage({ scoreResult, aiReport, reportId, userName, userEducation, userGraduationIntention }: MidsF2ReportPageProps) {
  const result = computeMidsF2(scoreResult)

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-3xl mx-auto">
          <Link to="/history?from=mids-f2" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-sm font-bold text-[#1a1a2e]">MIDS-F2 创新力报告</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        {/* 报告封面 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">家族二代多维创新力量表</h1>
          <p className="text-sm text-gray-400 mb-4">MIDS-F2 测评报告</p>
          {aiReport && (
            <>
              <p className="text-lg font-bold text-[#1a1a2e]">{aiReport.userName || userName || '测评用户'}</p>
              {(aiReport.education || userEducation || aiReport.graduationIntention || userGraduationIntention) && (
                <p className="text-xs text-gray-400 mt-1">
                  {aiReport.education || userEducation || ''}
                  {(aiReport.education || userEducation) && (aiReport.graduationIntention || userGraduationIntention) && ' · '}
                  {aiReport.graduationIntention || userGraduationIntention || ''}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {aiReport.reportDate || ''}
                {aiReport.reportId && <span className="ml-2">报告编号：{aiReport.reportId}</span>}
              </p>
            </>
          )}
        </div>

        {/* 一、认识你自己 */}
        {aiReport?.frameworkExplanation && (
          <FrameworkSection text={aiReport.frameworkExplanation} />
        )}

        {/* 二、五维能力画像 */}
        <OverviewSection
          score={result.totalScore}
          result={result}
          overallAssessment={aiReport?.comprehensiveOverview?.overallAssessment}
        />

        {/* 特别警示 */}
        <WarningsSection warnings={result.warnings} />

        {/* 三、维度深度解读 */}
        {aiReport?.dimensionInsights && (
          <DimensionInsightsSection
            insights={aiReport.dimensionInsights}
            dimensionAverages={result.dimensionAverages}
          />
        )}

        {/* 四、发展建议 */}
        {aiReport?.developmentSuggestions && (
          <DevelopmentSuggestionsSection suggestions={aiReport.developmentSuggestions} />
        )}

        {/* 向后兼容：旧版 improvementPlan */}
        {!aiReport?.developmentSuggestions && aiReport?.improvementPlan && (
          <div>
            <ChapterHeading number="四、" title="发展建议" />
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {[
                  { title: '近期行动（0-6个月）', items: aiReport.improvementPlan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
                  { title: '中期规划（6个月-2年）', items: aiReport.improvementPlan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
                  { title: '长期发展（2-5年）', items: aiReport.improvementPlan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
                ].filter(s => s.items && s.items.length > 0).map((s, i) => (
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
          </div>
        )}

        {/* 五、总结与展望 */}
        <SummarySection
          summary={aiReport?.summary || ''}
          overallAssessment={undefined}
        />

        {/* 六、职业发展核心潜能与路径建议（新版） */}
        {aiReport?.careerPathAnalysis && (
          <CareerPathSection data={aiReport.careerPathAnalysis} />
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
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
              className="px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 text-center"
            >
              📥 下载报告
            </button>
          )}
          <Link
            to="/history?from=mids-f2"
            className="px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-medium text-sm text-center hover:bg-gray-50"
          >
            我的报告列表
          </Link>
        </div>
      </main>
    </div>
  )
}
