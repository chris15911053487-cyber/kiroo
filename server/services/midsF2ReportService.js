/**
 * MIDS-F2 AI 报告生成服务
 * 调用 DeepSeek 生成维度解读和发展建议
 */

const MIDS_DIMENSION_NAMES = {
  strategic_breakthrough: '战略破局力',
  execution_disruption: '执行颠覆力',
  resource_integration: '资源整合力',
  adversity_quotient: '逆商与灰度',
  ethics_vision: '伦理与格局',
};

const DECISION_PATH_INFO = {
  leading_succession: { emoji: '🏆', label: '领军接班', logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。' },
  independent_startup: { emoji: '🚀', label: '独立创业', logic: '理念超前但受限于家族产业属性难以施展，或家族内耗严重，适合脱离体系外部创业。' },
  functional_employment: { emoji: '💼', label: '职能就业', logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等岗位。' },
  further_study: { emoji: '📚', label: '深造蓄力', logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验。' },
};

/**
 * 构建 MIDS-F2 报告的 AI Prompt
 */
function buildMidsF2Prompt(dimensionScores, midsF2Result, userName) {
  const lines = [];

  lines.push('你是一位资深家族企业传承与人才测评专家。请根据以下 MIDS-F2（家族二代多维创新力量表）测评数据，生成一份专业、个性化的测评解读报告。');
  lines.push('');
  lines.push('## 输出要求');
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记（如```json或```），只输出纯JSON。');
  lines.push('');
  lines.push('## JSON结构定义');
  lines.push('{');
  lines.push('  "comprehensiveScore": 75.5,');
  lines.push('  "coreEvaluation": "核心评价，一段话150-200字，正面积极，概述测评对象的创新力画像",');
  lines.push('  "dimensionInsights": [');
  lines.push('    {');
  lines.push('      "dimensionKey": "strategic_breakthrough",');
  lines.push('      "interpretation": "维度解读文字（80-120字），结合得分给出具体分析",');
  lines.push('      "suggestion": "该维度的具体提升建议（20-40字），以✔开头"');
  lines.push('    }');
  lines.push('  ],');
  lines.push('  "careerSuggestions": [');
  lines.push('    { "direction": "职业方向名称", "reason": "基于数据的推荐理由" }');
  lines.push('  ],');
  lines.push('  "improvementPlan": {');
  lines.push('    "shortTerm": ["0-6个月：具体行动1", "0-6个月：具体行动2"],');
  lines.push('    "midTerm": ["6个月-2年：具体行动1"],');
  lines.push('    "longTerm": ["2-5年：具体行动1"]');
  lines.push('  },');
  lines.push('  "summary": "整体总结与寄语，一段话正面激励（100-150字）"');
  lines.push('}');
  lines.push('');
  lines.push('## 报告风格约束');
  lines.push('1. 语言中性偏正面，绝对不可使用否定性、贬义性词汇');
  lines.push('2. 用"发展空间"、"提升方向"代替"缺点"、"劣势"');
  lines.push('3. 聚焦优势发现，先讲核心优势，再讲发展潜力');
  lines.push('4. 所有描述必须有数据支撑，不可凭空编造');
  lines.push('5. 每个维度的 interpretation 必须引用具体得分并给出分析');
  lines.push('6. 结合家族企业传承的实际场景给出建议');
  lines.push('');
  lines.push('## 测评数据');
  lines.push('');
  lines.push(`测评对象：${userName || '测评用户'}`);
  lines.push(`综合总分：${midsF2Result.totalScore}/100`);
  lines.push(`决策路径：${DECISION_PATH_INFO[midsF2Result.decisionPath]?.label || '进一步评估'}`);
  lines.push('');
  lines.push('### 各维度均分（满分5分）：');
  for (const [key, value] of Object.entries(dimensionScores)) {
    const name = MIDS_DIMENSION_NAMES[key] || key;
    lines.push(`  ${name}：${Number(value).toFixed(1)} / 5`);
  }
  lines.push('');
  lines.push('### S-P-F 矩阵：');
  lines.push(`  S（战略破局力）= ${midsF2Result.sScore.toFixed(1)} ${midsF2Result.sScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  P（执行颠覆力）= ${midsF2Result.pScore.toFixed(1)} ${midsF2Result.pScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  F（资源匹配度）= ${midsF2Result.fScore.toFixed(1)} ${midsF2Result.fScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  推荐路径：${DECISION_PATH_INFO[midsF2Result.decisionPath]?.label || '进一步评估'}`);
  lines.push('');
  if (midsF2Result.warnings.length > 0) {
    lines.push('### ⚠️ 特别警示：');
    midsF2Result.warnings.forEach(w => lines.push(`  ${w}`));
    lines.push('');
  }
  lines.push('请现在输出JSON，不要加任何前缀或后缀。');

  return lines.join('\n');
}

/**
 * 构建降级占位文字（AI不可用时使用）
 */
function buildFallbackReport(dimensionScores, midsF2Result, userName) {
  const name = userName || '测评用户';
  const dims = ['strategic_breakthrough', 'execution_disruption', 'resource_integration', 'adversity_quotient', 'ethics_vision'];

  const dimensionInsights = dims.map(key => {
    const score = Number(dimensionScores[key] || 0).toFixed(1);
    const dimName = MIDS_DIMENSION_NAMES[key];
    const level = score >= 4 ? '表现出色' : score >= 3 ? '处于中等偏上水平' : '有较大发展空间';
    return {
      dimensionKey: key,
      interpretation: `${dimName}维度得分为${score}/5，${level}。该维度反映了测评对象在${dimName}方面的现有水平和发展潜力。`,
      suggestion: `建议结合360度反馈进一步验证该维度表现。`,
    };
  });

  const dec = DECISION_PATH_INFO[midsF2Result.decisionPath] || DECISION_PATH_INFO.further_study;

  return {
    comprehensiveScore: midsF2Result.totalScore,
    coreEvaluation: `${name}在MIDS-F2量表测评中综合得分${midsF2Result.totalScore}分，推荐路径为"${dec.label}"。S-P-F三维分析显示其在家族企业传承中有明确的发展定位。`,
    dimensionInsights,
    improvementPlan: {
      shortTerm: ['深入了解家族企业各业务板块', '参与行业交流拓展视野'],
      midTerm: ['系统学习企业管理知识', '积累跨部门协作经验'],
      longTerm: ['明确个人发展路径并持续深耕'],
    },
    summary: `${name}的MIDS-F2测评展现了其在家族企业创新与传承中的独特潜力。建议持续关注各维度的均衡发展，在实践中不断验证和调整发展方向。`,
    userName: name,
    reportDate: new Date().toISOString().split('T')[0],
    reportId: `MIDS-${Date.now().toString(36).toUpperCase()}`,
  };
}

/**
 * 调用 DeepSeek API 生成 AI 解读
 */
async function callAI(dimensionScores, midsF2Result, userName) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 30) {
    console.warn('[MIDS-F2] DEEPSEEK_API_KEY not configured, using fallback');
    return null;
  }

  const prompt = buildMidsF2Prompt(dimensionScores, midsF2Result, userName);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[MIDS-F2] DeepSeek API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content || content.length < 50) {
      console.error('[MIDS-F2] Empty or too short AI response');
      return null;
    }

    return content;
  } catch (err) {
    console.error('[MIDS-F2] AI call error:', err.message);
    return null;
  }
}

/**
 * 解析 AI 返回的 JSON 或降级
 */
function parseAIResponse(raw, dimensionScores, midsF2Result, userName) {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.coreEvaluation && Array.isArray(parsed.dimensionInsights)) {
        return parsed;
      }
    } catch {
      console.warn('[MIDS-F2] Failed to parse AI JSON, using fallback');
    }
  }
  return buildFallbackReport(dimensionScores, midsF2Result, userName);
}

/**
 * 主入口：生成 MIDS-F2 报告
 */
async function generateMidsF2Report({ dimensionScores, midsF2Result, userName }) {
  const aiRaw = await callAI(dimensionScores, midsF2Result, userName);
  const report = parseAIResponse(aiRaw, dimensionScores, midsF2Result, userName);

  return {
    ...report,
    reportType: 'mids-f2',
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

module.exports = { generateMidsF2Report };
