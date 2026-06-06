import type { ScoreResult, Questionnaire } from '../types'

/**
 * 构建综合报告的AI Prompt — 输出结构化JSON
 */
export function buildComprehensivePrompt(
  userName: string,
  completedQuestionnaireIds: string[],
  scoreSummary: Record<string, ScoreResult>,
  questionnaires: Questionnaire[]
): string {
  const lines: string[] = []

  lines.push('你是一位资深人才测评专家。请根据以下多维测评数据，生成一份专业的人才综合测评报告。')
  lines.push('')
  lines.push('## 输出要求')
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记（如```json或```），只输出纯JSON。')
  lines.push('')
  lines.push('## JSON结构定义')
  lines.push('{')
  lines.push('  "userName": "用户姓名",')
  lines.push('  "reportDate": "报告日期(YYYY-MM-DD)",')
  lines.push('  "reportId": "报告编号(TAR-YYYY-MMDD-NNN)",')
  lines.push('  "comprehensiveScore": 76.5,  // 综合得分，必须在65-85之间')
  lines.push('  "coreEvaluation": "核心评价，一段话200字以内，正面积极",')
  lines.push('  "coreAdvantages": [')
  lines.push('    { "title": "优势名称", "score": 得分值, "description": "基于数据的简要描述" }')
  lines.push('  ],  // 提炼4-6项核心竞争优势')
  lines.push('  "personalityAnalysis": null,  // 如未做大五人格则为null')
  lines.push('  "leadershipAnalysis": null,')
  lines.push('  "temperamentAnalysis": null,')
  lines.push('  "mbtiAnalysis": null,')
  lines.push('  "sixteenPFAnalysis": null,')
  lines.push('  "creativityAnalysis": null,')
  lines.push('  "hollandAnalysis": null,')
  lines.push('  "careerSuggestions": [')
  lines.push('    { "direction": "职业方向名称", "reason": "基于测评数据的推荐理由" }')
  lines.push('  ],  // 3-4个职业方向')
  lines.push('  "improvementSuggestions": ["建议1", "建议2", "建议3"],  // 3-4条正面表述的能力提升建议')
  lines.push('  "teamRole": {')
  lines.push('    "primary": "主要贝尔宾角色",')
  lines.push('    "secondary": "次要贝尔宾角色",')
  lines.push('    "description": "角色定位描述"')
  lines.push('  },')
  lines.push('  "summary": "整体总结，一段话正面激励"')
  lines.push('}')
  lines.push('')
  lines.push('## 各分析模块的子结构')
  lines.push('')
  lines.push('### personalityAnalysis（大五人格）:')
  lines.push('{')
  lines.push('  "big5": { "openness": 60, "conscientiousness": 58, "extraversion": 62, "agreeableness": 58, "neuroticism": 68 },')
  lines.push('  "big5Interpretation": [')
  lines.push('    { "dimension": "开放性", "score": 60, "interpretation": "解读文字" }')
  lines.push('  ]')
  lines.push('}')
  lines.push('')
  lines.push('### leadershipAnalysis（领导力）:')
  lines.push('{')
  lines.push('  "styles": [')
  lines.push('    { "name": "支持式", "score": 7, "percentage": 58 }')
  lines.push('  ],')
  lines.push('  "interpretation": "领导风格解读"')
  lines.push('}')
  lines.push('')
  lines.push('### temperamentAnalysis（气质类型）:')
  lines.push('{')
  lines.push('  "types": [')
  lines.push('    { "name": "多血质", "score": 19 }')
  lines.push('  ],')
  lines.push('  "dominant": "多血质",')
  lines.push('  "interpretation": "气质解读"')
  lines.push('}')
  lines.push('')
  lines.push('### mbtiAnalysis（MBTI）:')
  lines.push('{')
  lines.push('  "type": "ENFP",')
  lines.push('  "dimensions": { "E": 65, "N": 58, "F": 55, "P": 60 },')
  lines.push('  "interpretation": "MBTI类型解读"')
  lines.push('}')
  lines.push('')
  lines.push('### creativityAnalysis（创造力）:')
  lines.push('{')
  lines.push('  "totalScore": 28,')
  lines.push('  "maxScore": 37,')
  lines.push('  "barriers": ["障碍名称1", "障碍名称2"],')
  lines.push('  "interpretation": "创造力分析解读"')
  lines.push('}')
  lines.push('')
  lines.push('### hollandAnalysis（霍兰德）:')
  lines.push('{')
  lines.push('  "scores": { "R": 12, "I": 18, "A": 22, "S": 25, "E": 20, "C": 10 },')
  lines.push('  "dominantType": "SAE",')
  lines.push('  "interpretation": "职业兴趣解读"')
  lines.push('}')
  lines.push('')
  lines.push('### sixteenPFAnalysis（16PF）:')
  lines.push('{')
  lines.push('  "factors": { "A": 12, "B": 14, "C": 8, "E": 10, "F": 14, "G": 8, "H": 14, "I": 6, "L": 8, "M": 14, "N": 6, "O": 8, "Q1": 14, "Q2": 4, "Q3": 6, "Q4": 8 },')
  lines.push('  "derivedTraits": [')

  // 16PF的8项二元性格特征公式
  lines.push('    {')
  lines.push('      "name": "焦虑性",')
  lines.push('      "formula": "(38 + 2*L + 3*O + 4*Q4 - 2*C - 2*H - 2*Q3) / 10",')
  lines.push('      "score": 0,  // 请按公式计算')
  lines.push('      "level": "低/中/高/极高",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "外向性",')
  lines.push('      "formula": "(2*A + 3*E + 4*F + 5*H - 2*Q2 - 11) / 10",')
  lines.push('      "score": 0,')
  lines.push('      "level": "低/中/高/极高",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "警觉性",')
  lines.push('      "formula": "(77 + 2*L + 2*O + 2*Q4 - 2*A - 2*C - 2*H) / 10",')
  lines.push('      "score": 0,')
  lines.push('      "level": "低/中/高/极高",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "独立性",')
  lines.push('      "formula": "(2*E + 2*M + 2*Q1 + 2*Q2 - 2*A - 2*G) / 10",')
  lines.push('      "score": 0,')
  lines.push('      "level": "低/中/高/极高",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "心理健康因素",')
  lines.push('      "formula": "(C + 2*Q3 + 2*Q4) / 1",')
  lines.push('      "score": 0,')
  lines.push('      "level": "不健康/一般/健康/非常健康",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "专业成就因素",')
  lines.push('      "formula": "(2*Q3 + 2*G + 2*C - 2*M) / 1",')
  lines.push('      "score": 0,')
  lines.push('      "level": "较低/一般/良好/优秀",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "创造能力因素",')
  lines.push('      "formula": "(2*B + 2*M + 2*Q1 - 2*A) / 1",')
  lines.push('      "score": 0,')
  lines.push('      "level": "较低/一般/良好/优秀",')
  lines.push('      "description": "描述"')
  lines.push('    },')
  lines.push('    {')
  lines.push('      "name": "成长能力因素",')
  lines.push('      "formula": "(2*B + 2*G + 2*Q3) / 1",')
  lines.push('      "score": 0,')
  lines.push('      "level": "较低/一般/良好/优秀",')
  lines.push('      "description": "描述"')
  lines.push('    }')
  lines.push('  ],')
  lines.push('  "interpretation": "16PF整体解读"')
  lines.push('}')
  lines.push('')

  lines.push('## 报告风格约束（必须严格遵守）')
  lines.push('1. 语言中性偏正面，绝对不可使用否定性、贬义性词汇描述用户')
  lines.push('2. 用"发展空间"、"提升方向"代替"缺点"、"劣势"')
  lines.push('3. 聚焦优势发现，先讲核心优势，再讲发展潜力')
  lines.push('4. 综合得分必须在65-85分之间')
  lines.push('5. 所有描述必须有数据支撑，不可凭空编造')
  lines.push('6. 只输出用户实际做了的问卷对应的分析字段；未做的问卷对应字段设为 null')
  lines.push('7. 如果用户只做了部分问卷，则只分析对应的维度，但仍要给出综合建议')
  lines.push('8. 16PF的8项二元性格特征必须严格按照给出的公式计算，不得随意赋值')
  lines.push('9. 综合得分根据实际做的问卷数量和得分合理计算')
  lines.push('')

  lines.push('## 测评数据')
  lines.push('')
  lines.push(`用户姓名：${userName}`)
  lines.push(`完成问卷：${completedQuestionnaireIds.join(', ')}`)
  lines.push('')

  // 输出各问卷得分
  for (const qid of completedQuestionnaireIds) {
    const score = scoreSummary[qid]
    if (!score) continue

    const q = questionnaires.find(qq => qq.id === qid)
    const qName = q?.name || qid

    lines.push(`### ${qName}（${qid}）`)
    if (score.type === 'additive' && score.dimensionScores) {
      lines.push('计分类型：维度累加型，各维度得分：')
      const dims = q?.scoring_rule?.dimensions || []
      for (const dim of dims) {
        const val = score.dimensionScores[dim.key] ?? 0
        lines.push(`  ${dim.name}（${dim.key}）：${val}`)
      }
    } else if (score.type === 'categorical') {
      lines.push('计分类型：类别型')
      if (score.categoryResult) {
        lines.push(`主要类型：${score.categoryResult}`)
      }
      if (score.categoryFrequencies) {
        lines.push('各类别频次：')
        for (const [key, freq] of Object.entries(score.categoryFrequencies)) {
          lines.push(`  ${key}：${freq} 次`)
        }
      }
    }
    lines.push('')
  }

  lines.push('请现在输出JSON，不要加任何前缀或后缀。')

  return lines.join('\n')
}

/**
 * 计算综合得分（65-85区间）
 */
export function calculateComprehensiveScore(
  scoreSummary: Record<string, ScoreResult>
): number {
  const scores: number[] = []

  for (const [, result] of Object.entries(scoreSummary)) {
    if (result.type === 'additive' && result.dimensionScores) {
      const values = Object.values(result.dimensionScores)
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        scores.push(avg)
      }
    } else if (result.type === 'categorical') {
      scores.push(72)
    }
  }

  if (scores.length === 0) return 75

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const clamped = Math.max(65, Math.min(85, 65 + (avgScore / 100) * 20))
  return Math.round(clamped * 10) / 10
}

/**
 * 调用AI生成综合报告（已废弃，现在由后端直接调用）
 * 保留供前端降级使用
 */
export async function generateComprehensiveReport(
  userName: string,
  completedQuestionnaireIds: string[],
  scoreSummary: Record<string, ScoreResult>,
  questionnaires: Questionnaire[]
): Promise<string> {
  const prompt = buildComprehensivePrompt(userName, completedQuestionnaireIds, scoreSummary, questionnaires)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  try {
    const response = await fetch('/api/generate-comprehensive-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw { type: 'http_error', status: response.status }
    }

    const data = await response.json() as { content: string }
    const content = data.content

    if (!content || content.length < 50) {
      throw { type: 'empty_response' }
    }

    return content
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw { type: 'timeout' }
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
