import type { Questionnaire, ScoreResult } from '../types'

export type ScoringError = { message: string }

/**
 * Computes a ScoreResult from the given answers and questionnaire.
 *
 * Returns a ScoringError if any question has no recorded answer.
 * Supports two scoring rule types:
 *  - 'additive': sums dimension scores across all selected options
 *  - 'categorical': finds the most frequent category among selected options;
 *    in case of a tie, the category with the smallest index in scoring_rule.categories wins.
 */
export function compute(
  answers: Record<string, string>,
  questionnaire: Questionnaire,
): ScoreResult | ScoringError {
  // Step 1: Check completeness — all questions must have an answer
  for (const q of questionnaire.questions) {
    if (!answers[q.id]) {
      return { message: '存在未完成题目，无法提交' }
    }
  }

  // Step 2: Additive scoring
  if (questionnaire.scoring_rule.type === 'additive') {
    const dimensionScores: Record<string, number> = {}

    // Initialize all dimensions to 0
    for (const dim of questionnaire.scoring_rule.dimensions ?? []) {
      dimensionScores[dim.key] = 0
    }

    // Accumulate scores from selected options
    for (const q of questionnaire.questions) {
      const selectedOption = q.options.find(o => o.id === answers[q.id])
      if (selectedOption?.scores) {
        for (const [key, value] of Object.entries(selectedOption.scores)) {
          dimensionScores[key] = (dimensionScores[key] ?? 0) + value
        }
      }
    }

    return {
      questionnaireId: questionnaire.id,
      type: 'additive',
      dimensionScores,
      answeredAt: new Date().toISOString(),
    }
  }

  // Step 3: Categorical scoring
  const frequencies: Record<string, number> = {}

  for (const q of questionnaire.questions) {
    const selectedOption = q.options.find(o => o.id === answers[q.id])
    if (selectedOption?.category) {
      frequencies[selectedOption.category] = (frequencies[selectedOption.category] ?? 0) + 1
    }
  }

  // Find the category with highest frequency;
  // tie-break: use the category with the smallest index in scoring_rule.categories
  let categoryResult = ''
  let maxFreq = -1

  for (const catDef of questionnaire.scoring_rule.categories ?? []) {
    const freq = frequencies[catDef.key] ?? 0
    if (freq > maxFreq) {
      maxFreq = freq
      categoryResult = catDef.key
    }
  }

  return {
    questionnaireId: questionnaire.id,
    type: 'categorical',
    categoryResult,
    categoryFrequencies: frequencies,
    answeredAt: new Date().toISOString(),
  }

  // Step 4: Likert scoring — 每个条目独立 Likert 1-5 分，按维度计算均分
  if (questionnaire.scoring_rule.type === 'likert') {
    const dimensionScores: Record<string, number> = {}
    const dimensionCounts: Record<string, number> = {}

    // 初始化所有维度
    for (const dim of questionnaire.scoring_rule.dimensions ?? []) {
      dimensionScores[dim.key] = 0
      dimensionCounts[dim.key] = 0
    }

    // 累加每个问题的选中选项分值
    for (const q of questionnaire.questions) {
      const selectedOption = q.options.find(o => o.id === answers[q.id])
      const dim = (q as any).dimension as string | undefined
      if (selectedOption?.score !== undefined && dim && dimensionScores[dim] !== undefined) {
        dimensionScores[dim] += selectedOption.score
        dimensionCounts[dim] += 1
      }
    }

    // 计算均分（保留两位小数）
    for (const key of Object.keys(dimensionScores)) {
      if (dimensionCounts[key] > 0) {
        dimensionScores[key] = Math.round((dimensionScores[key] / dimensionCounts[key]) * 100) / 100
      }
    }

    return {
      questionnaireId: questionnaire.id,
      type: 'likert' as any,
      dimensionScores,
      answeredAt: new Date().toISOString(),
    }
  }
}
