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

// ==================== 兰大专属综合评分 ====================

export interface LZUComprehensiveResult {
  totalScore: number
  grade: string
  gradeDescription: string
  breakdown: {
    leadership: number
    personality: number
    creativityBarrier: number
  }
  adaptabilityIndex: number
  adaptabilityLevel: string
  leadership: {
    s1: number; s2: number; s3: number; s4: number
    dominantStyle: string
  }
  personality: {
    creativityPotential: { raw: number; standard: number; level: string }
    mentalHealth: { raw: number; standard: number; level: string }
    managementPotential: { raw: number; standard: number; level: string }
  }
  creativityBarrier: {
    psychological: { score: number; max: number; level: string }
    cognitive: { score: number; max: number; level: string }
    environmental: { score: number; max: number; level: string }
    primaryBarrierType: string
  }
}

/**
 * 计算兰大综合测评得分（0-100分制）
 * 权重：领导风格30% + 人格特质40% + 创造力障碍30%
 */
export function calculateLZUComprehensiveScore(
  scoreSummary: Record<string, ScoreResult>
): LZUComprehensiveResult {
  const result: LZUComprehensiveResult = {
    totalScore: 0,
    grade: '待发展型',
    gradeDescription: '',
    breakdown: { leadership: 0, personality: 0, creativityBarrier: 0 },
    adaptabilityIndex: 0,
    adaptabilityLevel: '',
    leadership: { s1: 0, s2: 0, s3: 0, s4: 0, dominantStyle: '' },
    personality: {
      creativityPotential: { raw: 0, standard: 5, level: '中等' },
      mentalHealth: { raw: 0, standard: 5, level: '中等' },
      managementPotential: { raw: 0, standard: 5, level: '中等' },
    },
    creativityBarrier: {
      psychological: { score: 0, max: 16, level: '中障碍' },
      cognitive: { score: 0, max: 12, level: '中障碍' },
      environmental: { score: 0, max: 20, level: '中障碍' },
      primaryBarrierType: '',
    },
  }

  // ---- 领导风格得分 (30%) ----
  const leadershipScore = scoreSummary['lzu-leadership']
  if (leadershipScore?.type === 'additive' && leadershipScore.dimensionScores) {
    const { S1 = 0, S2 = 0, S3 = 0, S4 = 0 } = leadershipScore.dimensionScores
    result.leadership = { s1: S1, s2: S2, s3: S3, s4: S4, dominantStyle: '' }

    // 主导风格
    const styles = [
      { name: '指令型（S1）', score: S1 }, { name: '教练型（S2）', score: S2 },
      { name: '支持型（S3）', score: S3 }, { name: '授权型（S4）', score: S4 },
    ]
    styles.sort((a, b) => b.score - a.score)
    result.leadership.dominantStyle = styles[0].name
    if (styles[1].score === styles[0].score) {
      result.leadership.dominantStyle += ' / ' + styles[1].name
    }

    // 情境适应性指数 = 标准差
    const values = [S1, S2, S3, S4]
    const mean = values.reduce((a, b) => a + b, 0) / 4
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 4
    const std = Math.sqrt(variance)
    result.adaptabilityIndex = Math.round(std * 100) / 100

    const maxStd = 5.2
    const adaptabilityScore = Math.max(0, Math.min(100, (1 - std / maxStd) * 100))
    result.breakdown.leadership = Math.round(adaptabilityScore * 0.30 * 10) / 10

    if (std < 1.5) result.adaptabilityLevel = '强'
    else if (std < 3.0) result.adaptabilityLevel = '一般'
    else result.adaptabilityLevel = '需提升'
  }

  // ---- 人格特质得分 (40%) ----
  const personalityScore = scoreSummary['lzu-personality']
  if (personalityScore?.type === 'additive' && personalityScore.dimensionScores) {
    const cp = personalityScore.dimensionScores['creativity_potential'] ?? 0
    const mh = personalityScore.dimensionScores['mental_health'] ?? 0
    const mp = personalityScore.dimensionScores['management_potential'] ?? 0

    result.personality.creativityPotential = {
      raw: cp, standard: rawToStandard(cp, 10), level: standardToLevel(rawToStandard(cp, 10)),
    }
    result.personality.mentalHealth = {
      raw: mh, standard: rawToStandard(mh, 10), level: standardToLevel(rawToStandard(mh, 10)),
    }
    result.personality.managementPotential = {
      raw: mp, standard: rawToStandard(mp, 10), level: standardToLevel(rawToStandard(mp, 10)),
    }

    const cpNorm = (cp / 10) * 100
    const mhNorm = (mh / 10) * 100
    const mpNorm = (mp / 10) * 100
    const personalityComposite = cpNorm * 0.40 + mhNorm * 0.30 + mpNorm * 0.30
    result.breakdown.personality = Math.round(personalityComposite * 0.40 * 10) / 10
  }

  // ---- 创造力障碍得分 (30%，反向计分) ----
  const barrierScore = scoreSummary['lzu-creativity']
  if (barrierScore?.type === 'additive' && barrierScore.dimensionScores) {
    const psy = barrierScore.dimensionScores['psychological_barrier'] ?? 0
    const cog = barrierScore.dimensionScores['cognitive_barrier'] ?? 0
    const env = barrierScore.dimensionScores['environmental_barrier'] ?? 0

    result.creativityBarrier.psychological = {
      score: psy, max: 16, level: barrierLevel(psy, 12, 6),
    }
    result.creativityBarrier.cognitive = {
      score: cog, max: 12, level: barrierLevel(cog, 9, 5),
    }
    result.creativityBarrier.environmental = {
      score: env, max: 20, level: barrierLevel(env, 15, 8),
    }

    const psyNorm = (psy / 16) * 100
    const cogNorm = (cog / 12) * 100
    const envNorm = (env / 20) * 100
    const barrierComposite = (psyNorm + cogNorm + envNorm) / 3
    result.breakdown.creativityBarrier = Math.round(barrierComposite * 0.30 * 10) / 10

    const barriers = [
      { type: '心理障碍', score: psyNorm },
      { type: '认知障碍', score: cogNorm },
      { type: '环境与资源障碍', score: envNorm },
    ]
    barriers.sort((a, b) => a.score - b.score)
    result.creativityBarrier.primaryBarrierType = barriers[0].type
  }

  // ---- 综合总分 ----
  result.totalScore = Math.round(
    result.breakdown.leadership +
    result.breakdown.personality +
    result.breakdown.creativityBarrier
  )

  // ---- 等级评定 ----
  if (result.totalScore >= 90) {
    result.grade = '卓越型'
    result.gradeDescription = '领导力、人格素质与创造力俱佳'
  } else if (result.totalScore >= 75) {
    result.grade = '进取型'
    result.gradeDescription = '具备良好的发展潜力'
  } else if (result.totalScore >= 60) {
    result.grade = '成长型'
    result.gradeDescription = '有明确的可提升空间'
  } else {
    result.grade = '待发展型'
    result.gradeDescription = '需系统性的能力建设'
  }

  return result
}

/**
 * 原始分转标准分（1-10分制）
 */
function rawToStandard(raw: number, maxRaw: number): number {
  const ratio = raw / maxRaw
  if (ratio <= 0.2) return 1 + Math.round(ratio / 0.2 * 1)
  if (ratio <= 0.4) return 3 + Math.round((ratio - 0.2) / 0.2 * 1)
  if (ratio <= 0.6) return 5 + Math.round((ratio - 0.4) / 0.2 * 1)
  if (ratio <= 0.8) return 7 + Math.round((ratio - 0.6) / 0.2 * 1)
  return 9 + Math.round(Math.min(1, (ratio - 0.8) / 0.2))
}

/**
 * 标准分转评价等级
 */
function standardToLevel(standard: number): string {
  if (standard >= 9) return '优秀'
  if (standard >= 7) return '良好'
  if (standard >= 5) return '中等'
  if (standard >= 3) return '稍低'
  return '较低'
}

/**
 * 障碍程度判定
 */
function barrierLevel(score: number, highThreshold: number, lowThreshold: number): string {
  if (score >= highThreshold) return '低障碍'
  if (score >= lowThreshold) return '中障碍'
  return '高障碍'
}

// 心理障碍：低于6分=高障碍, 6-11=中障碍, 12-16=低障碍
// 认知障碍：低于5分=高障碍, 5-8=中障碍, 9-12=低障碍
// 环境障碍：低于8分=高障碍, 8-14=中障碍, 15-20=低障碍

/**
 * 构建兰大专属综合报告AI Prompt
 */
export function buildLZUReportPrompt(
  userName: string,
  scoreSummary: Record<string, ScoreResult>,
  comprehensiveResult: LZUComprehensiveResult
): string {
  const lines: string[] = []

  lines.push('你是一位资深人才测评专家，专门为兰州大学管理学院研究生提供职业发展测评服务。请根据以下测评数据，生成一份专业的人才综合测评报告。')
  lines.push('')
  lines.push('## 输出要求')
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记（如```json或```），只输出纯JSON。')
  lines.push('')
  lines.push('## JSON结构定义')
  lines.push('{')
  lines.push('  "comprehensiveScore": 85.5,')
  lines.push('  "grade": "进取型",')
  lines.push('  "gradeDescription": "具备良好的发展潜力",')
  lines.push('  "coreEvaluation": "核心评价，一段话200字以内，正面积极",')
  lines.push('  "coreAdvantages": [')
  lines.push('    { "title": "优势名称", "score": 得分值, "description": "基于数据的简要描述" }')
  lines.push('  ],')
  lines.push('  "leadershipAnalysis": {')
  lines.push('    "s1Score": 3, "s2Score": 5, "s3Score": 3, "s4Score": 1,')
  lines.push('    "dominantStyle": "教练型（S2）",')
  lines.push('    "adaptabilityIndex": 1.71,')
  lines.push('    "adaptabilityLevel": "较强",')
  lines.push('    "interpretation": "领导风格解读文字"')
  lines.push('  },')
  lines.push('  "personalityAnalysis": {')
  lines.push('    "creativityPotential": { "raw": 8, "standard": 8, "level": "良好" },')
  lines.push('    "mentalHealth": { "raw": 7, "standard": 7, "level": "良好" },')
  lines.push('    "managementPotential": { "raw": 9, "standard": 9, "level": "优秀" },')
  lines.push('    "interpretation": "人格特质整体解读文字",')
  lines.push('    "creativity_detail": "创造力潜质详细分析（80-120字，含行为锚定+1条✔建议）",')
  lines.push('    "mentalHealth_detail": "心理健康详细分析（80-120字，含行为锚定+1条✔建议）",')
  lines.push('    "managementPotential_detail": "管理潜能详细分析（80-120字，含行为锚定+1条✔建议）"')
  lines.push('  },')
  lines.push('  "creativityBarrierAnalysis": {')
  lines.push('    "psychologicalBarrier": { "score": 12, "max": 16, "level": "低障碍" },')
  lines.push('    "cognitiveBarrier": { "score": 7, "max": 12, "level": "中障碍" },')
  lines.push('    "environmentalBarrier": { "score": 14, "max": 20, "level": "中障碍" },')
  lines.push('    "primaryBarrierType": "认知障碍",')
  lines.push('    "interpretation": "创造力障碍整体解读文字",')
  lines.push('    "suggestions": ["突破建议1", "突破建议2"],')
  lines.push('    "psychological_detail": "心理障碍详细分析（80-120字，含1条✔建议）",')
  lines.push('    "cognitive_detail": "认知障碍详细分析（80-120字，含1条✔建议）",')
  lines.push('    "environmental_detail": "环境障碍详细分析（80-120字，含1条✔建议）"')
  lines.push('  },')
  lines.push('  "careerSuggestions": [')
  lines.push('    { "direction": "企业管理（运营/执行）", "matchLevel": "★★★★★", "reason": "推荐理由" }')
  lines.push('  ],')
  lines.push('  "improvementPlan": {')
  lines.push('    "shortTerm": ["0-6个月：具体行动1", "0-6个月：具体行动2"],')
  lines.push('    "midTerm": ["6个月-2年：具体行动1"],')
  lines.push('    "longTerm": ["2-5年：具体行动1"]')
  lines.push('  },')
  lines.push('  "summary": "整体总结，一段话正面激励"')
  lines.push('}')
  lines.push('')
  lines.push('## 报告风格约束')
  lines.push('1. 语言中性偏正面，绝对不可使用否定性、贬义性词汇')
  lines.push('2. 用"发展空间"、"提升方向"代替"缺点"、"劣势"')
  lines.push('3. 聚焦优势发现，先讲核心优势，再讲发展潜力')
  lines.push('4. 所有描述必须有数据支撑，不可凭空编造')
  lines.push('5. 职业建议需结合管理类研究生的特点（企业管理、创业、咨询、公共管理等方向）')
  lines.push('6. 核心优势提炼4-6项')
  lines.push('7. 职业建议提供3-4个方向')
  lines.push('8. 提升计划分短期（0-6月）、中期（6月-2年）、长期（2-5年）三个阶段')
  lines.push('')
  lines.push('## 领导风格解读要点')
  lines.push('- 指令型(S1)高分：适合带领经验不足的团队，需注意适度授权')
  lines.push('- 教练型(S2)高分：既注重任务也关注下属成长，适合团队建设期')
  lines.push('- 支持型(S3)高分：善于营造支持性氛围，有利于团队凝聚力')
  lines.push('- 授权型(S4)高分：信任下属并能充分授权，适合管理成熟团队')
  lines.push('- 情境适应性：各风格得分越均衡，说明情境适应能力越强')
  lines.push('')
  lines.push('## 标准分转换参考')
  lines.push('原始分0-2→标准分1-2(较低), 3-4→3-4(稍低), 5-6→5-6(中等), 7-8→7-8(良好), 9-10→9-10(优秀)')
  lines.push('')
  lines.push('## 障碍程度参考')
  lines.push('- 心理障碍(满分16)：12-16低障碍, 6-11中障碍, 低于6高障碍')
  lines.push('- 认知障碍(满分12)：9-12低障碍, 5-8中障碍, 低于5高障碍')
  lines.push('- 环境障碍(满分20)：15-20低障碍, 8-14中障碍, 低于8高障碍')
  lines.push('注意：得分越高表示障碍越少，创造力发挥越顺畅')
  lines.push('')

  lines.push('## 测评数据')
  lines.push('')
  lines.push(`用户姓名：${userName}`)
  lines.push(`综合得分：${comprehensiveResult.totalScore}`)
  lines.push(`评定等级：${comprehensiveResult.grade} - ${comprehensiveResult.gradeDescription}`)
  lines.push('')

  // 领导风格数据
  const ls = scoreSummary['lzu-leadership']
  if (ls?.type === 'additive' && ls.dimensionScores) {
    lines.push('### 领导风格问卷（LASI）')
    lines.push(`S1指令型：${ls.dimensionScores['S1'] ?? 0} / 7`)
    lines.push(`S2教练型：${ls.dimensionScores['S2'] ?? 0} / 12`)
    lines.push(`S3支持型：${ls.dimensionScores['S3'] ?? 0} / 12`)
    lines.push(`S4授权型：${ls.dimensionScores['S4'] ?? 0} / 12`)
    lines.push(`情境适应性指数（标准差）：${comprehensiveResult.adaptabilityIndex}`)
    lines.push(`适应性等级：${comprehensiveResult.adaptabilityLevel}`)
    lines.push('')
  }

  // 人格特质数据
  const ps = scoreSummary['lzu-personality']
  if (ps?.type === 'additive' && ps.dimensionScores) {
    const cpRaw = ps.dimensionScores['creativity_potential'] ?? 0
    const mhRaw = ps.dimensionScores['mental_health'] ?? 0
    const mpRaw = ps.dimensionScores['management_potential'] ?? 0
    lines.push('### 16PF人格测验（精选版）')
    lines.push(`创造力潜质：原始分${cpRaw}/10，标准分${rawToStandard(cpRaw, 10)}，${standardToLevel(rawToStandard(cpRaw, 10))}`)
    lines.push(`心理健康：原始分${mhRaw}/10，标准分${rawToStandard(mhRaw, 10)}，${standardToLevel(rawToStandard(mhRaw, 10))}`)
    lines.push(`管理潜能：原始分${mpRaw}/10，标准分${rawToStandard(mpRaw, 10)}，${standardToLevel(rawToStandard(mpRaw, 10))}`)
    lines.push('')
  }

  // 创造力障碍数据
  const cs = scoreSummary['lzu-creativity']
  if (cs?.type === 'additive' && cs.dimensionScores) {
    const psyScore = cs.dimensionScores['psychological_barrier'] ?? 0
    const cogScore = cs.dimensionScores['cognitive_barrier'] ?? 0
    const envScore = cs.dimensionScores['environmental_barrier'] ?? 0
    lines.push('### 创造力障碍测试')
    lines.push(`心理障碍：${psyScore}/16（${barrierLevel(psyScore, 12, 6)}）`)
    lines.push(`认知障碍：${cogScore}/12（${barrierLevel(cogScore, 9, 5)}）`)
    lines.push(`环境与资源障碍：${envScore}/20（${barrierLevel(envScore, 15, 8)}）`)
    lines.push('注意：得分越高表示障碍越少')
    lines.push('')
  }

  lines.push('请现在输出JSON，不要加任何前缀或后缀。')

  return lines.join('\n')
}
