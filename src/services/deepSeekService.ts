import type { AssessmentReport, Questionnaire, ScoreResult } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export function buildPrompt(scoreResult: ScoreResult, questionnaire: Questionnaire): string {
  const lines: string[] = []

  lines.push(`你是一位专业的心理测评分析师。请根据以下测评结果，生成一份详细的个性化分析报告。`)
  lines.push(``)
  lines.push(`测评名称：${questionnaire.name}`)
  lines.push(`测评说明：${questionnaire.description}`)
  lines.push(``)
  lines.push(`【测评结果数据】`)

  if (scoreResult.type === 'additive' && scoreResult.dimensionScores) {
    lines.push(`计分类型：累加型（各维度得分）`)
    lines.push(``)
    lines.push(`各维度得分：`)
    const dimensions = questionnaire.scoring_rule.dimensions ?? []
    for (const dim of dimensions) {
      const score = scoreResult.dimensionScores[dim.key] ?? 0
      const min = dim.min ?? 0
      const max = dim.max ?? 100
      lines.push(`  - ${dim.name}（${dim.key}）：${score} 分（范围 ${min}–${max}）`)
    }
  } else if (scoreResult.type === 'categorical') {
    lines.push(`计分类型：类别型`)
    lines.push(``)

    const categories = questionnaire.scoring_rule.categories ?? []
    const winnerCat = categories.find(c => c.key === scoreResult.categoryResult)
    if (winnerCat) {
      lines.push(`主要类型：${winnerCat.name}（${winnerCat.key}）`)
      if (winnerCat.description) {
        lines.push(`类型描述：${winnerCat.description}`)
      }
    }

    if (scoreResult.categoryFrequencies && Object.keys(scoreResult.categoryFrequencies).length > 0) {
      lines.push(``)
      lines.push(`各类别选择频次：`)
      for (const catDef of categories) {
        const freq = scoreResult.categoryFrequencies[catDef.key] ?? 0
        if (freq > 0) {
          lines.push(`  - ${catDef.name}（${catDef.key}）：${freq} 次`)
        }
      }
    }
  }

  lines.push(``)
  lines.push(`【报告要求】`)
  lines.push(`请撰写一份不少于200字的个性化测评报告，包含以下两个部分：`)
  lines.push(``)
  lines.push(`第一部分 - AI 分析（占报告的前半部分）：`)
  lines.push(`  根据上述测评数据，深入分析被测者的人格特征、行为模式和心理倾向。`)
  lines.push(`  结合各维度/类别的特点，提供客观、具体的描述。`)
  lines.push(``)
  lines.push(`第二部分 - 个人建议（占报告的后半部分）：`)
  lines.push(`  针对测评结果，提供3-5条具体可行的个人发展建议。`)
  lines.push(`  包括如何发挥优势、改善不足，以及在工作和生活中的应用方向。`)
  lines.push(``)
  lines.push(`请直接输出报告内容，不要添加额外说明。`)

  return lines.join('\n')
}

export async function generateReport(
  scoreResult: ScoreResult,
  questionnaire: Questionnaire,
): Promise<AssessmentReport> {
  const prompt = buildPrompt(scoreResult, questionnaire)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const response = await fetch(`${API_BASE}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw { type: 'http_error', status: response.status }
    }

    const data = await response.json() as { content: string }
    const content = data.content

    if (!content || content.length < 100) {
      throw { type: 'empty_response' }
    }

    const lines = content.split('\n').filter((l: string) => l.trim())
    const mid = Math.ceil(lines.length / 2)
    const aiAnalysis = lines.slice(0, mid).join('\n')
    const suggestions =
      lines.slice(mid).join('\n') ||
      '建议您根据以上分析结果，积极发展自身优势，关注需要改进的方面，持续学习和成长。'

    return {
      questionnaireName: questionnaire.name,
      scoreResult,
      aiAnalysis,
      suggestions,
      generatedAt: new Date().toISOString(),
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw { type: 'timeout' }
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
