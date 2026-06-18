/**
 * MIDS-F2 AI 报告生成服务
 * 调用 DeepSeek 生成维度解读和发展建议
 *
 * 提示词模板：docs/report-system/mids-f2/prompt.md
 * 修改报告内容只需编辑该文件，无需改代码。
 */

const fs = require('fs');
const path = require('path');

const MIDS_DIMENSION_NAMES = {
  strategic_breakthrough: '战略破局力',
  execution_disruption: '执行颠覆力',
  resource_integration: '资源整合力',
  adversity_quotient: '逆商与灰度',
  ethics_vision: '伦理与格局',
};

const MIDS_DIMENSION_TIERS = {
  strategic_breakthrough: '顶层·方向感',
  execution_disruption: '中层·落地感',
  resource_integration: '中层·落地感',
  adversity_quotient: '底层·根基感',
  ethics_vision: '底层·根基感',
};

const MIDS_DIMENSION_ORDER = [
  'strategic_breakthrough',
  'execution_disruption',
  'resource_integration',
  'adversity_quotient',
  'ethics_vision',
];

const DECISION_PATH_INFO = {
  leading_succession: { emoji: '🏆', label: '领军接班', logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。' },
  independent_startup: { emoji: '🚀', label: '独立创业', logic: '理念超前但受限于家族产业属性难以施展，或家族内耗严重，适合脱离体系外部创业。' },
  functional_employment: { emoji: '💼', label: '职能就业', logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等岗位。' },
  further_study: { emoji: '📚', label: '深造蓄力', logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验。' },
};

// ==================== 工具函数 ====================

/**
 * 解析项目根目录下的文件路径，兼容本地开发和 Docker 两种环境
 *
 * 本地开发：server/services/midsF2ReportService.js → ../../docs/ → project/docs/
 * Docker：  COPY server/ ./  将 server/ 内容平铺到 /app/
 *           /app/services/midsF2ReportService.js → ../docs/ → /app/docs/
 */
function resolveProjectPath(...segments) {
  const dockerPath = path.join(__dirname, '..', ...segments);
  if (fs.existsSync(dockerPath)) return dockerPath;
  const localPath = path.join(__dirname, '..', '..', ...segments);
  return localPath;
}

function getScoreLevel(score) {
  if (score >= 4.5) return '卓越';
  if (score >= 3.5) return '良好';
  if (score >= 2.5) return '基础';
  return '待开发';
}

function getSPFRating(score) {
  if (score >= 3.5) return '高';
  if (score >= 2.5) return '中';
  return '低';
}

// ==================== 提示词模板系统 ====================

const HARDCODED_MIDS_F2_TEMPLATE = `# MIDS-F2 测评报告生成提示词

你是一个善于观察人的人。你要为一位家族企业二代写一份个人画像——不是评估报告，而是一面镜子。他读完应该觉得"终于有人懂了"，而不是"原来我是85分的战略型"。

**核心立场：优势视角。** 你不是来挑毛病的，你是来帮他看见自己身上已经有的光。负面信息也要写，但必须包裹在"成长空间"的框架里：不是"你缺什么"，而是"你哪块地图还没画完"。

**必须输出严格的 JSON 格式，不得输出任何 JSON 之外的内容。**

---

## 一、七条原则

**优势先行**：每个角度第一句说优势。先写"你厉害在哪"，再写"哪里还能长"。

**让他认出自己**：选他自己知道但从未说出口的特点来写。

**有根有据但不念数据**：分数留在你心里，画留在纸上。不要说"条目X得Y分"。

**结论先行一句见血**：每段第一句**粗体**是核心判断，五个角度开头不能雷同。

**交叉不孤立**：至少找1-2对角度联动（协同放大/潜力激活）。

**像朋友聊天**：禁用赋能、闭环、抓手、底层逻辑等术语。整篇用"你"来写。

**让他感到被理解和欣赏**。"终于有人懂了"比"分析得很专业"有价值一百倍。

---

## 二、五个角度三层结构

顶层·方向感：战略破局力 → 往哪走
中层·落地感：执行颠覆力 + 资源整合力 → 怎么走
底层·根基感：逆商与灰度 + 伦理与格局 → 能不能走远

水平参考：4.5–5.0 卓越 | 3.5–4.4 良好 | 2.5–3.4 基础 | 1.0–2.4 待开发

---

## 三、测评数据

**被测评人姓名**：{{USER_NAME}}
**年龄**：{{AGE}}
**行业**：{{INDUSTRY}}
**进入家族企业年限**：{{YEARS_IN_BUSINESS}}

{{DIMENSION_TABLE}}
{{ENTRY_TABLES}}
{{SPF_TABLE}}

---

## 四、输出 JSON 结构

{
  "frameworkExplanation": "~60字正向语言。如：'我们从五面镜子照见你的光芒——你看方向时的敏锐直觉、做事时的系统天赋、撬动资源时的联结本能、面对压力时的坚韧内核，以及你内心深处的价值坐标。它们共同构成了一幅充满可能性的职业蓝图。'",
  "comprehensiveOverview": {
    "totalScore": {{TOTAL_SCORE}},
    "scoreLabel": "{{SCORE_LABEL}}",
    "overallAssessment": "五维能力画像（~120字）。正向描述特质组合，用比喻收尾。",
    "spfConclusion": {
      "sScore": {{S_SCORE}}, "pScore": {{P_SCORE}}, "fScore": {{F_SCORE}},
      "decisionPath": "{{DECISION_PATH}}", "decisionLabel": "{{DECISION_LABEL}}", "decisionEmoji": "{{DECISION_EMOJI}}",
      "reasoning": "为什么是这条路（~80字）。"
    }
  },
  "dimensionInsights": [
    {
      "dimensionKey": "strategic_breakthrough",
      "dimensionName": "战略破局力",
      "tier": "顶层·方向感",
      "score": 0, "level": "...",
      "entryAnalysis": [{ "sequence": 1, "text": "条目原文", "score": 0, "comment": "15-25字正面信号" }],
      "coreStrength": "核心优势（100-140字）。第一句粗体说最突出的优势。不说数据。",
      "growthSpace": "成长空间（100-140字）。用'待激活/等待释放/只差一个契机'等正向框架。",
      "entryHighlights": [{ "sequence": 0, "text": "条目原文", "score": 0, "highlight": "为什么这是他的亮点" }],
      "careerInsight": "职业启示（60-100字）。什么类型的历练能最快激活他的潜能。"
    }
  ],
  "developmentSuggestions": {
    "integratedJudgment": { "tierSummary": "三层拼在一起看（~80字）。哪层是底盘、哪层是待激活区。" },
    "developmentDirection": "整体发展方向（~60字）。先激活什么再强化什么。",
    "capabilityImprovements": [
      { "dimensionKey": "xxx", "dimensionName": "xxx", "direction": "方向（15-20字）", "reason": "为什么会有效（30-50字）" }
    ],
    "stakeholderAdvice": "利益相关者沟通建议（~100字）。"
  },
  "careerPathAnalysis": {
    "corePotentialDiagnosis": "一句话标签（带引号，如'待磨砺的创变型接班人'）",
    "corePotentialDescription": "核心潜能解读（80-120字）。底层人格组合+顶层状态+终局可能性。",
    "pathEvaluations": [
      { "path": "立即继承家业", "rating": "★☆☆☆☆", "score": 1, "basis": "适配依据", "risk": "风险提示" },
      { "path": "自主创业（外部独立）", "rating": "★★☆☆☆", "score": 2, "basis": "适配依据", "risk": "风险提示" },
      { "path": "选择性就业 / 外部机构历练", "rating": "★★★★★", "score": 5, "basis": "适配依据", "risk": "风险提示" }
    ],
    "roadmap": [
      { "phase": "第一阶段", "timeline": "现在 → 未来3年", "title": "战略性就业/外部挂职", "goal": "...", "recommendation": "...", "coreTasks": ["..."] },
      { "phase": "第二阶段", "timeline": "第3 → 第5年", "title": "试探性内部创业或联合创业", "goal": "...", "recommendation": "...", "coreTasks": ["..."] },
      { "phase": "第三阶段", "timeline": "第5年后", "title": "高概率回归继承", "goal": "以革新派身份掌舵" }
    ],
    "ultimateConclusion": "一句话格言式终极结论（40-60字）。如：'先离开，再回归——用3年换方向感，用5年换话语权。'"
  },
  "summary": "最后一面镜子（~100字）。温暖有力的祝福，用一个他忘不掉的画面或比喻收尾。"
}

**字段数量：**
- dimensionInsights：恰好 5 个，顺序不变
- entryAnalysis：每角度全部条目（5/5/4/5/4 条）
- entryHighlights：每角度 2-3 条高分条目
- capabilityImprovements：2-3 条
- pathEvaluations：恰好 3 条
- roadmap：恰好 3 个阶段

---

请严格按照以上风格，生成完整的 JSON 测评报告。让读者感到被理解、被欣赏、被赋能。`;

/**
 * 从 docs 目录加载提示词模板文件
 */
function loadMidsF2PromptTemplate() {
  const templatePath = resolveProjectPath('docs', 'report-system', 'mids-f2', 'prompt.md');
  try {
    if (fs.existsSync(templatePath)) {
      const raw = fs.readFileSync(templatePath, 'utf-8');
      if (raw.trim().length > 100) {
        console.log('[MIDS-F2] 从文件加载提示词模板:', templatePath);
        return raw;
      }
    }
  } catch (err) {
    console.warn('[MIDS-F2] 读取提示词文件失败，使用硬编码模板:', err.message);
  }
  return HARDCODED_MIDS_F2_TEMPLATE;
}

/**
 * 替换模板中的占位符
 */
function fillMidsF2PromptTemplate(template, params) {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value != null ? String(value) : '');
  }
  return result;
}

/**
 * 构建维度得分表格
 */
function buildDimensionTable(dimensionScores) {
  const lines = ['| 维度 | 得分（/5）| 水平 |', '|:---|---:|:---:|'];
  for (const key of MIDS_DIMENSION_ORDER) {
    const score = dimensionScores[key] ?? 0;
    const level = getScoreLevel(score);
    lines.push(`| ${MIDS_DIMENSION_NAMES[key]} | ${score.toFixed(2)} | ${level} |`);
  }
  return lines.join('\n');
}

/**
 * 构建条目得分明细表格
 */
function buildEntryTables(entryScores, dimensionScores) {
  if (!entryScores || !Array.isArray(entryScores) || entryScores.length === 0) {
    // 降级：从问卷 JSON 获取条目信息
    const questionnaire = loadMidsF2Questionnaire();
    const sections = [];
    for (const key of MIDS_DIMENSION_ORDER) {
      const dimQuestions = (questionnaire?.questions || []).filter(q => q.dimension === key);
      if (dimQuestions.length === 0) continue;
      sections.push(`**${MIDS_DIMENSION_NAMES[key]}条目：**`);
      const lines = ['| 序号 | 条目 | 得分 |', '|:---:|:---|---:|'];
      dimQuestions.forEach(q => {
        lines.push(`| ${q.sequence} | ${q.text} | - |`);
      });
      sections.push(lines.join('\n'));
      sections.push('');
    }
    return sections.join('\n');
  }

  // 有实际得分数据
  const sections = [];
  const grouped = {};
  for (const entry of entryScores) {
    const dim = entry.dimension;
    if (!grouped[dim]) grouped[dim] = [];
    grouped[dim].push(entry);
  }

  for (const key of MIDS_DIMENSION_ORDER) {
    const entries = grouped[key] || [];
    if (entries.length === 0) continue;
    sections.push(`**${MIDS_DIMENSION_NAMES[key]}条目：**`);
    const lines = ['| 序号 | 条目 | 得分 |', '|:---:|:---|---:|'];
    entries.forEach(e => {
      lines.push(`| ${e.sequence} | ${e.text} | ${e.score} |`);
    });
    sections.push(lines.join('\n'));
    sections.push('');
  }
  return sections.join('\n');
}

/**
 * 构建 S-P-F 定性评估表格
 */
function buildSPFTable(midsF2Result) {
  const { sScore, pScore, fScore, decisionPath } = midsF2Result;
  const dec = DECISION_PATH_INFO[decisionPath] || DECISION_PATH_INFO['further_study'];
  const lines = [
    '| 维度 | 评级 | 得分 |',
    '|:---|---:|:---:|',
    `| 战略破局力（S）| ${getSPFRating(sScore)} | ${sScore?.toFixed?.(2) ?? sScore} |`,
    `| 执行颠覆力（P）| ${getSPFRating(pScore)} | ${pScore?.toFixed?.(2) ?? pScore} |`,
    `| 家族/资源匹配度（F）| ${getSPFRating(fScore)} | ${fScore?.toFixed?.(2) ?? fScore} |`,
    '',
    `**推荐路径：${dec.emoji} ${dec.label}**`,
    `决策逻辑：${dec.logic}`,
  ];
  return lines.join('\n');
}

/**
 * 构建发送给 AI 的完整提示词
 */
function buildMidsF2Prompt(dimensionScores, midsF2Result, userInfo, entryScores) {
  const template = loadMidsF2PromptTemplate();

  const dimensionTable = buildDimensionTable(dimensionScores);
  const entryTables = buildEntryTables(entryScores, dimensionScores);
  const spfTable = buildSPFTable(midsF2Result);

  const totalScore = midsF2Result.totalScore ?? 0;
  const scoreLabel = getScoreLevel(totalScore / 20); // totalScore is 20-100, convert to 1-5 scale

  const params = {
    USER_NAME: userInfo?.name || '被测者',
    AGE: userInfo?.age || '未提供',
    INDUSTRY: userInfo?.industry || '未提供',
    YEARS_IN_BUSINESS: userInfo?.yearsInBusiness || '未提供',
    DIMENSION_TABLE: dimensionTable,
    ENTRY_TABLES: entryTables,
    SPF_TABLE: spfTable,
    TOTAL_SCORE: totalScore,
    SCORE_LABEL: scoreLabel,
    S_SCORE: midsF2Result.sScore?.toFixed?.(2) ?? midsF2Result.sScore ?? 0,
    P_SCORE: midsF2Result.pScore?.toFixed?.(2) ?? midsF2Result.pScore ?? 0,
    F_SCORE: midsF2Result.fScore?.toFixed?.(2) ?? midsF2Result.fScore ?? 0,
    DECISION_PATH: midsF2Result.decisionPath || 'further_study',
    DECISION_LABEL: midsF2Result.decisionLabel || '深造蓄力',
    DECISION_EMOJI: midsF2Result.decisionEmoji || '📚',
  };

  return fillMidsF2PromptTemplate(template, params);
}

// ==================== 问卷加载（用于降级获取条目文本） ====================

let _cachedQuestionnaire = null;

function loadMidsF2Questionnaire() {
  if (_cachedQuestionnaire) return _cachedQuestionnaire;
  try {
    const qPath = resolveProjectPath('src', 'data', 'questionnaires', 'mids-f2.json');
    if (fs.existsSync(qPath)) {
      _cachedQuestionnaire = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('[MIDS-F2] 无法加载问卷 JSON:', err.message);
  }
  return _cachedQuestionnaire;
}

// ==================== 降级报告构建 ====================

function buildFallbackReport(dimensionScores, midsF2Result, userInfo) {
  const name = userInfo?.name || '被测者';
  const dims = MIDS_DIMENSION_ORDER;
  const dec = DECISION_PATH_INFO[midsF2Result.decisionPath] || DECISION_PATH_INFO['further_study'];
  const totalScore = midsF2Result.totalScore ?? 0;

  const dimensionInsights = dims.map(key => {
    const score = dimensionScores[key] ?? 0;
    const level = getScoreLevel(score);
    const questionnaire = loadMidsF2Questionnaire();
    const entries = (questionnaire?.questions || [])
      .filter(q => q.dimension === key)
      .map(q => ({ sequence: q.sequence, text: q.text, score: score, comment: '系统自动评分，详见交互式报告。' }));

    return {
      dimensionKey: key,
      dimensionName: MIDS_DIMENSION_NAMES[key],
      tier: MIDS_DIMENSION_TIERS[key],
      score: Math.round(score * 100) / 100,
      level,
      entryAnalysis: entries,
      analysis: buildDimensionAnalysis(key, score, level, name),
      impactOnSuccession: buildImpactOnSuccession(key, score, name),
    };
  });

  const improvements = buildCapabilityImprovements(dimensionScores);

  const scoreLabel = getScoreLevel(totalScore / 20);
  const fallbackCPA = buildFallbackCareerPathAnalysis(dimensionScores, midsF2Result);

  return {
    reportType: 'mids-f2',
    frameworkExplanation: `我们从五面镜子照见你的光芒——你看方向时的敏锐直觉、做事时的系统天赋、撬动资源时的联结本能、面对压力时的坚韧内核，以及你内心深处的价值坐标。它们共同构成了一幅充满可能性的职业蓝图。`,
    comprehensiveScore: totalScore,
    comprehensiveOverview: {
      totalScore,
      scoreLabel,
      overallAssessment: `**你身上最亮眼的是那股不服输的韧劲——被否定后会绕路再试，愿意为长远愿景暂舍眼下。**你的方向感如同一片待开垦的沃土，跨界热情是燃料，而资源整合的潜能正等待第一个实践支点。像一辆动力澎湃、底盘扎实的越野车——只差一套专属于你的导航系统。`,
      spfConclusion: {
        sScore: midsF2Result.sScore ?? 0,
        pScore: midsF2Result.pScore ?? 0,
        fScore: midsF2Result.fScore ?? 0,
        decisionPath: midsF2Result.decisionPath || 'further_study',
        decisionLabel: dec.label,
        decisionEmoji: dec.emoji,
        reasoning: `基于你的S-P-F画像，系统推荐"${dec.label}"路径。${dec.logic}`,
      },
    },
    dimensionInsights,
    developmentSuggestions: {
      integratedJudgment: {
        tierSummary: buildTierSummary(dimensionScores, name),
      },
      developmentDirection: `**对你来说，先激活方向感、再释放行动力，是放大你已有底盘优势的最优顺序。**方向对了，你的韧劲和格局才能用到刀刃上。`,
      capabilityImprovements: improvements,
      stakeholderAdvice: `**跟父辈沟通时，不说"我想跨界创新"——说"我想先到外面把跨界落地的路径摸清楚，再回来创造更大价值"。**姿态越低，信任越高。跟老臣用"愿意从基层做起"的实际行动去赢得尊重。`,
    },
    summary: `**你像一辆动力澎湃、底盘扎实的越野车——引擎已就位，只差一套专属导航。**你最珍贵的不是热情，而是被否定后依然绕路再试的那股柔韧之力。先去外面跑一圈，把地图亲手画清楚。等到那一天，你的韧劲、格局和价值观将不再是"潜力"，而是你驰骋世界的真实马力。`,
    careerPathAnalysis: fallbackCPA,
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

// ==================== AI 调用 ====================

async function callAI(dimensionScores, midsF2Result, userInfo, entryScores) {
  const prompt = buildMidsF2Prompt(dimensionScores, midsF2Result, userInfo, entryScores);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`DeepSeek API ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 50) {
      throw new Error('AI 返回内容过短或为空');
    }
    return content.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[MIDS-F2] AI 调用超时（120s）');
    } else {
      console.warn('[MIDS-F2] AI 调用失败:', err.message);
    }
    return null;
  }
}

// ==================== 响应解析 ====================

function parseAIResponse(raw, dimensionScores, midsF2Result, userInfo) {
  if (!raw) {
    return buildFallbackReport(dimensionScores, midsF2Result, userInfo);
  }

  // 尝试多种 JSON 提取策略
  let jsonStr = raw.trim();

  // 策略1：去掉 markdown 代码块
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // 策略2：找到第一个 { 和最后一个 }
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // 验证新格式
    if (parsed.comprehensiveOverview && parsed.dimensionInsights) {
      // 确保 dimensionInsights 有 5 个
      if (parsed.dimensionInsights.length < 5) {
        console.warn('[MIDS-F2] AI 返回的 dimensionInsights 不足 5 个，使用降级');
        return buildFallbackReport(dimensionScores, midsF2Result, userInfo);
      }

      // 补充系统计算的数据以确保一致性
      return {
        ...parsed,
        reportType: 'mids-f2',
        comprehensiveScore: parsed.comprehensiveOverview?.totalScore ?? midsF2Result.totalScore ?? 0,
        midsF2Result,
        midsF2Scores: dimensionScores,
      };
    }

    // 适配旧格式
    console.warn('[MIDS-F2] AI 返回了旧格式，适配...');
    return adaptLegacyFormat(parsed, dimensionScores, midsF2Result, userInfo);
  } catch (err) {
    console.warn('[MIDS-F2] AI JSON 解析失败:', err.message);
  }

  return buildFallbackReport(dimensionScores, midsF2Result, userInfo);
}

// ==================== 旧格式适配 ====================

function adaptLegacyFormat(parsed, dimensionScores, midsF2Result, userInfo) {
  const name = userInfo?.name || '被测者';
  const dims = MIDS_DIMENSION_ORDER;

  const dimensionInsights = (parsed.dimensionInsights || dims.map(key => ({
    dimensionKey: key,
    interpretation: parsed.coreEvaluation || '',
    suggestion: '',
  }))).map((item, i) => {
    const key = item.dimensionKey || dims[i] || 'strategic_breakthrough';
    const score = dimensionScores[key] ?? 0;
    return {
      dimensionKey: key,
      dimensionName: MIDS_DIMENSION_NAMES[key] || key,
      tier: MIDS_DIMENSION_TIERS[key] || '中层·落地感',
      score: Math.round(score * 100) / 100,
      level: getScoreLevel(score),
      entryAnalysis: [],
      analysis: item.interpretation || item.analysis || '',
      impactOnSuccession: item.suggestion || item.impactOnSuccession || '',
    };
  });

  return {
    reportType: 'mids-f2',
    frameworkExplanation: parsed.frameworkExplanation || '我们从五个角度来看你——你怎么看方向、怎么做事情、怎么撬动资源、怎么面对压力、以及你内心深处的价值观。它们拼在一起，就是你的职业肖像。',
    comprehensiveScore: parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0,
    comprehensiveOverview: {
      totalScore: parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0,
      scoreLabel: getScoreLevel((parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0) / 20),
      overallAssessment: parsed.coreEvaluation || '',
      spfConclusion: {
        sScore: midsF2Result.sScore ?? 0,
        pScore: midsF2Result.pScore ?? 0,
        fScore: midsF2Result.fScore ?? 0,
        decisionPath: midsF2Result.decisionPath || 'further_study',
        decisionLabel: midsF2Result.decisionLabel || '',
        decisionEmoji: midsF2Result.decisionEmoji || '',
        reasoning: '',
      },
    },
    dimensionInsights,
    developmentSuggestions: {
      integratedJudgment: { tierSummary: '' },
      developmentDirection: '',
      capabilityImprovements: (parsed.careerSuggestions || []).map(s => ({
        dimensionKey: '',
        dimensionName: '',
        direction: s,
        reason: '',
      })),
      stakeholderAdvice: '',
    },
    summary: parsed.summary || '',
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

// ==================== 降级报告辅助函数 ====================

function buildFallbackCareerPathAnalysis(dimensionScores, midsF2Result) {
  const sScore = dimensionScores.strategic_breakthrough ?? 0;
  const eScore = dimensionScores.execution_disruption ?? 0;
  const rScore = dimensionScores.resource_integration ?? 0;
  const aScore = dimensionScores.adversity_quotient ?? 0;
  const vScore = dimensionScores.ethics_vision ?? 0;

  return {
    corePotentialDiagnosis: '待磨砺的创变型接班人',
    corePotentialDescription: `你的底层人格是"高韧性+高格局+高跨界冲动"的组合，顶层能力（战略判断与实战落地）正处在待激活的成长阶段。你的最大潜能不在于"现在接什么"，而在于用3-5年外部历练将自己锻造成能带兵打仗、能定方向的复合型领袖。`,
    pathEvaluations: [
      {
        path: '立即继承家业',
        rating: '★☆☆☆☆',
        score: 1,
        basis: `战略破局力${sScore.toFixed(1)}分，独立判断仍在成长中。当前直接接手，容易在方向决策上过度依赖父辈框架，难以建立自己的权威。`,
        risk: '方向感尚未独立，可能陷入"局部改良却难破全局"的困局。',
      },
      {
        path: '自主创业（外部独立）',
        rating: '★★☆☆☆',
        score: 2,
        basis: `逆商${aScore.toFixed(1)}分是你的底气，跨界热情是你的燃料。但执行落地得分${eScore.toFixed(1)}且缺少实战闭环，资源整合${rScore.toFixed(1)}分也还是储备状态。`,
        risk: '韧性过强可能让你在错误赛道上坚持太久，导致不必要的消耗。',
      },
      {
        path: '选择性就业 / 外部机构历练',
        rating: '★★★★★',
        score: 5,
        basis: `完美契合你的成长需求：补战略判断（到外部练独立视野）、补执行手感（亲手干完项目闭环）、补资源网络（接触真实并购与合作）。你的高逆商让"从基层做起"毫无包袱，反而成长飞快。`,
        risk: '需设定明确的回归时间与学习目标，避免长期当旁观者。',
      },
    ],
    roadmap: [
      {
        phase: '第一阶段',
        timeline: '现在 → 未来3年',
        title: '战略性就业/外部挂职',
        goal: '补全方向地图与实战手感',
        recommendation: '头部咨询公司、产业投资机构或与家族主业相关的细分领域头部企业（非竞对）',
        coreTasks: ['亲手完成至少2个完整项目闭环（从调研到落地）', '建立自己的行业研判框架'],
      },
      {
        phase: '第二阶段',
        timeline: '第3 → 第5年',
        title: '试探性内部创业或联合创业',
        goal: '带着外部认知积累，以项目制切入家族生态边缘',
        recommendation: '主导一个新品牌、新渠道或数字化专项，吸引外部年轻人才测试合伙人机制',
        coreTasks: ['用已验证的判断力主导一个独立项目', '吸引外部人才建立自己的小团队'],
      },
      {
        phase: '第三阶段',
        timeline: '第5年后',
        title: '高概率回归继承',
        goal: '以"革新派"身份掌舵——不再是父辈框架里的继任者，而是带着已验证地图回来的领航员。',
      },
    ],
    ultimateConclusion: `先离开，再回归——用3年换方向感，用5年换话语权。你已拥有最难的"底盘"，剩下的只是时间。`,
  };
}

function buildDimensionAnalysis(key, score, level, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const templates = {
    strategic_breakthrough: {
      '卓越': `**你对行业方向的判断已经超出了同龄人——不只是在父辈的框架里改良，而是有自己的独立视角。**你能看到逆周期布局的机会，能把宏观趋势转化成业务判断。这是"领军"这条路上最稀缺的资本。`,
      '良好': `**你对行业变化有不错的嗅觉，跨界思维能让你识别到别人看不见的机会。**接下来要做的，是把"看到"变成能说清楚、能执行的具体判断——让你的方向感从直觉升级为武器。`,
      '基础': `**你对跨界和创新有着本能的兴奋——这是许多成功企业家最初的燃料。**你敢于质疑已有的模式、对宏观趋势保持敏感，这说明你的视野远不止于眼前。成长空间在于：你目前对"如何落地"还缺少自己的分析框架，因为你一直在父辈体系里成长。这不是缺陷，而是一张等待你亲手绘制的空白地图。`,
      '待开发': `**你在"往哪走"这件事上正处于积累期——这意味着你有巨大的成长潜力等待释放。**一旦开始独立研判行业、亲手拆解技术应用场景，你的方向感将快速成长。`,
    },
    execution_disruption: {
      '卓越': `**你是那种"看到了就会去做"的人——这在二代里很难得。**数字化工具你用得上手，试错机制你也习惯。你能把想法变成团队的行动，这是你画像里最扎实的一块。`,
      '良好': `**你能把想法落地，对新技术也持开放态度。**下一步是从"我觉得可以试试"升级到"数据告诉我应该这样做"，让判断力再上一个台阶。`,
      '基础': `**你拥有把复杂事务简化、标准化的天赋——这是许多执行者终其一生都难掌握的"化繁为简"能力。**你对数字化、数据决策、敏捷试错的认同说明你的思维与时代同频。成长空间在于：你目前对执行的理解多来自学习而非实战。但好消息是，你的天赋一旦配上一次亲手操盘的机会，就会迅速转化为真正的战斗力。`,
      '待开发': `**从想法到落地的旅程正要开始——这对你来说是最好的成长红利。**你可能有很多好点子，现在缺的只是一个从0到1的完整项目来激活你的执行潜能。`,
    },
    resource_integration: {
      '卓越': `**你在资源这块的优势很突出——你能在家族内外之间搭桥。**你既能理解老臣的想法，又知道外面有哪些资源可以引入。这种"内通外通"的能力，是从"做事的人"走向"带资源的人"的关键标志。`,
      '良好': `**你在内部资源上做得不错——老臣信任你，你也善于在现有体系里撬动资源。**下一步是把资源网络从"家里的"向外延伸，去接触外部的资本和人才。`,
      '基础': `**你具备天生的连接者潜质——对人和资本有天然的感知力。**你能理解老臣的痛点、认同外部人才的价值、知道资本工具的存在。所有条目得分均衡，这不是平庸，而是"尚未启用的储备"——你全面而非偏科的资源思维，正是优秀整合者的底层素质。你缺的不是能力，只差第一个实战支点。`,
      '待开发': `**你的资源整合能力正处于积累阶段——这意味着你有大片的成长空间。**第一步是先走出去接触外部网络，不用怕生，你天生就是连接者。`,
    },
    adversity_quotient: {
      '卓越': `**你是那种被否定了还能迂回再来的人——这在二代群体里是最稀有的品质，是你最宝贵的"护城河"。**在家族和企业的双重压力下还能坚持自己的方向，这种心理韧性比任何业务能力都珍贵。这是你选择高挑战路径最大的底气。`,
      '良好': `**你在压力面前能保持投入，不轻易放弃——这是你人格底盘的坚实基础。**下一步是在真实的"被否决—迂回—再推进"循环中继续积累灰度智慧。`,
      '基础': `**你的心理韧性正在成长中——这需要真实经历来锻造，不是上课能学的。**在"允许犯错、允许被拒绝"的环境里从小项目开始积累经验，你会发现自己比想象中更能扛。`,
      '待开发': `**这是需要你关注的成长信号——但它完全可以通过有安全边界的历练来加强。**从小的创新项目开始，一步一步建立对自己抗压能力的信心。`,
    },
    ethics_vision: {
      '卓越': `**你的格局已经超越了财富积累本身——你对企业应该有怎样的社会价值有自己的信念。**你把责任和品牌内化到决策里，不是做给别人看，而是你自己就信这个。这为带团队提供了最牢靠的信任基础。`,
      '良好': `**你在商业价值和社会价值之间保持了一个不错的平衡——品牌声誉对你来说是重要的，长期的考量也在你的视野里。**下一步是把价值观更自然地融入每一个经营决策，让它从理念变成行动。`,
      '基础': `**你拥有超越商业本身的使命感——关注品牌声誉胜过短期价格战，相信企业应该解决社会问题。**这是伟大事业的种子。成长空间在于：你的"分享"和"社会责任"目前还在理念层面。但好消息是，你"愿意从基层做起"的特质正是将价值观落地的最好桥梁——当你真正和团队并肩作战时，每一句价值观都会变成活生生的信任。`,
      '待开发': `**价值观的成长是一个长期过程——你已经开始思考"企业除了赚钱还有什么意义"，这本身就是重要的一步。**试着认真想一次这个问题，它会成为你未来带团队时最坚实的信任基础。`,
    },
  };

  const dimTemplates = templates[key] || templates['strategic_breakthrough'];
  return dimTemplates[level] || `**在${dimName}这个角度，你的表现处于"${level}"水平。**建议通过实战来进一步了解和提升这个方面。`;
}

function buildImpactOnSuccession(key, score, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const impacts = {
    strategic_breakthrough: score >= 3.5
      ? `**你对方向的判断力，是你选择独立创业或领军接班这条路的强大资本。**"看到"只是起点——这条路能不能走通，还得看你能不能"做到"、有没有人帮你一起做。`
      : `**在拥有自己的"方向地图"之前，你更适合先到外部环境中锤炼判断力——先练就"看见"的本领，再施展"做到"的威力。**这段探索不是绕路，而是你最宝贵的成长投资。`,
    execution_disruption: score >= 3.5
      ? `**你是那种"既看得到又做得了"的人——这在执行层面是扎实的资本。**从"会用工具"到"用数据做决策"，是你下一步的升级方向。`
      : `**你现在最需要的不是新理念，而是一个真实的、完整的项目闭环——哪怕很小，亲手从头到尾干一遍。**你的天赋会在第一次实战中爆发。`,
    resource_integration: score >= 3.5
      ? `**"内通外通"的能力是你走向更大舞台的底牌——老臣信你，你也知道怎么引入外部资源。**这是从"做事的人"走向"带资源的人"的关键标志。`
      : `**你不是不会整合资源——你是还没真正接触过资源。**建议优先找一个能接触外部资源网络的环境，你的第一个实战案例会成为你最好的名片。`,
    adversity_quotient: score >= 3.5
      ? `**你的心理韧性是你最厚的底牌——这在二代里太稀有了。**被否了还能迂回再来，这种品质比业务能力更能决定你能走多远。用它来支撑"看清路"的耐心，再支撑"走对路"的毅力。`
      : `**心理韧性正在建立中——它需要真实的历练来锻造。**从有安全边界的小项目开始，每一次被拒绝后继续推进的经历，都会让你更强。`,
    ethics_vision: score >= 3.5
      ? `**你的格局和价值观让你在推动变革时有一个独特优势——你说的对的话，别人会信你。**当你的方向与社会价值相关联时，来自家族内部的阻力会自然消解。这是你的"理念杠杆"。`
      : `**价值观的落地是一个从理念到行动的过程——而这恰恰说明你的格局已经到位，只差行动的注脚。**试着从一个小项目开始，用行动把你的价值观变成团队的共同信仰。`,
  };
  return impacts[key] || '';
}

function buildCapabilityImprovements(dimensionScores) {
  const improvements = [];
  for (const key of MIDS_DIMENSION_ORDER) {
    const score = dimensionScores[key] ?? 0;
    if (score < 3.5) {
      improvements.push({
        dimensionKey: key,
        dimensionName: MIDS_DIMENSION_NAMES[key],
        direction: getImprovementDirection(key),
        reason: getImprovementReason(key, score),
      });
    }
  }
  // 如果所有维度都 >= 3.5，给出至少 2 条锦上添花的建议
  if (improvements.length === 0) {
    improvements.push({
      dimensionKey: 'execution_disruption',
      dimensionName: '执行颠覆力',
      direction: '深化数据驱动的决策体系，将现有的工具应用能力升级为系统性的变革管理能力',
      reason: '当前执行颠覆力表现良好，但数字化转型是一个持续深化的过程。进一步提升数据决策的深度和广度，将有助于巩固领军接班的执行基础。',
    });
  }
  if (improvements.length === 1) {
    improvements.push({
      dimensionKey: 'resource_integration',
      dimensionName: '资源整合力',
      direction: '从内部资源挖潜向外延伸，尝试引入外部资本工具和职业经理人',
      reason: '资源整合力的进一步提升将为创新落地提供更充足的支撑。在保持内部优势的同时拓展外部资源网络，有助于打破增长天花板。',
    });
  }
  return improvements.slice(0, 4);
}

function getImprovementDirection(key) {
  const directions = {
    strategic_breakthrough: '选择需要独立判断行业方向的工作环境，如战略岗或咨询，积累从趋势到业务的转化经验',
    execution_disruption: '在关键业务场景中引入量化分析工具，从"凭感觉做"过渡到"看数据做"',
    resource_integration: '主动接触外部资本网络和职业经理人圈子，拓宽资源获取渠道',
    adversity_quotient: '从小规模创新项目开始，在有安全边界的条件下积累被拒绝和迂回推进的经验',
    ethics_vision: '在业务决策中有意识地纳入社会价值和长期影响的考量，建立系统化的价值观框架',
  };
  return directions[key] || '针对性提升该维度的能力表现';
}

function getImprovementReason(key, score) {
  const level = getScoreLevel(score);
  const reasons = {
    strategic_breakthrough: `**看不清方向，你每次向父辈提案都会缺说服力——对方一句"你怎么判断的"就能让你卡住。**你的方向感处于"${level}"水平，独立判断行业的能力是你现在最该优先补的。`,
    execution_disruption: `**想法再好但落不了地，消耗的不只是资源，更是团队对你"能成事"的信心。**你的执行力处于"${level}"水平，"想到"和"做到"之间的这个距离，需要在实战里一步一步走完。`,
    resource_integration: `**家族内部的资源总有天花板。靠内部挖潜够你走一段，但走不远。**你的资源整合力处于"${level}"水平，外部资本和人才网络是你迟早要面对的一关。`,
    adversity_quotient: `**扛不住几次否定就放弃，比任何能力短板都致命。**你的抗压能力处于"${level}"水平，这个短板不能速成——但可以在安全边界里从小项目开始练。`,
    ethics_vision: `**地基不牢的后果不会马上显现，但一旦显现就不可逆——团队信任崩塌只需要一次。**你的价值观格局处于"${level}"水平，建议认真想一次：你的企业除了赚钱，还应该对谁负责？`,
  };
  return reasons[key] || `**这个方面处于"${level}"水平，有明确的提升空间。**建议结合实际场景制定针对性的发展计划。`;
}

function buildTierSummary(dimensionScores, name) {
  const topScore = dimensionScores.strategic_breakthrough ?? 0;
  const midScore = ((dimensionScores.execution_disruption ?? 0) + (dimensionScores.resource_integration ?? 0)) / 2;
  const bottomScore = ((dimensionScores.adversity_quotient ?? 0) + (dimensionScores.ethics_vision ?? 0)) / 2;

  const topLevel = getScoreLevel(topScore);
  const midLevel = getScoreLevel(midScore);
  const bottomLevel = getScoreLevel(bottomScore);

  const maxScore = Math.max(topScore, midScore, bottomScore);
  const topIsStrongest = topScore === maxScore;
  const midIsStrongest = midScore === maxScore;

  return `**你的底盘（逆商+格局）非常稳固，这是你能够走远的根基。**顶层（战略方向）和中层（执行落地）正处于'待激活'状态——这不是缺陷，而是巨大的成长空间。你的核心优势是：有热情、有韧性、有格局；你的成长课题是：把判断力和经验补上来。方向对了，你的韧劲和格局才能发挥最大威力。`;
}

// ==================== 主入口 ====================

/**
 * 生成 MIDS-F2 报告
 * @param {Object} options
 * @param {Object} options.dimensionScores - 维度得分 { strategic_breakthrough, execution_disruption, ... }
 * @param {Object} options.midsF2Result - S-P-F 计算结果（来自 midsF2ScoringService.computeMidsF2）
 * @param {string} [options.userName] - 用户姓名（向后兼容，优先使用 userInfo.name）
 * @param {Object} [options.userInfo] - 用户信息 { name, age, industry, yearsInBusiness }
 * @param {Array} [options.entryScores] - 条目级得分 [{ dimension, sequence, text, score }]
 */
async function generateMidsF2Report({ dimensionScores, midsF2Result, userName, userInfo, entryScores }) {
  // 向后兼容：如果传了 userName 但没有 userInfo，自动构建
  const effectiveUserInfo = userInfo || (userName ? { name: userName } : { name: '被测者' });
  if (userName && !effectiveUserInfo.name) effectiveUserInfo.name = userName;

  const aiRaw = await callAI(dimensionScores, midsF2Result, effectiveUserInfo, entryScores);
  const report = parseAIResponse(aiRaw, dimensionScores, midsF2Result, effectiveUserInfo);

  return {
    ...report,
    reportType: 'mids-f2',
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

module.exports = { generateMidsF2Report };
