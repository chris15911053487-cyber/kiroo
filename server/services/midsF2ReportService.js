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

1. **我身上独特的光芒是什么？**——读完第一段就能挺直腰
2. **我尚未被释放的潜能在哪？**——那些"还没机会"但"一旦激活就不得了"的地方
3. **我接下来往哪个方向走？**——不是定终局，是选下一步

---

## 二、怎么写——核心原则

**先看优势，再看空间**：每个维度把优势和成长空间都说清楚。成长空间不是缺点，是还没画完的地图。

**让他认出自己**：选一个他自己知道但从未说出口的特点来写。真正打动人的反馈不是"分析得很准"，而是"对，就是这样"。

**条目得分如实展示，不逐条解读**：每个维度解读完核心优势和成长空间后，用entryHighlights列出该维度全部条目及得分（仅含序号+原文+分数，不加评语）。成长空间中可以适度点名1-2个极低分条目。

**结论先行，一句见血**：每个维度的第一句话就是你对这个人的核心判断。五个维度开头不能雷同。

**交叉不孤立**：维度之间要联动（协同放大/补偿掩盖/潜力激活）。

**总分结构**：每段第一句**粗体**核心判断，后续展开。

**像朋友聊天，不用术语**：禁用——赋能、闭环、抓手、底层逻辑、认知升级、心智模型。整篇用"你"来写。

**要让他感到被理解，不是被分析。**

---

## 三、五个维度三层结构

- **顶层·方向感**：战略破局力 → 他怎么回答"往哪走"
- **中层·落地感**：执行颠覆力 + 资源整合力 → 他怎么回答"怎么走"
- **底层·根基感**：逆商与灰度 + 伦理与格局 → 他能不能走得远

水平参考：4.5–5.0 卓越 | 3.5–4.4 良好 | 2.5–3.4 基础 | 1.0–2.4 待开发

---

## 四、测评数据

**被测评人姓名**：{{USER_NAME}}
**年龄**：{{AGE}}
**学历**：{{EDUCATION}}
**行业**：{{INDUSTRY}}
**进入家族企业年限**：{{YEARS_IN_BUSINESS}}
**就职意向**：{{GRADUATION_INTENT}}
**专业**：{{MAJOR}}

### 各维度得分
{{DIMENSION_TABLE}}

### 各条目得分明细（你的判断依据）
{{ENTRY_TABLES}}

### S-P-F 路径参考
{{SPF_TABLE}}

---

## 五、输出 JSON 结构

{
  "uniqueGene": "15-20字标签，带引号。如：'逆商与灰度驱动的领军接班者'。整份报告的文眼。",
  "frameworkExplanation": "~80字。直接说出他独特的组合是什么——双长板、底层根基、待激活的是什么。",
  "dimensionOverview": [
    { "dimensionKey": "...", "dimensionName": "...", "score": 0, "position": "15-25字人话定位标签" }
  ],
  "comprehensiveOverview": {
    "totalScore": {{TOTAL_SCORE}}, "scoreLabel": "{{SCORE_LABEL}}",
    "overallAssessment": "~100字整体解读。指出结构特征，用一句话概括个性画像。",
    "spfConclusion": {
      "sScore": {{S_SCORE}}, "pScore": {{P_SCORE}}, "fScore": {{F_SCORE}},
      "decisionPath": "{{DECISION_PATH}}", "decisionLabel": "{{DECISION_LABEL}}", "decisionEmoji": "{{DECISION_EMOJI}}",
      "reasoning": "为什么是这条路（~80字）。"
    }
  },
  "dimensionInsights": [
    {
      "dimensionKey": "strategic_breakthrough", "dimensionName": "战略破局力",
      "tier": "顶层·方向感", "score": 0, "level": "...",
      "entryAnalysis": [{ "sequence": 1, "text": "条目原文", "score": 0, "comment": "15-25字信号" }],
      "coreStrength": "◈ 您独到的地方——80-120字。第一句粗体核心判断。展开：这个特点意味着什么？在什么场景下有价值？",
      "growthSpace": "◈ 您的成长空间——80-120字。点名1-2分条目。建议交叉引用其他维度优势。",
      "entryHighlights": [{ "sequence": 1, "text": "条目原文", "score": 0 }],
      "careerInsight": "◈ 这个维度对您的真实含义——60-100字。直接告诉他该往哪个方向走。"
    }
  ],
  "barrelPrinciple": {
    "longBoards": [{ "name": "准确描述长板", "score": 0, "description": "为什么是核心竞争力" }],
    "shortBoards": [{ "name": "具体短板名称", "score": 0, "fixPath": "有效补短方式" }],
    "coreCompetitiveness": "40-60字核心竞争力一句话。"
  },
  "developmentSuggestions": {
    "integratedJudgment": { "tierSummary": "~100字。底盘→中层→顶层各处于什么状态，这个结构意味着什么。" },
    "developmentDirection": "~80字。先激活什么、再强化什么。",
    "capabilityImprovements": [
      { "dimensionKey": "xxx", "dimensionName": "xxx", "direction": "15-25字方向", "reason": "40-80字。这个方向如何撬动已有优势。" }
    ],
    "supplementarySuggestions": {
      "targetedTraining": "▎小标题分段。▎为什么是你的加速器 + ▎方向一/二/三，每项含结业标准和对你的意义。",
      "talentIncubator": "▎小标题分段。▎为什么传统就业太慢 + ▎你会经历什么 + ▎为什么适合你。"
    },
    "stakeholderAdvice": "▎与父辈及团队沟通建议（~120字）。直接建议句式，至少覆盖父辈和团队。"
  },
  "summary": "~120字。回顾最亮眼的光芒+当前需补的短板+下一步。温暖收尾。"
}

**字段数量：**
- dimensionOverview：恰好5个
- dimensionInsights：恰好5个
- entryAnalysis + entryHighlights：每维度全部条目
- barrelPrinciple.longBoards：2-3条，shortBoards：1-3条
- capabilityImprovements：2-3条

---

请严格按照以上风格，生成完整的 JSON 测评报告。让读者感到被理解，而不是被分析。`;

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
    EDUCATION: userInfo?.education || '未提供',
    INDUSTRY: userInfo?.industry || '未提供',
    YEARS_IN_BUSINESS: userInfo?.yearsInBusiness || '未提供',
    GRADUATION_INTENT: userInfo?.graduationIntention || '未提供',
    MAJOR: userInfo?.major || '未提供',
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

  // 构建降级 uniqueGene
  const topDim = [...dims].sort((a, b) => (dimensionScores[b] ?? 0) - (dimensionScores[a] ?? 0))[0];
  const topDimName = MIDS_DIMENSION_NAMES[topDim];
  const uniqueGene = `${topDimName}驱动的${dec.label}者`;

  // 构建降级 dimensionOverview（人话定位标签）
  const dimensionOverview = dims.map(key => ({
    dimensionKey: key,
    dimensionName: MIDS_DIMENSION_NAMES[key],
    score: Math.round((dimensionScores[key] ?? 0) * 100) / 100,
    position: buildPositionLabel(key, dimensionScores[key] ?? 0),
  }));

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
      coreStrength: buildCoreStrength(key, score, level, name),
      growthSpace: buildGrowthSpace(key, score, dimensionScores, name),
      entryHighlights: entries.map(e => ({
        sequence: e.sequence,
        text: e.text,
        score: e.score,
      })),
      careerInsight: buildCareerInsight(key, score, level, name),
      // 向后兼容
      analysis: buildDimensionAnalysis(key, score, level, name),
      impactOnSuccession: buildImpactOnSuccession(key, score, name),
    };
  });

  const improvements = buildCapabilityImprovements(dimensionScores);
  const { longBoards, shortBoards } = buildBarrelBoards(dimensionScores, dims);

  return {
    reportType: 'mids-f2',
    _aiGenerated: false,
    userName: name,
    education: userInfo?.education || '',
    graduationIntention: userInfo?.graduationIntention || '',
    major: userInfo?.major || '',
    uniqueGene,
    frameworkExplanation: `我们从五个角度看到了你的光芒——战略破局力、执行颠覆力、资源整合力、逆商与灰度、伦理与格局。它们拼在一起，构成了一个等待被点燃的职业肖像。`,
    dimensionOverview,
    comprehensiveScore: totalScore,
    comprehensiveOverview: {
      totalScore,
      scoreLabel: getScoreLevel(totalScore / 20),
      overallAssessment: `**你的特质组合不是平均的——有些地方特别亮眼，有些地方还需要时间。**五个角度的得分各有高低，这不是好坏的问题，而是帮你找到适合自己的路。有短板不可怕，可怕的是不知道短板在哪。`,
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
    barrelPrinciple: {
      longBoards,
      shortBoards,
      coreCompetitiveness: buildCoreCompetitiveness(longBoards, shortBoards, name),
    },
    developmentSuggestions: {
      integratedJudgment: {
        tierSummary: buildTierSummary(dimensionScores, name),
      },
      developmentDirection: `**对你来说，"${dec.label}"是你当前画像自然指向的方向。**不用急着把每个短板都补齐——先关注那个当前影响最大的，让你的优势有更大的舞台。`,
      capabilityImprovements: improvements,
      supplementarySuggestions: {
        targetedTraining: `**▎为什么这是你的加速器**
这是你当前阶段成长速度最快的路径——不是上课，是用可验证的输出倒逼能力生长。每一门培训的终点都不是"听懂了"，而是"做出了一个让关键人信服的东西"。

**▎方向一：战略思维工作坊**
结业标准：亲手拆解一个你完全陌生的行业，交出一份有独立判断的报告。
这对你的意义：当你下次向父辈提案时，手里有一份自己做的行业研判，不再是"我感觉"，而是"我分析过"。

**▎方向二：资本运作实战营**
结业标准：完成一个微型并购模拟，或独立做一场融资路演。
这对你的意义：第一次真正"摸到钱的感觉"——资本不再是课本上的概念，而是你手里运转过的工具。

**▎方向三：数据决策训练**
结业标准：用你自己的项目数据跑出一个让团队愿意跟的决策依据。
这对你的意义：让你的直觉配上数据望远镜，从此提案不再只有热情，还有让人闭嘴的数字。`,

        talentIncubator: `**▎为什么传统就业对你来说太慢了**
一份普通工作能给你的是经验，但给不了你两样东西——独立判断行业方向的能力，和一群跟你处于同样阶段的同路人。而定制孵化器用2-3年时间，同时解决这两个问题。

**▎你会经历什么**
不是"被安排"——而是在不同行业、不同职能的实战项目中轮转，亲手画出自己的方向地图。不是"有导师"——而是由战略、资本、运营等不同领域的实战导师组成陪跑团，在你做每一个关键决策时有人点拨。不是"一个人扛"——而是跟一群跟你有相似背景、相似困惑的二代在一起，互相激发、互相验证。

**▎为什么这适合你**
你当前最需要的不是一份工作，而是一个能让你安全试错、快速验证、系统性补齐方向感和资源网络的环境。最终在导师护航下独立操盘一个从0到1的商业项目——这个项目的成功或失败，都比你做三年边缘岗位学到的多得多。用2-3年，换一次真正的跃升。`,
      },
      stakeholderAdvice: `对父辈："我需要亲手绘制一张行业地图，才能把家业带得更稳。"对团队：让他们看到你躬身入局，用行动而非头衔赢得信任——团队看到你愿意沉下去，他们才会愿意跟你走。`,
    },
    summary: `**你不需要变成另一个人——你只需要知道现在自己的长板和短板在哪，然后选一条适合自己的路。**方向感、落地力、根基感这三层，不均衡是常态。关键是让你突出的那个成为你的标签，让暂时滞后的那个不至于拖累你。先突破当前该优先投入精力的那个点，其他的慢慢来。`,
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

// ==================== 降级报告新增辅助函数 ====================

function buildPositionLabel(key, score) {
  const labels = {
    strategic_breakthrough: score >= 4.5 ? '方向感敏锐——跨界嗅觉是你的天然雷达'
      : score >= 3.5 ? '敏锐但待独立——有好眼睛，还没学会自己看地图'
      : score >= 2.5 ? '方向感在觉醒——还需要亲手画第一张地图'
      : '空白地图——当前值得优先激活的维度',
    execution_disruption: score >= 4.5 ? '突出长板——你的核心利器'
      : score >= 3.5 ? '落地能力强——差一个完整的实战闭环来引爆'
      : score >= 2.5 ? '执行力在积累——需要第一次完整的项目历练'
      : '想法和行动之间还有距离——优先补的短板',
    resource_integration: score >= 4.5 ? '资源高手——内外通吃的联结者'
      : score >= 3.5 ? '潜力巨大——内部通但外部资本是空白地图'
      : score >= 2.5 ? '资源网络在起步——需要走出家族圈子'
      : '资源获取被局限——第一步是先走出去接触',
    adversity_quotient: score >= 4.5 ? '突出长板——你的护城河，二代群体中少见'
      : score >= 3.5 ? '韧性强——能在压力下保持投入，需要更多实战淬炼'
      : score >= 2.5 ? '韧性在建立中——需要安全边界内的试错历练'
      : '扛压力待加强——这是不能速成但很关键的一环',
    ethics_vision: score >= 4.5 ? '格局超越财富——你的价值观是团队的信任基石'
      : score >= 3.5 ? '长期主义者——社会责任视角在萌芽中'
      : score >= 2.5 ? '商业导向为主——价值观落地需要更具体的实践'
      : '地基待夯实——走得更快之前，先想清楚为什么而走',
  };
  return labels[key] || '待评估';
}

function buildCoreStrength(key, score, level, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const templates = {
    strategic_breakthrough: {
      '卓越': `**跨界嗅觉敏锐，变革意识强烈——您是天生善于捕捉技术与产业交汇点的人。**

您对新技术的感知力不是泛泛的敏感，而是一种"技术-场景"配对本能。更难得的是，您敢于在逆周期时出手，敢于质疑旧模式——这些不是学来的，是您感知世界的方式。`,
      '良好': `**行业嗅觉不错，跨界思维能让您识别到大多数人忽略的机会。**

您对新技术和宏观趋势保持敏感，在冒进和保守之间找到了平衡。接下来要做的，是把"看到"变成能说清楚、能执行的具体判断。`,
      '基础': `**您的方向感正在觉醒——这是重要的第一步。**

您对行业趋势有感知，但要把趋势拆解成业务动作时，手里还缺一套独立的判断框架。这不单是认知问题，更多是还没获得独立做判断的实战机会。`,
      '待开发': `**"往哪走"这件事，目前主要靠外部输入——这是当前值得优先投入的方向。**

不是说您不聪明，而是还没有独立判断一个行业方向的经验。这张空白地图，需要在实践中一笔一笔画出来。`,
    },
    execution_disruption: {
      '卓越': `**您是"看到了就会去做"的人——这在二代里很难得。**

数字化工具用得上手，"小步快跑"的试错方式也习惯。您能把一个想法变成团队的行动，这是画像里很扎实的一块。`,
      '良好': `**您能把想法落地，对新技术也持开放态度。**

标准化、数字化、快速迭代——这些都是您的武器。从"我觉得可以试试"到"数据告诉我应该这样做"，是您下一步要跨的坎。`,
      '基础': `**在"想到"和"做到"之间，您还有一段距离。**

想得很清楚，但执行时还是习惯用传统方式。在数字化已经是标配的今天，这个习惯会让您的方案缺说服力。`,
      '待开发': `**从想法到落地，中间缺了一大段。**

您可能有很多好点子，但推动执行时会发现使不上劲。这不怪您——缺的是 0→1 的实战经历。`,
    },
    resource_integration: {
      '卓越': `**您能在家族内外之间搭桥——这是从"做事的人"走向"带资源的人"的关键标志。**

既能理解老臣的想法，又知道外面有哪些资源可以引入。这种"内通外通"的能力很珍贵。`,
      '良好': `**您在内部资源上做得不错——老臣信任您，您也善于在现有体系里撬动资源。**

但资源网络主要还是"家里的"。外面的资本怎么对接、外部顶尖人才怎么吸引，是您的新课题。`,
      '基础': `**您善于在家族体系内挖潜，但一到"外面的世界"，就保守了。**

资本运作、外部人才引入——您不一定不会，而是没真正试过。内部资源总有天花板，想法越大，天花板越明显。`,
      '待开发': `**资源获取方式基本困在家族体系里。**

外部资本、顶尖人才对您来说还很陌生。这不是能力问题，而是资源网络还没铺开。第一步是先走出去接触，不要怕生。`,
    },
    adversity_quotient: {
      '卓越': `**被否定后迂回再试——这是您身上独特的光芒，是二代群体里难得的品质，是您的"护城河"。**

您有延迟满足的基因，能在亲情与制度之间保持理性，还愿意放下身段从基层做起。这些品质加在一起，构成了一个很坚韧的内核。`,
      '良好': `**您在压力面前能保持投入，不会轻易放弃。**

灰度决策的能力还需要在真实的"被否决—迂回—再推进"循环中积累——灰度的智慧不是学来的，是练出来的。`,
      '基础': `**您的心理韧性还在建立中——这不是靠上课能改变的。**

需要在"允许犯错、允许被拒绝"的真实环境里积累经验。从小项目开始，在安全边界里试着承受几次失败，这是一条值得走的路。`,
      '待开发': `**这是需要认真对待的一个信号——扛压力的能力还不足以支撑高风险路径。**

有方向有能力但扛不住压力，容易让人受挫。这个短板不能速成，但可以从小规模项目开始一步一步练。`,
    },
    ethics_vision: {
      '卓越': `**您的格局已超越财富积累本身——对企业应该有怎样的社会价值有自己的信念。**

把责任和品牌内化到决策里，不是做给别人看，而是自己就信这个。这为带团队提供了牢靠的信任基础。`,
      '良好': `**您在商业价值和社会价值之间保持了一个不错的平衡。**

品牌声誉对您来说是重要的，长期的考量也在视野里。下一步是把价值观更自然地融入每一个经营决策。`,
      '基础': `**您对企业社会责任有认知，但还没真正落地到经营里。**

知道重要，但做决策时商业回报往往排在社会价值前面。让价值观不只是说说，而是变成决策时真的会考虑的因素。`,
      '待开发': `**在价值观这件事上，可能过于关注短期商业结果了。**

不是对错的问题——但地基不牢的后果是，当您走得更快时，信任崩塌的风险越大。试着认真想一次：企业除了赚钱，对世界还有什么意义？`,
    },
  };

  const dimTemplates = templates[key] || templates['strategic_breakthrough'];
  return dimTemplates[level] || `**在${dimName}这个角度，您展现了独特的潜力。**通过实战来释放和进一步锤炼这个方面是值得的。`;
}

function buildGrowthSpace(key, score, dimensionScores, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const level = getScoreLevel(score);
  // 找另一个高分维度做交叉引用
  const otherDims = MIDS_DIMENSION_ORDER.filter(k => k !== key);
  const highDim = otherDims.sort((a, b) => (dimensionScores[b] ?? 0) - (dimensionScores[a] ?? 0))[0];
  const highDimName = MIDS_DIMENSION_NAMES[highDim];

  const growthTemplates = {
    strategic_breakthrough: `**您目前对行业方向的判断，更多还是在参考外部经验——您自己也感觉到了，但还没找到独立判断的方法。**好消息是，您在${highDimName}上的优势意味着：一旦您开始亲手分析行业、拆解技术应用场景，您将比别人更快形成自己的判断框架。您缺的不是能力，是一次让您独立完成行业研判的实战机会。`,
    execution_disruption: `**您目前更依赖直觉做判断——这是您的风格，但面对新赛道时直觉会失效。**有意思的是，您在${highDimName}上的禀赋正好能帮您：给直觉配一副"数据望远镜"，让您看到更远、更精确的落点。数据不是要取代直觉，而是放大直觉的价值。`,
    resource_integration: `**您对资本运作的陌生，不是短板，而是一张等待亲手绘制的空白地图。**您目前更依赖业务手段而非资本手段解决问题，但这只是因为您还未真正进入那个领域。值得关注的是，您在${highDimName}上的高分意味着您完全有能力承受学习资本运作过程中的试错成本——一旦入门，成长会很快。`,
    adversity_quotient: `**您偶尔会被孤独感困扰，但这恰恰证明您是一个有温度的人。**面对不确定性时的孤独感，不是弱点，而是对自己有期待的证明。有意思的是，您在${highDimName}上的天赋正好能帮您——当您学会在团队中找到"同路人"，孤独感自然会转化为归属感。`,
    ethics_vision: `**您目前对社会责任和环保的关注还不够深入，但这只是因为注意力还集中在商业逻辑上——一旦开始实践，这个视角会自然生长出来。**有趣的是，您在${highDimName}上的敏锐正好能帮您——从"用新技术解决一个小社会问题"开始，这会同时激活两个维度。`,
  };

  return growthTemplates[key] || `**在${dimName}方面，您还有尚未释放的成长空间。**结合您在${highDimName}上的优势，这条成长路径会比想象中更快。`;
}

function buildCareerInsight(key, score, level, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const insights = {
    strategic_breakthrough: score >= 3.5
      ? `**您不需要成为"天天想大事"的战略家，那会浪费您的执行力天赋。**您需要的是建立一套属于自己的判断框架——能让您在面对新机会时快速回答"值不值得做、从哪切入、怎么测试"的决策逻辑。这是从"优秀执行者"跃升为"能独当一面的将领"的关键一跃。`
      : `**在拥有自己的"方向地图"之前，先到外部环境中锤炼判断力。**先练就"看见"的本领，再施展"做到"的威力。这段探索不是绕路，而是宝贵的成长投资。`,
    execution_disruption: score >= 3.5
      ? `**您的执行力已经很强，需要的是一套完整的"从0到1"实战闭环。**一个让您从想法到落地、从试错到规模化的完整项目。这个经历会让您从"优秀的执行者"变成"能打硬仗的将领"。`
      : `**先找一个完整的项目从头跟到尾——不需要大，但要从想法到落地全程参与。**建立"我能把事做成"的信心比学任何方法论都重要。`,
    resource_integration: score >= 3.5
      ? `**您不需要先学会资本运作再行动——先在实战项目里"做中学"。**您的共情力和跨界嫁接能力会帮您打开第一扇门，资本运作能力会在过程中自然生长。`
      : `**资源网络的第一步不是"学会整合"，而是"走出去接触"。**先让外面的世界认识您，再谈撬动资源。这个过程比任何课程都有效。`,
    adversity_quotient: score >= 3.5
      ? `**您的韧性是重要的资产，但不要把它当作独自扛着所有事的理由。**学会在团队中找到同路人，把坚韧转化为团队的凝聚力——那时，您将不只是一个人走得快，而是一群人走得远。`
      : `**在安全边界内从小项目开始淬炼韧性。**不需要一次扛大压力——先从小规模的创新项目开始，在"允许失败"的环境里积累被拒绝后迂回的经验。`,
    ethics_vision: score >= 3.5
      ? `**您的格局不需要被"教育"，只需要被"点燃"。**找一个您真正关心的社会问题，用您的技术嗅觉和执行力去解决它——哪怕一个小项目。那次经历会让您发现：做好事和做好生意，从来不是两件事。`
      : `**试着认真想一次：您的企业除了赚钱，对这个世界还有什么意义？**找一个小的切入点，把价值观从理念变成行动——哪怕是一个公益项目或一项员工福利改革。`,
  };
  return insights[key] || `**在${dimName}方面，找到属于您的独特路径。**`;
}

function buildBarrelBoards(dimensionScores, dims) {
  const sorted = dims.map(key => ({
    key,
    name: MIDS_DIMENSION_NAMES[key],
    score: Math.round((dimensionScores[key] ?? 0) * 100) / 100,
  })).sort((a, b) => b.score - a.score);

  const longBoards = sorted.slice(0, 2).map(d => ({
    name: `${MIDS_DIMENSION_NAMES[d.key]}优势`,
    score: d.score,
    description: getLongBoardDescription(d.key, d.score),
  }));

  const shortBoards = sorted.slice(-2).reverse().filter(d => d.score < 3.5).map(d => ({
    name: MIDS_DIMENSION_NAMES[d.key],
    score: d.score,
    fixPath: getShortBoardFixPath(d.key, d.score),
  }));

  return { longBoards, shortBoards: shortBoards.length > 0 ? shortBoards : [sorted[sorted.length - 1]].map(d => ({
    name: MIDS_DIMENSION_NAMES[d.key],
    score: d.score,
    fixPath: '在实战中逐步提升该维度能力',
  })) };
}

function getLongBoardDescription(key, score) {
  const descs = {
    strategic_breakthrough: '对行业方向和新技术的嗅觉敏锐，能识别逆周期布局的机会——这是"领军"路上稀缺的资本',
    execution_disruption: '能把想法落地、把复杂变简单、把流程标准化——是团队从"想到"到"做到"的桥梁',
    resource_integration: '能在家族内外之间搭桥，撬动资源——从"做事的人"走向"带资源的人"',
    adversity_quotient: '被否定后能迂回再试——二代群体中难得的心理品质，是选择高挑战路径的底气',
    ethics_vision: '格局超越财富积累本身——为企业使命和团队信任提供了牢靠的根基',
  };
  return descs[key] || '具有独特的优势，是您核心竞争力的一部分';
}

function getShortBoardFixPath(key, score) {
  const paths = {
    strategic_breakthrough: '在外部环境中亲手分析行业、拆解技术应用场景，建立独立判断框架',
    execution_disruption: '从一个小项目开始，用数据验证决策，建立"数据+直觉"双轨习惯',
    resource_integration: '在实战项目中"做中学"，先接触外部资本网络，再尝试小型交易',
    adversity_quotient: '在安全边界内从小项目开始历练，积累"被拒绝—迂回—再推进"的经验',
    ethics_vision: '找一个关心的社会问题，用技术和执行力去解决它——从一个小项目开始落地',
  };
  return paths[key] || '在实战中针对性提升';
}

function buildCoreCompetitiveness(longBoards, shortBoards, name) {
  const lbNames = longBoards.map(l => l.name).join(' + ');
  const sbNames = shortBoards.map(s => s.name).join('、');
  return `您独特的竞争力组合是"${lbNames}"——这是您区别于其他二代群体的独特底色。目前${sbNames}是您成长空间较大的领域，但您的长板恰好能帮您补上这些短板。`;
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

      // 合并 AI 生成内容 + 系统计算兜底数据 + 新字段兜底
      const fallback = buildFallbackReport(dimensionScores, midsF2Result, userInfo);

      return {
        reportType: 'mids-f2',
        _aiGenerated: true,
        userName: userInfo?.name || parsed.userName || '被测者',
        education: userInfo?.education || parsed.education || '',
        graduationIntention: userInfo?.graduationIntention || parsed.graduationIntention || '',
        major: userInfo?.major || parsed.major || '',

        // 新字段：AI 优先，降级兜底
        uniqueGene: parsed.uniqueGene || fallback.uniqueGene,
        frameworkExplanation: parsed.frameworkExplanation || fallback.frameworkExplanation,
        dimensionOverview: parsed.dimensionOverview || fallback.dimensionOverview,

        comprehensiveScore: parsed.comprehensiveOverview?.totalScore ?? midsF2Result.totalScore ?? 0,
        comprehensiveOverview: {
          ...parsed.comprehensiveOverview,
          spfConclusion: {
            ...(parsed.comprehensiveOverview?.spfConclusion || {}),
            sScore: midsF2Result.sScore ?? 0,
            pScore: midsF2Result.pScore ?? 0,
            fScore: midsF2Result.fScore ?? 0,
            decisionPath: midsF2Result.decisionPath || 'further_study',
            decisionLabel: midsF2Result.decisionLabel || '',
            decisionEmoji: midsF2Result.decisionEmoji || '',
          },
        },

        dimensionInsights: parsed.dimensionInsights.map((insight, i) => ({
          ...insight,
          dimensionKey: insight.dimensionKey || MIDS_DIMENSION_ORDER[i] || 'strategic_breakthrough',
          dimensionName: insight.dimensionName || MIDS_DIMENSION_NAMES[insight.dimensionKey || MIDS_DIMENSION_ORDER[i]] || '',
          tier: insight.tier || MIDS_DIMENSION_TIERS[insight.dimensionKey || MIDS_DIMENSION_ORDER[i]] || '',
          score: typeof insight.score === 'number' ? insight.score : (dimensionScores[insight.dimensionKey || MIDS_DIMENSION_ORDER[i]] ?? 0),
          level: insight.level || getScoreLevel(dimensionScores[insight.dimensionKey || MIDS_DIMENSION_ORDER[i]] ?? 0),
        })),

        // 木桶原理：AI 优先，降级兜底
        barrelPrinciple: parsed.barrelPrinciple || fallback.barrelPrinciple,

        developmentSuggestions: {
          ...parsed.developmentSuggestions,
          supplementarySuggestions: parsed.developmentSuggestions?.supplementarySuggestions
            || fallback.developmentSuggestions.supplementarySuggestions,
        },

        summary: parsed.summary || fallback.summary,
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

  const fallback = buildFallbackReport(dimensionScores, midsF2Result, userInfo);

  return {
    reportType: 'mids-f2',
    _aiGenerated: true,
    userName: name,
    education: userInfo?.education || '',
    graduationIntention: userInfo?.graduationIntention || '',
    major: userInfo?.major || '',
    uniqueGene: parsed.uniqueGene || fallback.uniqueGene,
    frameworkExplanation: parsed.frameworkExplanation || fallback.frameworkExplanation,
    dimensionOverview: parsed.dimensionOverview || fallback.dimensionOverview,
    comprehensiveScore: parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0,
    comprehensiveOverview: {
      totalScore: parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0,
      scoreLabel: getScoreLevel((parsed.comprehensiveScore ?? midsF2Result.totalScore ?? 0) / 20),
      overallAssessment: parsed.coreEvaluation || fallback.comprehensiveOverview.overallAssessment,
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
    barrelPrinciple: parsed.barrelPrinciple || fallback.barrelPrinciple,
    developmentSuggestions: {
      integratedJudgment: parsed.developmentSuggestions?.integratedJudgment || { tierSummary: '' },
      developmentDirection: parsed.developmentSuggestions?.developmentDirection || '',
      capabilityImprovements: (parsed.careerSuggestions || []).map(s => ({
        dimensionKey: '',
        dimensionName: '',
        direction: s,
        reason: '',
      })),
      supplementarySuggestions: parsed.developmentSuggestions?.supplementarySuggestions
        || fallback.developmentSuggestions.supplementarySuggestions,
      stakeholderAdvice: parsed.developmentSuggestions?.stakeholderAdvice || '',
    },
    summary: parsed.summary || fallback.summary,
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

// ==================== 降级报告辅助函数 ====================


function buildDimensionAnalysis(key, score, level, name) {
  const dimName = MIDS_DIMENSION_NAMES[key];
  const templates = {
    strategic_breakthrough: {
      '卓越': `**你对行业方向的判断已经超出了同龄人——不只是在父辈的框架里改良，而是有自己的独立视角。**你能看到逆周期布局的机会，能把宏观趋势转化成业务判断。这是"领军"这条路上稀缺的资本。`,
      '良好': `**你对行业变化有不错的嗅觉，跨界思维能让你识别到机会。**在冒进和保守之间你找到了一个相对平衡的位置。接下来要做的，是把"看到"变成能说清楚、能执行的具体判断——让别人信你不仅是有感觉，而是有判断。`,
      '基础': `**你看方向的时候，更多还是在参考父辈的经验——你自己也感觉到了，但还没找到独立判断的方法。**你对行业趋势有感知，但要把趋势拆解成业务动作时，你会觉得手里缺工具。这不单是认知问题，更多是你还没获得独立做判断的实战机会。`,
      '待开发': `**你在"往哪走"这件事上，目前主要靠外部输入——父辈怎么说、行业怎么做，你就怎么跟。**这不是说你不聪明，而是你还没有独立判断一个行业方向的经验。这是你现在值得优先投入的方向，而且需要在外部环境中补。`,
    },
    execution_disruption: {
      '卓越': `**你是那种"看到了就会去做"的人——这在二代里很难得。**数字化工具你用得上手，"小步快跑"的试错方式你也习惯。你能把一个想法变成团队的行动，这是你画像里很扎实的一块。`,
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
      '卓越': `**你是那种被否定了还能迂回再来的人——这在二代群体里是难得的品质。**在家族和企业的双重压力下还能坚持自己的方向，这种心理韧性比任何业务能力都珍贵。这是你选择高挑战路径重要的底气。`,
      '良好': `**你在压力面前能保持投入，不会轻易放弃。**下一步是在真实的"被否决—迂回—再推进"循环中积累经验——灰度的智慧不是学来的，是练出来的。`,
      '基础': `**你的心理韧性还在建立中——这不是靠上课能改变的。**你需要在"允许犯错、允许被拒绝"的真实环境里积累经验。从小项目开始，在安全边界里试着承受几次失败，这是一条值得走的路。`,
      '待开发': `**这是需要你认真对待的一个信号——你扛压力的能力还不足以支撑高风险的路径。**有方向有能力但扛不住压力，是容易让人受挫的组合。这个短板不能速成，但可以从小规模的创新项目开始，一步一步练。`,
    },
    ethics_vision: {
      '卓越': `**你的格局已经超越了财富积累本身——你对企业应该有怎样的社会价值有自己的信念。**你把责任和品牌内化到决策里，不是做给别人看，而是你自己就信这个。这为带团队提供了牢靠的信任基础。`,
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
      ? `**你对方向的判断力，是你选择独立创业或领军接班这条路的重要资本。**但"看到"只是起点——这条路能不能走通，还得看你能不能"做到"、有没有人帮你一起做。`
      : `**在你还不能独立判断方向之前，独立掌舵或创业的风险对你是偏高的。**这不是说你不行——而是说你需要先在外部环境里建立自己的行业认知，然后再来做"往哪走"的决策。`,
    execution_disruption: score >= 3.5
      ? `**你是那种"既看得到又做得了"的人——这在执行层面是扎实的资本。**但要撑起更大的角色，你还需要从"会用工具"升级到"用数据做决策"。`
      : `**你的想法和你的行动之间还有一个缺口——这是你目前值得优先关注的一环。**建议你优先选择需要强执行力的岗位，在"把事做成"的过程中弥合这个缺口。`,
    resource_integration: score >= 3.5
      ? `**你在"内部通"上的能力是你的底牌——老臣信你，你在家族体系里能撬动资源。**但要走向更大的舞台，"外部通"是你下一关——资本和外部人才不会自动找上门。`
      : `**资源这块是你容易被卡住的地方。**再好的想法，没人没钱也落不了地。建议你优先找一个能接触外部资源网络的环境——不是让你马上学会融资，而是先让外面的世界认识你。`,
    adversity_quotient: score >= 3.5
      ? `**你的心理韧性是你很厚的底牌——这在二代里很难得。**被否了还能迂回再来，这种品质在家族企业的复杂环境里，比业务能力更能决定你能走多远。选高挑战的路，你扛得住。`
      : `**扛不住压力是你需要认真对待的短板——这个不是上课能补的。**有想法但被拒绝几次就放弃了，这很可惜。你需要真实的、有安全边界的历练环境，从小项目开始慢慢练。`,
    ethics_vision: score >= 3.5
      ? `**你的格局和价值观让你在推动变革时有一个独特优势——你说的对的话，别人会信你。**当你的方向与社会价值相关联时，那些来自家族内部的阻力会自然消解。这是你重要的"理念杠杆"。`
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
    strategic_breakthrough: `**看不清方向，你每次向父辈提案都会缺说服力——对方一句"你怎么判断的"就能让你卡住。**你的方向感处于"${level}"水平，独立判断行业的能力是你当前值得优先投入的。`,
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
    topIsStrongest ? '方向感是你很亮眼的一层，但光有方向不够，中层和底层能不能撑住才是关键。你想得清楚，但要做得出来、扛得住压力，才不是一个"只会想不会做"的人' :
    midIsStrongest ? '落地能力是你很扎实的一层——执行力强、资源也撬得动。但别让"做得好"掩盖了"看不清"的问题。在错误的方向上做得好，比不做还危险' :
    '根基感是你很深的一层——你有韧性和格局，这是走得远的底气。但方向感和落地能力是你的天花板，它们决定了你脚下的路能选多远'
  }。**顶层方向感（看方向）处于${topLevel}，中层落地感（做事情+撬资源）处于${midLevel}，底层根基感（扛压力+价值观）处于${bottomLevel}。三层的不均衡决定了什么样的路更适合你——补齐当前最短的那块，远比继续拉长已经突出的更有价值。`;
}

// ==================== 主入口 ====================

/**
 * 生成 MIDS-F2 报告
 * @param {Object} options
 * @param {Object} options.dimensionScores - 维度得分 { strategic_breakthrough, execution_disruption, ... }
 * @param {Object} options.midsF2Result - S-P-F 计算结果（来自 midsF2ScoringService.computeMidsF2）
 * @param {string} [options.userName] - 用户姓名（向后兼容，优先使用 userInfo.name）
 * @param {Object} [options.userInfo] - 用户信息 { name, age, education, industry, yearsInBusiness, graduationIntention }
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
    _aiGenerated: true,  // 标记：AI 成功生成
    userName: effectiveUserInfo.name,
    education: effectiveUserInfo.education || '',
    graduationIntention: effectiveUserInfo.graduationIntention || '',
    major: effectiveUserInfo.major || '',
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

module.exports = { generateMidsF2Report, buildFallbackReport };
