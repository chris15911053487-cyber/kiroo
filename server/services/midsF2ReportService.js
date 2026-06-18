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

**必须输出严格的 JSON 格式，不得输出任何 JSON 之外的内容。**

---

## 一、这份报告要让他回答三个问题

1. **我是个什么样的人？**——读完第一段就能点头
2. **我身上最突出的特点是什么？**——不只是好的，也包括那些他自己知道但不愿面对的
3. **我可能会在哪卡住？**——第一个让他摔跤的地方，以及为什么

---

## 二、怎么写——核心原则

**让他认出自己**：选一个他自己知道但从未说出口的特点来写。最好的反馈不是"分析得很准"，而是"对，就是这样"。

**有根有据，但不念数据**：你心里装着每道题的得分——那是你下判断的依据。但写出来的时候，证据是融化在叙述里的。不要说"条目X得Y分"，而要说"你对跨界本身充满热情，但一被问到具体怎么做，你的回答就模糊了"。

**结论先行，一句见血**：每个角度的第一句话就是你对这个人的核心判断。五个角度开头不能雷同。禁止"你在XX维度处于XX水平"。

**交叉不孤立**：至少找1-2对角度之间的联动（协同放大/补偿掩盖/制约瓶颈）。

**总分结构**：每段第一句 **粗体** 核心判断，后续展开。每段只有一处加粗。

**像朋友聊天，不用术语**：禁用——赋能、闭环、抓手、底层逻辑、认知升级、心智模型、能力图谱、方法论框架、经验缺口、认知框架。整篇用"你"来写。

**让他感到被理解，不是被分析**：读者最强烈的反应不应该指向分数，而应该指向自己。"终于有人懂了"比"分析得很专业"有价值一百倍。

---

## 三、五个角度

- **顶层·方向感**：战略破局力 → 他怎么回答"往哪走"
- **中层·落地感**：执行颠覆力 + 资源整合力 → 他怎么回答"怎么走"
- **底层·根基感**：逆商与灰度 + 伦理与格局 → 他能不能走得远

水平参考：4.5–5.0 卓越 | 3.5–4.4 良好 | 2.5–3.4 基础 | 1.0–2.4 待开发

---

## 四、测评数据

**被测评人姓名**：{{USER_NAME}}
**年龄**：{{AGE}}
**行业**：{{INDUSTRY}}
**进入家族企业年限**：{{YEARS_IN_BUSINESS}}

### 各角度得分
{{DIMENSION_TABLE}}

### 各条目得分明细（你的判断依据，不要念给读者听）
{{ENTRY_TABLES}}

### S-P-F 路径参考
{{SPF_TABLE}}

---

## 五、输出 JSON 结构

{
  "frameworkExplanation": "~50字。用最简单的语言告诉读者这五个角度是什么，合在一起是什么。像展览前言，不是教科书。",
  "comprehensiveOverview": {
    "totalScore": {{TOTAL_SCORE}},
    "scoreLabel": "卓越/良好/基础/待开发",
    "overallAssessment": "给他一面全身镜（~100字）。用一段话说清一个人的特质组合。像在向别人介绍他。",
    "spfConclusion": {
      "sScore": {{S_SCORE}}, "pScore": {{P_SCORE}}, "fScore": {{F_SCORE}},
      "decisionPath": "{{DECISION_PATH}}", "decisionLabel": "{{DECISION_LABEL}}", "decisionEmoji": "{{DECISION_EMOJI}}",
      "reasoning": "为什么是这条路（~80字）。告诉他这条路和他的特质画像之间的关系。"
    }
  },
  "dimensionInsights": [
    {
      "dimensionKey": "strategic_breakthrough",
      "dimensionName": "战略破局力",
      "tier": "顶层·方向感",
      "score": 0, "level": "...",
      "entryAnalysis": [{ "sequence": 1, "text": "条目原文", "score": 0, "comment": "15-25字信号" }],
      "analysis": "画像速写（100-140字）。用'你'来写。粗体主题句→自然展开。不念数据。至少一处关联其他角度。",
      "impactOnSuccession": "这一面对你意味着什么（50-60字）。语气像忠告，不像结论。"
    }
  ],
  "developmentSuggestions": {
    "integratedJudgment": { "tierSummary": "三层拼在一起看（~70字）。哪层是底盘、哪层是天花板。" },
    "developmentDirection": "接下来怎么走（~60字）。先补短板还是先拉长板？",
    "capabilityImprovements": [
      { "dimensionKey": "xxx", "dimensionName": "xxx", "direction": "15-20字方向", "reason": "30-40字。告诉他这个短板在什么场景下会让他吃亏。" }
    ],
    "stakeholderAdvice": "怎么跟关键人沟通（~80字）。"
  },
  "summary": "最后一面镜子（~80字）。像离开茶馆前朋友认真说的几句话。"
}

**字段数量：**
- dimensionInsights：恰好 5 个
- entryAnalysis：每角度全部条目（5/5/4/5/4 条）
- capabilityImprovements：2-3 条
- 不输出 coreDefinition / tierTable

---

请严格按照以上风格，生成完整的 JSON 测评报告。让读者感到被理解，不要让读者感到被分析。`;

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

  return {
    reportType: 'mids-f2',
    frameworkExplanation: `我们从五个角度来看你——你怎么看方向、怎么做事情、怎么撬动资源、怎么面对压力、以及你内心深处的价值观。它们拼在一起，就是你的职业肖像。`,
    comprehensiveScore: totalScore,
    comprehensiveOverview: {
      totalScore,
      scoreLabel: getScoreLevel(totalScore / 20),
      overallAssessment: `**你的特质组合不是平均的——有些地方特别亮眼，有些地方还需要时间。**五个角度的得分各有高低，这不是好坏的问题，而是帮你找到最适合自己的路。有短板不可怕，可怕的是不知道短板在哪。`,
      spfConclusion: {
        sScore: midsF2Result.sScore ?? 0,
        pScore: midsF2Result.pScore ?? 0,
        fScore: midsF2Result.fScore ?? 0,
        decisionPath: midsF2Result.decisionPath || 'further_study',
        decisionLabel: dec.label,
        decisionEmoji: dec.emoji,
        reasoning: `基于S(${(midsF2Result.sScore ?? 0).toFixed(2)})、P(${(midsF2Result.pScore ?? 0).toFixed(2)})、F(${(midsF2Result.fScore ?? 0).toFixed(2)})的得分组合，系统推荐"${dec.label}"路径。${dec.logic}`,
      },
    },
    dimensionInsights,
    developmentSuggestions: {
      integratedJudgment: {
        tierSummary: buildTierSummary(dimensionScores, name),
      },
      developmentDirection: `**对你来说，"${dec.label}"是你当前画像最自然指向的方向。**不用急着把每个短板都补齐——先管那个最拖后腿的，让你的优势有更大的舞台。`,
      capabilityImprovements: improvements,
      stakeholderAdvice: `**把这份报告拿给父辈和老臣看看——不是让他们"审阅"，而是让他们了解你。**当他们问你"你觉得自己适合什么"的时候，这里面的描述可以帮你开口。用这份画像来谈角色定位，比两人空对空地争论有用得多。`,
    },
    summary: `**你不需要变成另一个人——你只需要知道现在自己的长板和短板在哪，然后选一条最划算的路。**方向感、落地力、根基感这三层，不均衡是常态。关键是让你最强的那个成为你的标签，让你最弱的那个不至于拖累你。先突破最该突破的那个点，其他的慢慢来。`,
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


function buildDimensionAnalysis(key, score, level, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const templates = {
    strategic_breakthrough: {
      '卓越': `**你对行业方向的判断已经超出了同龄人——不只是在父辈的框架里改良，而是有自己的独立视角。**你能看到逆周期布局的机会，能把宏观趋势转化成业务判断。这是"领军"这条路上最稀缺的资本。`,
      '良好': `**你对行业变化有不错的嗅觉，跨界思维能让你识别到机会。**在冒进和保守之间你找到了一个相对平衡的位置。接下来要做的，是把"看到"变成能说清楚、能执行的具体判断——让别人信你不仅是有感觉，而是有判断。`,
      '基础': `**你看方向的时候，更多还是在参考父辈的经验——你自己也感觉到了，但还没找到独立判断的方法。**你对行业趋势有感知，但要把趋势拆解成业务动作时，你会觉得手里缺工具。这不单是认知问题，更多是你还没获得独立做判断的实战机会。`,
      '待开发': `**你在"往哪走"这件事上，目前主要靠外部输入——父辈怎么说、行业怎么做，你就怎么跟。**这不是说你不聪明，而是你还没有独立判断一个行业方向的经验。这是你现在最需要补上的一课，而且只能在外面补。`,
    },
    execution_disruption: {
      '卓越': `**你是那种"看到了就会去做"的人——这在二代里很难得。**数字化工具你用得上手，"小步快跑"的试错方式你也习惯。你能把一个想法变成团队的行动，这是你画像里最扎实的一块。`,
      '良好': `**你能把想法落地，对新技术也持开放态度。**但你的决策更多还是靠经验，而不是靠数据。从"我觉得可以试试"到"数据告诉我应该这样做"，是你下一步要跨的坎。`,
      '基础': `**在"想到"和"做到"之间，你还有一段距离。**你可能想得很清楚，但到执行的时候还是习惯用传统方式。在数字化已经是标配的今天，这个习惯会让你在提方案时缺说服力——别人会觉得你说的和能做的之间有落差。`,
      '待开发': `**从想法到落地，你中间缺了一大段。**你可能有很多好点子，但在推动执行的时候会发现使不上劲。这不怪你——你缺的是 0→1 的实战经历。先从一个你能独立操盘的小项目开始，建立"我能把事做成"的信心。`,
    },
    resource_integration: {
      '卓越': `**你在资源这块有一个很突出的优势——你能在家族内外之间搭桥。**你既能理解老臣的想法，又知道外面有哪些资源可以引入。这种"内通外通"的能力，是从"做事的人"走向"带资源的人"的关键标志。`,
      '良好': `**你在内部资源上做得不错——老臣信任你，你也善于在现有体系里撬动资源。**但你的资源网络主要还是"家里的"。外面的资本怎么对接、外部的顶尖人才怎么吸引，这对你来说还是新课题。`,
      '基础': `**你善于在家族体系内挖潜，但一到"外面的世界"，你就保守了。**资本运作、外部人才引入——这些你不一定不会，而是没真正试过。但内部资源总有天花板，你的想法越大，这个天花板就越明显。`,
      '待开发': `**你现在的资源获取方式基本还困在家族体系里。**外部资本、顶尖人才——这些对你来说还很陌生。这不是你能力的问题，而是你的资源网络还没铺开。第一步是先走出去接触，不要怕生。`,
    },
    adversity_quotient: {
      '卓越': `**你是那种被否定了还能迂回再来的人——这在二代群体里是最稀有的品质。**在家族和企业的双重压力下还能坚持自己的方向，这种心理韧性比任何业务能力都珍贵。这是你选择高挑战路径最大的底气。`,
      '良好': `**你在压力面前能保持投入，不会轻易放弃。**下一步是在真实的"被否决—迂回—再推进"循环中积累经验——灰度的智慧不是学来的，是练出来的。`,
      '基础': `**你的心理韧性还在建立中——这不是靠上课能改变的。**你需要在"允许犯错、允许被拒绝"的真实环境里积累经验。从小项目开始，在安全边界里试着承受几次失败，这是唯一的路。`,
      '待开发': `**这是需要你认真对待的一个信号——你扛压力的能力还不足以支撑高风险的路径。**有方向有能力但扛不住压力，是最容易让人黯然离场的组合。这个短板不能速成，但可以从小规模的创新项目开始，一步一步练。`,
    },
    ethics_vision: {
      '卓越': `**你的格局已经超越了财富积累本身——你对企业应该有怎样的社会价值有自己的信念。**你把责任和品牌内化到决策里，不是做给别人看，而是你自己就信这个。这为带团队提供了最牢靠的信任基础。`,
      '良好': `**你在商业价值和社会价值之间保持了一个不错的平衡。**品牌声誉对你来说是重要的，长期的考量也在你的视野里。下一步是把价值观更自然地融入每一个经营决策。`,
      '基础': `**你对企业社会责任有认知，但还没真正落地到经营里。**你知道这件事重要，但在做决策的时候，商业回报往往还是排在社会价值前面。让价值观不只是说说，而是变成你做决策时真的会考虑的因素——这是你需要迈出的一步。`,
      '待开发': `**在价值观这件事上，你可能过于关注短期的商业结果了。**这不是对错的问题——但你要知道，地基不牢的后果是，当你走得越快的时候，信任崩塌的风险越大。试着认真想一次：你的企业除了赚钱，对这个世界还有什么意义？`,
    },
  };

  const dimTemplates = templates[key] || templates['strategic_breakthrough'];
  return dimTemplates[level] || `**在${dimName}这个角度，你的表现处于"${level}"水平。**建议通过实战来进一步了解和提升这个方面。`;
}

function buildImpactOnSuccession(key, score, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const impacts = {
    strategic_breakthrough: score >= 3.5
      ? `**你对方向的判断力，是你选择独立创业或领军接班这条路的最大资本。**但"看到"只是起点——这条路能不能走通，还得看你能不能"做到"、有没有人帮你一起做。`
      : `**在你还不能独立判断方向之前，独立掌舵或创业的风险对你是偏高的。**这不是说你不行——而是说你需要先在外部环境里建立自己的行业认知，然后再来做"往哪走"的决策。`,
    execution_disruption: score >= 3.5
      ? `**你是那种"既看得到又做得了"的人——这在执行层面是扎实的资本。**但要撑起更大的角色，你还需要从"会用工具"升级到"用数据做决策"。`
      : `**你的想法和你的行动之间还有一个缺口——这是你目前最需要补的一环。**建议你优先选择需要强执行力的岗位，在"把事做成"的过程中弥合这个缺口。`,
    resource_integration: score >= 3.5
      ? `**你在"内部通"上的能力是你的底牌——老臣信你，你在家族体系里能撬动资源。**但要走向更大的舞台，"外部通"是你下一关——资本和外部人才不会自动找上门。`
      : `**资源这块是你最容易被卡住的地方。**再好的想法，没人没钱也落不了地。建议你优先找一个能接触外部资源网络的环境——不是让你马上学会融资，而是先让外面的世界认识你。`,
    adversity_quotient: score >= 3.5
      ? `**你的心理韧性是你最厚的底牌——这在二代里太稀有了。**被否了还能迂回再来，这种品质在家族企业的复杂环境里，比业务能力更能决定你能走多远。选高挑战的路，你扛得住。`
      : `**扛不住压力是你最需要认真对待的短板——这个不是上课能补的。**有想法但被拒绝几次就放弃了，这是最可惜的。你需要真实的、有安全边界的历练环境，从小项目开始慢慢练。`,
    ethics_vision: score >= 3.5
      ? `**你的格局和价值观让你在推动变革时有一个独特优势——你说的对的话，别人会信你。**当你的方向与社会价值相关联时，那些来自家族内部的阻力会自然消解。这是你最重要的"理念杠杆"。`
      : `**价值观这件事你不要轻视——它是你职业发展的地基。**地基不牢，任何路径走到后面都会遇到信任危机。试着花时间想清楚：除了赚钱，你做的事对别人有什么意义？`,
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

  return `**你的三层能力不是均匀的——${
    topIsStrongest ? '方向感是你最亮眼的一层，但光有方向不够，中层和底层能不能撑住才是关键。你想得清楚，但要做得出来、扛得住压力，才不是一个"只会想不会做"的人' :
    midIsStrongest ? '落地能力是你最扎实的一层——执行力强、资源也撬得动。但别让"做得好"掩盖了"看不清"的问题。在错误的方向上做得好，比不做还危险' :
    '根基感是你最深的一层——你有韧性和格局，这是走得远的底气。但方向感和落地能力是你的天花板，它们决定了你脚下的路能选多远'
  }。**顶层方向感（看方向）处于${topLevel}，中层落地感（做事情+撬资源）处于${midLevel}，底层根基感（扛压力+价值观）处于${bottomLevel}。三层的不均衡决定了什么样的路对你最划算——补齐最短的那块，远比继续拉长最长的更有价值。`;
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
