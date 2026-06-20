import { useEffect } from 'react'
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

interface MidsF2DimensionOverview {
  dimensionKey: string
  dimensionName: string
  score: number
  position: string
}

interface MidsF2BarrelBoard {
  name: string
  score: number
  description?: string
  fixPath?: string
}

interface MidsF2BarrelPrinciple {
  longBoards: MidsF2BarrelBoard[]
  shortBoards: MidsF2BarrelBoard[]
  coreCompetitiveness: string
}

interface MidsF2SupplementarySuggestions {
  targetedTraining: string
  talentIncubator: string
}

interface MidsF2AIReport {
  uniqueGene?: string
  frameworkExplanation?: string
  dimensionOverview?: MidsF2DimensionOverview[]
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
  barrelPrinciple?: MidsF2BarrelPrinciple
  developmentSuggestions?: {
    integratedJudgment?: {
      tierSummary: string
      tierTable?: string
    }
    developmentDirection?: string
    capabilityImprovements?: MidsF2CapabilityImprovement[]
    supplementarySuggestions?: MidsF2SupplementarySuggestions
    stakeholderAdvice?: string
  }
  careerPathAnalysis?: MidsF2CareerPathAnalysis
  summary: string
  userName?: string
  reportDate?: string
  reportId?: string
  education?: string
  graduationIntention?: string
  major?: string
  // backward compat
  comprehensiveScore?: number
  coreEvaluation?: string
  careerSuggestions?: { direction: string; reason: string }[]
  improvementPlan?: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
  [key: string]: any
}

// ==================== 通用组件 ====================

/** 解析 AI 生成的 **粗体** markdown，支持分段（双换行=新段落，单换行=换行） */
function RichText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null
  // 按双换行拆分为段落
  const paragraphs = text.split(/\n\n+/)
  return (
    <div className={className}>
      {paragraphs.map((para, pi) => {
        // 每个段落内按单换行插入 <br/>
        const lines = para.split(/\n/)
        return (
          <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
                  }
                  return <span key={i}>{part}</span>
                })}
              </span>
            ))}
          </p>
        )
      })}
    </div>
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
        <span className="text-base font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
          {rightLabel}
        </span>
      )}
    </div>
  )
}

// ==================== 章节组件 ====================

/** 一、认识你自己 */
function FrameworkSection({ uniqueGene, text }: { uniqueGene?: string; text: string }) {
  if (!text && !uniqueGene) return null
  return (
    <div>
      <ChapterHeading number="一、" title="认识你自己" />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {uniqueGene && (
          <div className="inline-block px-3 py-1.5 bg-indigo-100 text-indigo-800 font-bold text-base rounded-lg mb-4">
            您的独特基因：{uniqueGene}
          </div>
        )}
        {text && <RichText text={text} className="text-base text-gray-700 leading-loose" />}
      </div>
    </div>
  )
}

/** 二、五维雷达图解读 */
function OverviewSection({ score, result, overallAssessment, dimensionOverview }: {
  score: number
  result: MidsF2Result
  overallAssessment?: string
  dimensionOverview?: MidsF2DimensionOverview[]
}) {
  return (
    <div>
      <ChapterHeading number="二、" title="五维雷达图解读" />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 综合得分 + 路径 */}
        <div className="flex flex-col items-center">
          <GaugeChart value={score} min={20} max={100} size={160} />
          <p className="text-base text-gray-500 mt-2">综合得分 · 满分100分</p>
          <div className="inline-block mt-3 px-4 py-1 border border-gray-300 rounded text-base font-bold text-gray-700">
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

        {/* 维度速查定位表 */}
        {dimensionOverview && dimensionOverview.length > 0 && (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3">维度速查定位</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-base text-gray-500 font-medium">维度</th>
                      <th className="text-center py-2 px-3 text-base text-gray-500 font-medium">得分</th>
                      <th className="text-left py-2 px-3 text-base text-gray-500 font-medium">定位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensionOverview.map(dim => {
                      const levelColor = dim.score >= 4.5 ? 'text-green-700 bg-green-50'
                        : dim.score >= 3.5 ? 'text-blue-700 bg-blue-50'
                        : dim.score >= 2.5 ? 'text-amber-700 bg-amber-50'
                        : 'text-red-700 bg-red-50'
                      return (
                        <tr key={dim.dimensionKey} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 px-3 font-medium text-gray-800">{dim.dimensionName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-base font-bold ${levelColor}`}>
                              {dim.score.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 text-base leading-relaxed">{dim.position}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 综合描述文字 */}
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
          <li key={i} className="flex items-start gap-2 text-base text-gray-700 leading-relaxed">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 四、木桶原理诊断 · 核心竞争力模型 */
function BarrelPrincipleSection({ data }: { data: MidsF2BarrelPrinciple }) {
  if (!data) return null
  const { longBoards, shortBoards, coreCompetitiveness } = data
  const hasContent = (longBoards && longBoards.length > 0) || (shortBoards && shortBoards.length > 0) || coreCompetitiveness
  if (!hasContent) return null

  return (
    <div>
      <ChapterHeading number="四、" title="木桶原理诊断 · 您的核心竞争力模型" />

      <div className="space-y-4">
        {/* 长板 */}
        {longBoards && longBoards.length > 0 && (
          <div className="bg-white border border-green-200 rounded-lg p-6">
            <h3 className="text-base font-bold text-green-700 mb-3">您的长板（核心竞争力）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-green-100">
                    <th className="text-left py-2 px-3 text-base text-green-600 font-medium">长板</th>
                    <th className="text-center py-2 px-3 text-base text-green-600 font-medium w-16">得分</th>
                    <th className="text-left py-2 px-3 text-base text-green-600 font-medium">核心优势描述</th>
                  </tr>
                </thead>
                <tbody>
                  {longBoards.map((lb, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 px-3 font-bold text-gray-800">{lb.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 rounded bg-green-100 text-green-700 text-base font-bold">
                          {lb.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-base leading-relaxed">{lb.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 短板 */}
        {shortBoards && shortBoards.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-lg p-6">
            <h3 className="text-base font-bold text-amber-700 mb-3">您的短板（需定向补齐）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-amber-100">
                    <th className="text-left py-2 px-3 text-base text-amber-600 font-medium">短板</th>
                    <th className="text-center py-2 px-3 text-base text-amber-600 font-medium w-16">得分</th>
                    <th className="text-left py-2 px-3 text-base text-amber-600 font-medium">补板路径</th>
                  </tr>
                </thead>
                <tbody>
                  {shortBoards.map((sb, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 px-3 font-bold text-gray-800">{sb.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 rounded bg-red-100 text-red-700 text-base font-bold">
                          {sb.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-base leading-relaxed">{sb.fixPath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 核心竞争力一句话 */}
        {coreCompetitiveness && (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-5 text-center">
            <p className="text-base text-indigo-400 font-medium mb-2">您的核心竞争力一句话总结</p>
            <p className="text-base font-bold text-indigo-800 leading-relaxed">{coreCompetitiveness}</p>
          </div>
        )}
      </div>
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
                <span className="text-base text-[#1E3A5F] bg-[#EEF2F7] px-2 py-0.5 rounded font-medium">
                  {insight.tier || ''}
                </span>
              </div>

              {/* 条目得分标签（全部条目） */}
              {insight.entryAnalysis && insight.entryAnalysis.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {insight.entryAnalysis.map(entry => (
                    <span
                      key={entry.sequence}
                      className="inline-flex items-center gap-1 text-base bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-600"
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
                  {/* 新版：独到之处 → 成长空间 → 条目亮点 → 真实含义 */}
                  {insight.coreStrength && (
                    <div className="mb-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <p className="text-base text-indigo-500 font-bold mb-1.5">◈ 您独到的地方（别人没有的）</p>
                      <RichText
                        text={insight.coreStrength}
                        className="text-base text-gray-700 leading-loose"
                      />
                    </div>
                  )}

                  {insight.growthSpace && (
                    <div className="mb-4 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <p className="text-base text-amber-600 font-bold mb-1.5">◈ 您的成长空间（木桶的短板在这里）</p>
                      <RichText
                        text={insight.growthSpace}
                        className="text-base text-gray-700 leading-loose"
                      />
                    </div>
                  )}

                  {insight.entryHighlights && insight.entryHighlights.length > 0 && (
                    <div className="mb-4">
                      <p className="text-base text-gray-500 font-medium mb-2">条目亮点</p>
                      <div className="space-y-1.5">
                        {insight.entryHighlights.map(eh => (
                          <div key={eh.sequence} className="flex items-start gap-2 text-base">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700 text-base font-bold shrink-0 mt-0.5">
                              {eh.score}
                            </span>
                            <span className="text-gray-600">{eh.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.careerInsight && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200 rounded-lg p-4">
                      <p className="text-base text-gray-500 font-bold mb-1">◈ 这个维度对您的真实含义</p>
                      <RichText
                        text={insight.careerInsight}
                        className="text-base text-gray-700 leading-relaxed"
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
                    <p className="text-base text-gray-500 mb-1">职业方向启示</p>
                    <RichText
                      text={insight.impactOnSuccession || insight.suggestion || ''}
                      className="text-base text-gray-700 leading-relaxed"
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

/** 五、发展建议（个性化版） */
function DevelopmentSuggestionsSection({ suggestions }: {
  suggestions: NonNullable<MidsF2AIReport['developmentSuggestions']>
}) {
  if (!suggestions) return null
  const { integratedJudgment, developmentDirection, capabilityImprovements, supplementarySuggestions, stakeholderAdvice } = suggestions
  const hasContent = integratedJudgment?.tierSummary || developmentDirection
    || (capabilityImprovements && capabilityImprovements.length > 0) || stakeholderAdvice || supplementarySuggestions
  if (!hasContent) return null

  let subIdx = 0

  return (
    <div>
      <ChapterHeading number="五、" title="发展建议（个性化版）" />

      <div className="space-y-4">
        {/* 层级综合分析 */}
        {integratedJudgment?.tierSummary && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`5.${++subIdx}`} title="层级综合分析" />
            <RichText text={integratedJudgment.tierSummary} className="text-base text-gray-700 leading-loose mb-3" />
            {integratedJudgment.tierTable && (
              <p className="text-base text-gray-500 font-mono bg-gray-50 rounded p-3">{integratedJudgment.tierTable}</p>
            )}
          </div>
        )}

        {/* 整体发展方向 */}
        {developmentDirection && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`5.${++subIdx}`} title="整体发展方向" />
            <RichText text={developmentDirection} className="text-base text-gray-700 leading-loose" />
          </div>
        )}

        {/* 能力提升建议 */}
        {capabilityImprovements && capabilityImprovements.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`5.${++subIdx}`} title="能力提升建议" />
            <div className="space-y-4">
              {capabilityImprovements.map(item => (
                <div key={item.dimensionKey} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-base text-gray-800 mb-1">▌{item.dimensionName} · {item.direction.split('，')[0] || item.direction}</h4>
                  <RichText text={item.reason} className="text-base text-gray-600 leading-relaxed mt-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 补充建议：培训 + 孵化器 */}
        {supplementarySuggestions && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`5.${++subIdx}`} title="成长建议：职业培训与人才孵化" />

            {/* 针对性职业培训 */}
            {supplementarySuggestions.targetedTraining && (
              <div className="mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <p className="text-base text-blue-600 font-bold mb-2">① 定向能力强化</p>
                <RichText text={supplementarySuggestions.targetedTraining} className="text-base text-gray-700 leading-relaxed" />
              </div>
            )}

            {/* 人才定制孵化器 */}
            {supplementarySuggestions.talentIncubator && (
              <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-lg">
                <p className="text-base text-violet-600 font-bold mb-2">② 人才定制孵化器</p>
                <RichText text={supplementarySuggestions.talentIncubator} className="text-base text-gray-700 leading-relaxed" />
              </div>
            )}
          </div>
        )}

        {/* 利益相关者沟通建议 */}
        {stakeholderAdvice && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SubSectionHeading number={`5.${++subIdx}`} title="利益相关者沟通建议" />
            <RichText text={stakeholderAdvice} className="text-base text-gray-700 leading-loose" />
          </div>
        )}
      </div>
    </div>
  )
}

/** 六、总结与展望 */
function SummarySection({ summary, overallAssessment }: {
  summary: string
  overallAssessment?: string
}) {
  if (!summary && !overallAssessment) return null
  return (
    <div>
      <ChapterHeading number="六、" title="总结与展望" />
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

// ==================== 职业发展核心潜能与路径建议 ====================

/** 星级渲染 */
function StarRating({ rating }: { rating: string }) {
  return <span className="text-base tracking-wider font-bold text-amber-500">{rating}</span>
}

function CareerPathSection({ data }: { data: MidsF2CareerPathAnalysis }) {
  if (!data) return null

  const pathColorMap: Record<string, { bg: string; border: string; label: string }> = {
    '立即继承家业': { bg: 'bg-red-50', border: 'border-red-200', label: '低适配' },
    '自主创业（外部独立）': { bg: 'bg-amber-50', border: 'border-amber-200', label: '中低适配' },
    '选择性就业 / 外部机构历练': { bg: 'bg-green-50', border: 'border-green-200', label: '当前最优解' },
  }

  return (
    <div>
      <ChapterHeading number="" title="职业发展核心潜能与路径建议" />

      <div className="space-y-4">
        {/* 核心潜能诊断 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SubSectionHeading number="" title="核心潜能诊断" />
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-base rounded mb-3">
            {data.corePotentialDiagnosis}
          </div>
          <RichText text={data.corePotentialDescription} className="text-base text-gray-700 leading-loose" />
        </div>

        {/* 三大路径适配度评估 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SubSectionHeading number="" title="三大路径适配度深度评估" />
          <div className="space-y-4">
            {data.pathEvaluations.map((pe, i) => {
              const colors = pathColorMap[pe.path] || { bg: 'bg-gray-50', border: 'border-gray-200', label: '' }
              return (
                <div key={i} className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-base text-gray-800">{pe.path}</h4>
                    <div className="flex items-center gap-2">
                      {colors.label && (
                        <span className="text-base text-gray-500 font-medium">{colors.label}</span>
                      )}
                      <StarRating rating={pe.rating} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
                    <div>
                      <p className="text-base text-gray-500 font-medium mb-1">适配依据</p>
                      <p className="text-gray-700 leading-relaxed">{pe.basis}</p>
                    </div>
                    <div>
                      <p className="text-base text-gray-500 font-medium mb-1">风险提示</p>
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
          <SubSectionHeading number="" title="终极发展路线图（分阶段策略）" />
          <div className="space-y-4">
            {data.roadmap.map((phase, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-indigo-300 pb-4 last:pb-0">
                {/* 时间线圆点 */}
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {phase.timeline}
                  </span>
                  <span className="text-base text-gray-400">{phase.phase}</span>
                </div>
                <h4 className="font-bold text-base text-gray-800 mb-1">{phase.title}</h4>
                <p className="text-base text-gray-700 leading-relaxed mb-2">{phase.goal}</p>
                {phase.recommendation && (
                  <p className="text-base text-gray-600 mb-2">
                    <span className="text-base text-gray-500">推荐去向：</span>
                    {phase.recommendation}
                  </p>
                )}
                {phase.coreTasks && phase.coreTasks.length > 0 && (
                  <ul className="space-y-1">
                    {phase.coreTasks.map((task, j) => (
                      <li key={j} className="text-base text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-400 text-base mt-1">◆</span>
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
          <p className="text-base text-indigo-400 font-medium mb-2">一句话终极结论</p>
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
  userMajor?: string
}

export default function MidsF2ReportPage({ scoreResult, aiReport, reportId, userName, userEducation, userGraduationIntention, userMajor }: MidsF2ReportPageProps) {
  const result = computeMidsF2(scoreResult)

  // 标记 MIDS-F2 上下文，Navbar 据此为"我的测评"链接携带 ?from=mids-f2
  useEffect(() => {
    sessionStorage.setItem('midsf2_context', '1')
    return () => { sessionStorage.removeItem('midsf2_context') }
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-3xl mx-auto">
          <Link to="/history?from=mids-f2" className="text-gray-400 hover:text-gray-600 text-base">← 返回</Link>
          <h1 className="text-base font-bold text-[#1a1a2e]">{aiReport?.userName || userName || '测评用户'} · 发展画像</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        {/* 报告封面 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">家族二代多维创新力量表</h1>
          <p className="text-base text-gray-400 mb-4">MIDS-F2 · 接班人发展画像</p>
          {aiReport && (
            <>
              <p className="text-lg font-bold text-[#1a1a2e]">{aiReport.userName || userName || '测评用户'}</p>
              <p className="text-base text-gray-500 mt-1">
                学历：{aiReport.education || userEducation || '未填写'}
                &nbsp;|&nbsp; 就职意向：{aiReport.graduationIntention || userGraduationIntention || '未填写'}
                &nbsp;|&nbsp; 专业：{aiReport.major || userMajor || '未填写'}
              </p>
              <p className="text-base text-gray-400 mt-1">
                {aiReport.reportDate || ''}
                {aiReport.reportId && <span className="ml-2">报告编号：{aiReport.reportId}</span>}
              </p>
            </>
          )}
        </div>

        {/* 一、认识你自己 */}
        {(aiReport?.frameworkExplanation || aiReport?.uniqueGene) && (
          <FrameworkSection
            uniqueGene={aiReport.uniqueGene}
            text={aiReport.frameworkExplanation || ''}
          />
        )}

        {/* 二、五维雷达图解读 */}
        <OverviewSection
          score={result.totalScore}
          result={result}
          overallAssessment={aiReport?.comprehensiveOverview?.overallAssessment}
          dimensionOverview={aiReport?.dimensionOverview}
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

        {/* 四、木桶原理诊断 */}
        {aiReport?.barrelPrinciple && (
          <BarrelPrincipleSection data={aiReport.barrelPrinciple} />
        )}

        {/* 五、发展建议（个性化版） */}
        {aiReport?.developmentSuggestions && (
          <DevelopmentSuggestionsSection suggestions={aiReport.developmentSuggestions} />
        )}

        {/* 向后兼容：旧版 improvementPlan */}
        {!aiReport?.developmentSuggestions && aiReport?.improvementPlan && (
          <div>
            <ChapterHeading number="五、" title="发展建议" />
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {[
                  { title: '近期行动（0-6个月）', items: aiReport.improvementPlan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
                  { title: '中期规划（6个月-2年）', items: aiReport.improvementPlan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
                  { title: '长期发展（2-5年）', items: aiReport.improvementPlan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
                ].filter(s => s.items && s.items.length > 0).map((s, i) => (
                  <div key={i} className={`border-l-4 rounded-r-xl p-4 ${s.color}`}>
                    <h3 className="font-bold text-base text-[#1a1a2e] mb-2">{s.title}</h3>
                    <ul className="space-y-1">
                      {s.items.map((item: string, j: number) => (
                        <li key={j} className="text-base text-gray-600 flex items-start gap-2">
                          <span className="text-base mt-1">•</span>
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

        {/* 六、总结与展望 */}
        <SummarySection
          summary={aiReport?.summary || ''}
          overallAssessment={undefined}
        />

        {/* 职业发展核心潜能与路径建议（新版） */}
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
                  a.download = `${aiReport?.userName || userName || '测评用户'}_MIDS-F2发展画像_${reportId}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                }).catch(() => alert('下载失败'))
              }}
              className="px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-medium text-base hover:bg-gray-50 text-center"
            >
              📥 下载报告
            </button>
          )}
          <Link
            to="/history?from=mids-f2"
            className="px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-medium text-base text-center hover:bg-gray-50"
          >
            我的报告列表
          </Link>
        </div>
      </main>
    </div>
  )
}
