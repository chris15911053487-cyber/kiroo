/**
 * 兰大综合报告 — 生成编排器
 *
 * 职责：
 *   1. 调用AI生成文字解析
 *   2. 解析AI返回的结构化文本
 *   3. 调用chartService生成SVG图表
 *   4. 调用template组装完整HTML
 *   5. 调用docxBuilder生成.docx文件
 */

const { renderLeadershipRadar, renderLeadershipBar, renderHorizontalBar } = require('./lzuChartService');
const { buildReportHTML } = require('./lzuReportTemplate');
const { buildDocx, buildDocxFromHTML } = require('./lzuDocxBuilder');

/**
 * 解析AI返回的结构化文本，按 [SECTION:xxx] 标记切分
 */
function parseAIText(raw) {
  const sections = {
    coreEvaluation: '',
    profileAdvantages: '',
    profileDevelopments: '',
    leadershipInterpretation: '',
    personalityInterpretation: '',
    barrierInterpretation: '',
    barrierSuggestions: '',
    careerSuggestions: '',
    improvementPlan: '',
    comprehensiveDiagnosis: '',
    coreAdvantages: '',
    summary: '',
  };

  const sectionMap = {
    'coreEvaluation': 'coreEvaluation',
    'core_advantages': 'coreAdvantages',
    'profile_advantages': 'profileAdvantages',
    'profile_developments': 'profileDevelopments',
    'leadershipInterpretation': 'leadershipInterpretation',
    'personalityInterpretation': 'personalityInterpretation',
    'barrierInterpretation': 'barrierInterpretation',
    'barrierSuggestions': 'barrierSuggestions',
    'careerSuggestions': 'careerSuggestions',
    'improvementPlan': 'improvementPlan',
    'comprehensiveDiagnosis': 'comprehensiveDiagnosis',
    'summary': 'summary',
  };

  // 使用正则匹配 [SECTION:xxx] 直到下一个 [SECTION: 或文本结尾
  const regex = /\[SECTION:(\w+)\]\s*([\s\S]*?)(?=\[SECTION:\w+\]|$)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    const mappedKey = sectionMap[key];
    if (mappedKey) {
      sections[mappedKey] = value;
    }
  }

  return sections;
}

/**
 * 生成图表SVG
 */
function generateCharts(scores) {
  const l = scores.leadership;
  const b = scores.creativityBarrier;
  const p = scores.personality;

  const leadershipRadar = renderLeadershipRadar(l.s1, l.s2, l.s3, l.s4);
  const leadershipBar = renderLeadershipBar(l.s1, l.s2, l.s3, l.s4);

  const personalityBar = renderHorizontalBar(
    ['创造力潜质', '心理健康', '管理潜能'],
    [p.creativityPotential.raw, p.mentalHealth.raw, p.managementPotential.raw],
    [10, 10, 10],
    ['#8B5CF6', '#10B981', '#3B82F6']
  );

  const barrierBar = renderHorizontalBar(
    ['心理障碍', '认知障碍', '环境与资源障碍'],
    [b.psychological.score, b.cognitive.score, b.environmental.score],
    [b.psychological.max, b.cognitive.max, b.environmental.max],
    ['#EF4444', '#F59E0B', '#3B82F6']
  );

  return { leadershipRadar, leadershipBar, personalityBar, barrierBar };
}

/**
 * 调用DeepSeek API生成文字解析
 */
async function callAIForText(scores, userName) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 30) {
    console.warn('[LZU Generator] DEEPSEEK_API_KEY not configured, using placeholder text');
    return null;
  }

  const prompt = buildAIPrompt(scores, userName);

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
      console.error(`[LZU Generator] DeepSeek API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content || content.length < 100) {
      console.error('[LZU Generator] Empty or too short AI response');
      return null;
    }

    return content;
  } catch (err) {
    console.error('[LZU Generator] AI call error:', err.message);
    return null;
  }
}

/**
 * 构建发送给AI的严格Prompt
 * 参考: D:\AI测评小助手\生成提示词.md
 */
function buildAIPrompt(scores, userName) {
  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const bd = scores.breakdown;

  return `你是兰州大学管理学院资深人才测评专家。请根据以下系统精准计算的测评分数，生成一份专业的文字分析报告。

## 重要规则（必须严格遵守）

1. **你只生成文字解析**，不生成图表、不输出HTML、不输出JSON、不决定排版
2. **所有分数由系统计算**，你只能引用给出的分数，不能修改
3. **正面积极**：用"发展空间"代替"缺点"，用"提升方向"代替"劣势"
4. **有数据支撑**：每条分析都要引用具体分数
5. **具体可操作**：建议不能泛泛而谈，必须能落地执行
6. **风格正式**：使用专业书面语，不用口语、感叹词
7. **禁用词**：不得使用"候选人"，使用"测评对象"或"该同学"

## 输出格式（固定分隔符）

你必须严格使用以下格式输出，每个模块用 [SECTION:xxx] 标记：

[SECTION:coreEvaluation]
一段话（150-250字），正面积极，概括该同学的核心测评发现。基于分数点出最突出的特征。

[SECTION:core_advantages]
- 优势1标题：优势1描述（引用具体分数）
- 优势2标题：优势2描述
- 优势3标题：优势3描述
- 优势4标题：优势4描述
（共4-5项，每项一行）

[SECTION:profile_advantages]
基于得分最高的维度和风格，描述突出优势（1-2句话）

[SECTION:profile_developments]
基于得分最低的维度，描述优先发展项（1-2句话）

[SECTION:leadershipInterpretation]
领导风格详细分析（200-400字）：
- 主导风格分析：为什么该风格突出，对管理意味着什么
- 情境适应性评估：标准差${scores.adaptabilityIndex}（${scores.adaptabilityLevel}），意味着什么
- 风格组合效应：各风格之间的协同/冲突
- 发展建议：如何扩展风格弹性，具体的刻意练习
- 参考规则：
  - S1指令型高分：适合带领经验不足的团队，需注意适度授权
  - S2教练型高分：既注重任务也关注下属成长，适合团队建设期
  - S3支持型高分：善于营造支持性氛围，有利于团队凝聚力
  - S4授权型高分：信任下属并能充分授权，适合管理成熟团队
  - 标准差越小（<1.5）情境适应性越强，越大（>3.0）越需提升

[SECTION:personalityInterpretation]
人格特质分析（200-400字）：
- 创造力潜质${p.creativityPotential.raw}/10（标准${p.creativityPotential.standard}，${p.creativityPotential.level}）：分析含义及对学术/职业的影响
- 心理健康${p.mentalHealth.raw}/10（标准${p.mentalHealth.standard}，${p.mentalHealth.level}）：分析情绪稳定性及压力应对
- 管理潜能${p.managementPotential.raw}/10（标准${p.managementPotential.standard}，${p.managementPotential.level}）：分析管理特质及发展空间
- 三特质组合效应：三者间如何互相影响
- 发展建议：每个维度1条可操作建议
- 等级解读语气：优秀/良好→肯定鼓励，中等→指出空间，稍低/较低→建设性建议

[SECTION:barrierInterpretation]
创造力障碍分析（200-350字）：
- 心理障碍${b.psychological.score}/${b.psychological.max}（${b.psychological.level}）：分析心理层面的创造力阻碍
- 认知障碍${b.cognitive.score}/${b.cognitive.max}（${b.cognitive.level}）：分析认知层面的创造力阻碍
- 环境障碍${b.environmental.score}/${b.environmental.max}（${b.environmental.level}）：分析环境层面的创造力阻碍
- 主要障碍类型：${b.primaryBarrierType}，这意味着什么
- 注意：得分越高表示障碍越少

[SECTION:barrierSuggestions]
- 针对${b.primaryBarrierType}的突破建议1：具体的、可操作的行动
- 建议2
- 建议3
- 建议4
（3-5条具体的、可操作的突破建议，每条以"- "开头）

[SECTION:careerSuggestions]
结合管理类研究生特点（企业管理、创业、咨询、公共管理等方向），推荐3-4个职业方向。每行格式：方向名称|匹配度星级|推荐理由

[SECTION:improvementPlan]
分三个阶段，每阶段2-3条具体行动：
短期（0-6个月）：
- 行动1
- 行动2
中期（6个月-2年）：
- 行动1
- 行动2
长期（2-5年）：
- 行动1
- 行动2

[SECTION:comprehensiveDiagnosis]
综合诊断（200-300字）：
- 综合总分${scores.totalScore}/100，等级${scores.grade}（${scores.gradeDescription}）
- 得分结构拆解：领导力${bd.leadership}/30、人格${bd.personality}/40、创造力${bd.creativityBarrier}/30
- 指出最失分的维度和最有潜力的维度
- 给出发展杠杆点：最优先提升什么

[SECTION:summary]
整体总结（100-150字），正面激励，强调优势与潜力。

## 系统计算的精准数据（直接引用，不可修改）

测评对象：${userName}
综合得分：${scores.totalScore} / 100
评定等级：${scores.grade}（${scores.gradeDescription}）

领导风格维度得分：
- S1指令型：${l.s1} / 7
- S2教练型：${l.s2} / 12
- S3支持型：${l.s3} / 12
- S4授权型：${l.s4} / 12
- 主导风格：${l.dominantStyle}
- 情境适应性指数（标准差）：${scores.adaptabilityIndex}（${scores.adaptabilityLevel}）

人格特质维度得分：
- 创造力潜质：原始${p.creativityPotential.raw}/10，标准${p.creativityPotential.standard}，${p.creativityPotential.level}
- 心理健康：原始${p.mentalHealth.raw}/10，标准${p.mentalHealth.standard}，${p.mentalHealth.level}
- 管理潜能：原始${p.managementPotential.raw}/10，标准${p.managementPotential.standard}，${p.managementPotential.level}

创造力障碍分析：
- 心理障碍：${b.psychological.score}/${b.psychological.max}（${b.psychological.level}）
- 认知障碍：${b.cognitive.score}/${b.cognitive.max}（${b.cognitive.level}）
- 环境与资源障碍：${b.environmental.score}/${b.environmental.max}（${b.environmental.level}）
- 主要障碍类型：${b.primaryBarrierType}

维度加权得分：
- 领导力：${bd.leadership}/30（权重30%）
- 人格特质：${bd.personality}/40（权重40%）
- 创造力：${bd.creativityBarrier}/30（权重30%）

请现在输出文字分析，严格按照 [SECTION:xxx] 格式。`;
}

/**
 * 构建降级占位文字（AI不可用时使用）
 */
function buildFallbackText(scores, userName) {
  const grade = scores.grade;
  const total = scores.totalScore;
  const name = userName || '该同学';

  return {
    coreEvaluation: `${name}综合测评得分${total}分，评定为"${grade}"等级。测评结果显示其在多个维度上具备良好的发展基础，建议结合测评报告中的发展建议，持续提升综合能力。`,
    coreAdvantages: '- 学习能力：具备良好的知识吸收基础\n- 发展潜力：整体得分反映出提升空间\n- 综合素质：多维度均衡发展\n- 职业意识：对自身发展有一定规划',
    profileAdvantages: '根据测评数据，该同学在部分维度上表现突出，显示出良好的发展潜力。',
    profileDevelopments: '部分维度得分处于中等水平，建议在这些领域投入更多精力进行针对性提升。',
    leadershipInterpretation: `领导风格测评显示主导风格为${scores.leadership.dominantStyle}，情境适应性${scores.adaptabilityLevel}（指数: ${scores.adaptabilityIndex}）。建议根据不同的管理情境灵活切换领导风格，增强领导弹性。`,
    personalityInterpretation: `人格特质测评显示创造力潜质${scores.personality.creativityPotential.level}、心理健康${scores.personality.mentalHealth.level}、管理潜能${scores.personality.managementPotential.level}。三项特质反映了个人的基本素质画像，建议重点发展管理潜能和创造力。`,
    barrierInterpretation: `创造力障碍分析显示主要障碍类型为${scores.creativityBarrier.primaryBarrierType}。心理障碍${scores.creativityBarrier.psychological.level}、认知障碍${scores.creativityBarrier.cognitive.level}、环境障碍${scores.creativityBarrier.environmental.level}。`,
    barrierSuggestions: '- 定期进行创造性思维训练，如头脑风暴、跨领域阅读\n- 建立个人创新实践项目，将想法付诸行动\n- 寻找创新导师或同辈社群，获得反馈和激励\n- 每周留出固定时间进行自由探索和思考',
    careerSuggestions: '企业管理（运营/执行）|★★★★☆|综合素质均衡，适合管理岗位\n创业创新|★★★☆☆|有一定创造力基础，可进一步培养\n咨询顾问|★★★★☆|分析能力较好，适合咨询方向\n公共管理|★★★☆☆|社会责任感强，适合公共服务方向',
    improvementPlan: '短期（0-6个月）：\n- 设定明确的个人发展目标\n- 每周进行一次自我复盘\n中期（6个月-2年）：\n- 参与实际项目积累管理经验\n- 系统性学习管理知识\n长期（2-5年）：\n- 在管理岗位上实践和成长\n- 形成个人领导风格',
    comprehensiveDiagnosis: `综合总分${total}/100，位于"${grade}"区间。建议重点关注得分较低的维度，这些是发展杠杆点，投入少量精力即可获得较大提升。`,
    summary: `${name}在本次测评中展现出了良好的发展潜力。${grade}的评定反映了其扎实的素质基础。建议以此次测评为起点，制定个性化发展计划，持续提升综合竞争力。`,
  };
}

/**
 * 主入口：生成完整报告
 */
async function generateReport({ scores, userName, sessionId }) {
  // 1. 调用AI获取文字分析
  const aiRaw = await callAIForText(scores, userName);

  // 2. 解析AI文字或使用降级
  let aiText;
  if (aiRaw) {
    aiText = parseAIText(aiRaw);
    // 合并降级文本填补空缺
    const fallback = buildFallbackText(scores, userName);
    for (const key of Object.keys(fallback)) {
      if (!aiText[key] || aiText[key].length < 5) {
        aiText[key] = fallback[key];
      }
    }
  } else {
    aiText = buildFallbackText(scores);
  }

  // 3. 生成SVG图表
  const charts = generateCharts(scores);

  // 4. 组装HTML（用于管理后台预览）
  const html = buildReportHTML({
    scores,
    aiText,
    charts,
    userName: userName || '测评用户',
    sessionId: sessionId || 0,
  });

  // 5. 生成真正的 .docx 文件（含嵌入图表PNG）
  let docxResult;
  try {
    docxResult = await buildDocx({
      scores,
      aiText,
      userName: userName || '测评用户',
      sessionId: sessionId || 0,
    });
  } catch (docxErr) {
    console.error('[Generator] buildDocx error, fallback to HTML→DOC:', docxErr.message);
    docxResult = await buildDocxFromHTML(html, sessionId);
  }

  return {
    html,
    docxPath: docxResult.path,
    docxBuffer: docxResult.buffer,
    aiText,
    chartsGenerated: true,
  };
}

module.exports = { generateReport, parseAIText };
