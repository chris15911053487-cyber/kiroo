// ==================== MIDS-F2 计分服务 ====================

/** MIDS-F2 五维度 key 常量 */
export const MIDS_DIMENSION_KEYS = [
  'strategic_breakthrough',
  'execution_disruption',
  'resource_integration',
  'adversity_quotient',
  'ethics_vision',
] as const

export const MIDS_DIMENSION_NAMES: Record<string, string> = {
  strategic_breakthrough: '战略破局力',
  execution_disruption: '执行颠覆力',
  resource_integration: '资源整合力',
  adversity_quotient: '逆商与灰度',
  ethics_vision: '伦理与格局',
}

export type DecisionPath =
  | 'leading_succession'
  | 'independent_startup'
  | 'functional_employment'
  | 'further_study'

export const DECISION_PATH_LABELS: Record<DecisionPath, { emoji: string; label: string; logic: string }> = {
  leading_succession: {
    emoji: '🏆',
    label: '领军接班',
    logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。',
  },
  independent_startup: {
    emoji: '🚀',
    label: '独立创业',
    logic: '理念超前但受限于家族产业属性（如传统制造业）难以施展，或家族内耗严重，适合脱离体系外部创业。',
  },
  functional_employment: {
    emoji: '💼',
    label: '职能就业',
    logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等技术或管理岗位。',
  },
  further_study: {
    emoji: '📚',
    label: '深造蓄力',
    logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验，再图回归或创业。',
  },
}

export interface MidsF2Result {
  dimensionAverages: Record<string, number>
  totalScore: number
  sScore: number
  pScore: number
  fScore: number
  decisionPath: DecisionPath
  decisionLabel: string
  decisionEmoji: string
  decisionLogic: string
  warnings: string[]
}

/**
 * 根据维度均分计算 MIDS-F2 综合结果
 *
 * @param dimensionScores — 各维度的均分 (1-5 范围)，由 scoringEngine compute 返回
 */
export function computeMidsF2(dimensionScores: Record<string, number>): MidsF2Result {
  const D1 = dimensionScores['strategic_breakthrough'] ?? 0
  const D2 = dimensionScores['execution_disruption'] ?? 0
  const D3 = dimensionScores['resource_integration'] ?? 0
  const D4 = dimensionScores['adversity_quotient'] ?? 0
  const D5 = dimensionScores['ethics_vision'] ?? 0

  // 综合总分 (20-100)
  const totalScore = Math.round((D1 + D2 + D3 + D4 + D5) * 4 * 10) / 10

  // S-P-F 三维模型
  const THRESHOLD = 3.5
  const sScore = D1
  const pScore = D2
  const fScore = Math.round(((D3 + D4 + D5) / 3) * 100) / 100

  const sHigh = sScore >= THRESHOLD
  const pHigh = pScore >= THRESHOLD
  const fHigh = fScore >= THRESHOLD

  // 决策矩阵
  let decisionPath: DecisionPath
  if (sHigh && pHigh && fHigh) {
    decisionPath = 'leading_succession'
  } else if (sHigh && !pHigh && !fHigh) {
    decisionPath = 'independent_startup'
  } else if (!sHigh && pHigh && fHigh) {
    decisionPath = 'functional_employment'
  } else {
    decisionPath = 'further_study'
  }

  const decisionMeta = DECISION_PATH_LABELS[decisionPath]

  // 特别警示
  const warnings: string[] = []
  if (D4 < 2.5) {
    warnings.push(
      '逆商维度得分低于2.5：心理韧性不足，难以应对传承过程中的复杂人际关系和改革阵痛，建议暂缓独立决策，先通过实践磨练心力。'
    )
  }
  if (D5 < 3) {
    warnings.push(
      '伦理与格局维度得分低于3：若缺乏责任感和伦理约束，创新力越强，对企业的"破坏力"（如盲目多元化、合规风险）可能越大，建议暂缓赋予重权。'
    )
  }

  return {
    dimensionAverages: {
      strategic_breakthrough: D1,
      execution_disruption: D2,
      resource_integration: D3,
      adversity_quotient: D4,
      ethics_vision: D5,
    },
    totalScore,
    sScore,
    pScore,
    fScore,
    decisionPath,
    decisionLabel: decisionMeta.label,
    decisionEmoji: decisionMeta.emoji,
    decisionLogic: decisionMeta.logic,
    warnings,
  }
}
