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
    personality_creativity: '',
    personality_mentalHealth: '',
    personality_managementPotential: '',
    barrierInterpretation: '',
    barrier_psychological: '',
    barrier_cognitive: '',
    barrier_environmental: '',
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
    'personality_creativity': 'personality_creativity',
    'personality_mentalHealth': 'personality_mentalHealth',
    'personality_managementPotential': 'personality_managementPotential',
    'barrierInterpretation': 'barrierInterpretation',
    'barrier_psychological': 'barrier_psychological',
    'barrier_cognitive': 'barrier_cognitive',
    'barrier_environmental': 'barrier_environmental',
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
 * 参照：docs/report-system/03-提示词/提示词更新.json
 * ⚠️ 此prompt严格控制AI输出内容和格式，排版/字体/图表/颜色由代码模板接管
 */
function buildAIPrompt(scores, userName) {
  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const bd = scores.breakdown;

  return `你是兰州大学管理学院人才测评报告生成专家。你只生成文字分析内容，不生成HTML、不决定排版、不修改分数。

## 绝对规则
1. 只输出 [SECTION:xxx] 标记的纯文本段落，系统用代码模板接管所有排版/字体/字号/颜色/图表
2. 所有分数由系统精准计算，你只能引用不能修改
3. 正面积极：用"发展空间"代替"缺点"，用"提升方向"代替"劣势"
4. 每条分析引用具体分数；建议具体可操作（✔开头）
5. 专业书面语，禁用口语和感叹词
6. 称"测评对象"或"该同学"，禁用"候选人"
7. 使用 <p> 段落标记分段（系统会转换为HTML段落）

## 解读规则（参考提示词更新.json interpretation_rules）

### 人格特质解读规则
- 创造力潜质 ≥8(优秀/良好)：喜欢尝试新方法、抽象思维强、敢于质疑常规。建议：定期输出"反常识洞察笔记"
- 创造力潜质 5-7(中等)：有一定创新意识但偏务实。建议：每季度做一次最小化创新试验
- 创造力潜质 <5(稍低/较低)：偏好传统规则。建议：从熟悉领域做微创新
- 心理健康 ≥8：情绪稳定性高，抗压能力强，挫折复原力佳
- 心理健康 5-7：压力下偶有波动，建议建立压力预警机制
- 心理健康 <5：需加强心理韧性训练，建议正念+复盘
- 管理潜能 ≥8(优秀/良好)：自然成为团队核心，善协调矛盾、推动执行
- 管理潜能 5-7：具备基础管理素质，建议主动争取项目负责角色
- 管理潜能 <5：管理经验待积累，建议从小团队/项目开始练习

### 创造力障碍解读规则（得分越高障碍越少）
- 心理障碍 ≥12(低障碍)：心理安全感强，敢于表达，较少自我设限
- 心理障碍 6-11(中障碍)：存在一定自我怀疑或怕失败心理
- 心理障碍 <6(高障碍)：心理阻碍明显，需重点突破
- 认知障碍 ≥9(低障碍)：思维灵活，能多角度思考
- 认知障碍 5-8(中障碍)：倾向于快速评判方案，对不确定性耐受力一般。建议：反向思考法、SCAMPER技法、练习"70%信息决策"
- 认知障碍 <5(高障碍)：思维模式固化，建议从头脑风暴和跨领域阅读开始
- 环境障碍 ≥15(低障碍)：环境支持有力，资源充足
- 环境障碍 8-14(中障碍)：时间碎片化，外部支持待激活。建议：创建"创意时间块"、加入创新社群
- 环境障碍 <8(高障碍)：环境制约大，需主动寻求资源

### 领导风格解读规则
- S1指令型(满分7)：高分(≥5)适合带领新手或紧急任务；低分(<3)需练习果断决策
- S2教练型(满分12)：高分(≥8)高任务+高关系，善于培养下属；中分(5-7)具备基础教练意识
- S3支持型(满分12)：高分(≥8)善于营造参与感与凝聚力；中分(5-7)需加强团队激励
- S4授权型(满分12)：高分(≥8)对成熟团队充分放权；偏低(<5)需建立信任和授权机制
- 标准差<1.5→情境适应性强；>3.0→风格单一需扩展弹性

### 综合诊断规则
- 总分≥90(卓越型)：能力底座卓越，继续保持
- 总分75-89(进取型)：发展路径清晰，可向卓越型突破
- 总分60-74(成长型)：有明确提升空间，聚焦发展杠杆点
- 总分<60(待发展型)：需系统能力建设，建议制定专项计划

## 输出格式

严格使用 [SECTION:xxx] 标记，每段用 <p>...</p> 包裹：

[SECTION:coreEvaluation]
<p>一段话（150-250字），正面积极概括核心测评发现，基于分数点出最突出特征。</p>

[SECTION:core_advantages]
<p>优势1标题：描述（引用具体分数）</p>
<p>优势2标题：描述</p>
<p>优势3标题：描述</p>
<p>优势4标题：描述</p>

[SECTION:profile_advantages]
<p>基于得分最高维度，描述突出优势（1-2句，引用分数）</p>

[SECTION:profile_developments]
<p>基于得分最低维度，描述优先发展项（1-2句，引用分数）</p>

[SECTION:leadershipInterpretation]
<p>主导风格分析：${l.dominantStyle}突出（S1=${l.s1}/7, S2=${l.s2}/12, S3=${l.s3}/12, S4=${l.s4}/12）。为什么该风格突出，对管理意味着什么。</p>
<p>情境适应性：标准差${scores.adaptabilityIndex}（${scores.adaptabilityLevel}），意味着什么。</p>
<p>风格组合效应：各风格间的协同/冲突。</p>
<p>发展建议：如何扩展风格弹性，具体刻意练习（✔开头）。</p>

[SECTION:personalityInterpretation]
<p>三特质组合效应分析（150-250字）：创造力潜质${p.creativityPotential.raw}/10(${p.creativityPotential.level}) + 心理健康${p.mentalHealth.raw}/10(${p.mentalHealth.level}) + 管理潜能${p.managementPotential.raw}/10(${p.managementPotential.level})。三者如何互相影响，整体画像。</p>

[SECTION:personality_creativity]
<p>创造力潜质${p.creativityPotential.raw}/10·${p.creativityPotential.level}。行为锚定+对学术/职业影响+✔行动指南。</p>

[SECTION:personality_mentalHealth]
<p>心理健康${p.mentalHealth.raw}/10·${p.mentalHealth.level}。情绪稳定性+压力应对+✔行动指南。</p>

[SECTION:personality_managementPotential]
<p>管理潜能${p.managementPotential.raw}/10·${p.managementPotential.level}。管理特质+发展空间+✔行动指南。</p>

[SECTION:barrierInterpretation]
<p>创造力障碍综合分析（150-250字）：心理${b.psychological.score}/${b.psychological.max}(${b.psychological.level})、认知${b.cognitive.score}/${b.cognitive.max}(${b.cognitive.level})、环境${b.environmental.score}/${b.environmental.max}(${b.environmental.level})。三类障碍相互关系，主要障碍类型${b.primaryBarrierType}意味着什么。</p>

[SECTION:barrier_psychological]
<p>心理障碍${b.psychological.score}/${b.psychological.max}·${b.psychological.level}。怕失败/自我怀疑等心理因素分析+✔突破建议。</p>

[SECTION:barrier_cognitive]
<p>认知障碍${b.cognitive.score}/${b.cognitive.max}·${b.cognitive.level}。思维定势/过早评判/不能容忍模糊+✔突破建议（如反向思考法、SCAMPER、70%信息决策）。</p>

[SECTION:barrier_environmental]
<p>环境与资源障碍${b.environmental.score}/${b.environmental.max}·${b.environmental.level}。时间/资源/环境支持+✔突破建议（如创意时间块、创新社群、申请基金）。</p>

[SECTION:barrierSuggestions]
<p>建议1：针对${b.primaryBarrierType}的具体行动</p>
<p>建议2</p>
<p>建议3</p>
<p>建议4</p>

[SECTION:careerSuggestions]
★★★★★|管理咨询/战略分析|管理潜能+创造力双优，教练风格适合团队协作
★★★★☆|创新管理/产品负责人|创造力高且心理障碍低
★★★★☆|运营管理/管培生|高管理潜能+教练型风格
★★★☆☆|学术研究/高校教职|创造力优秀但需提升模糊容忍度

[SECTION:improvementPlan]
短期（0-6个月）：
- 行动1（具体可量化）
- 行动2
中期（6个月-2年）：
- 行动1
- 行动2
长期（2-5年）：
- 行动1
- 行动2

[SECTION:comprehensiveDiagnosis]
<p>综合诊断（200-300字）：总分${scores.totalScore}/100(${scores.grade})。得分结构拆解：领导力${bd.leadership}/30、人格${bd.personality}/40、创造力${bd.creativityBarrier}/30。最失分维度+最有潜力维度+发展杠杆点。</p>

[SECTION:summary]
<p>整体总结（100-150字），正面激励，强调优势与潜力，给出发展信心。</p>

## 系统精准数据（引用，不可修改）

测评对象：${userName}
综合得分：${scores.totalScore} / 100（${scores.grade}·${scores.gradeDescription}）

领导风格：S1=${l.s1}/7, S2=${l.s2}/12, S3=${l.s3}/12, S4=${l.s4}/12，主导=${l.dominantStyle}，适应性=${scores.adaptabilityIndex}(${scores.adaptabilityLevel})
人格：创造力潜质${p.creativityPotential.raw}/10(标准${p.creativityPotential.standard}·${p.creativityPotential.level})，心理健康${p.mentalHealth.raw}/10(标准${p.mentalHealth.standard}·${p.mentalHealth.level})，管理潜能${p.managementPotential.raw}/10(标准${p.managementPotential.standard}·${p.managementPotential.level})
创造力障碍：心理${b.psychological.score}/${b.psychological.max}(${b.psychological.level})，认知${b.cognitive.score}/${b.cognitive.max}(${b.cognitive.level})，环境${b.environmental.score}/${b.environmental.max}(${b.environmental.level})，主要障碍=${b.primaryBarrierType}
加权得分：领导力${bd.leadership}/30 + 人格${bd.personality}/40 + 创造力${bd.creativityBarrier}/30 = ${scores.totalScore}/100

请现在输出，严格按照 [SECTION:xxx] 格式。`;
}

/**
 * 构建降级占位文字（AI不可用时使用）
 */
function buildFallbackText(scores, userName) {
  const grade = scores.grade;
  const total = scores.totalScore;
  const name = userName || '该同学';
  const cp = scores.personality.creativityPotential;
  const mh = scores.personality.mentalHealth;
  const mp = scores.personality.managementPotential;
  const bp = scores.creativityBarrier.psychological;
  const bc = scores.creativityBarrier.cognitive;
  const be = scores.creativityBarrier.environmental;

  function dimFallback(label, score, max, level) {
    if (level === '优秀' || level === '良好') return `${label}得分${score}/${max}，等级"${level}"。该维度表现突出，是个人核心优势之一。建议在现有基础上持续深耕，将优势转化为可迁移的专业能力。`;
    if (level === '中等') return `${label}得分${score}/${max}，等级"${level}"。该维度处于常模均值范围，有明确的发展空间。建议作为下一阶段重点提升方向。`;
    return `${label}得分${score}/${max}，等级"${level}"。该维度是当前最值得投入的发展领域。建议制定专项提升计划，通过刻意练习逐步改善。`;
  }

  return {
    coreEvaluation: `${name}综合测评得分${total}分，评定为"${grade}"等级。测评结果显示其在多个维度上具备良好的发展基础，建议结合测评报告中的发展建议，持续提升综合能力。`,
    coreAdvantages: '- 学习能力：具备良好的知识吸收基础\n- 发展潜力：整体得分反映出提升空间\n- 综合素质：多维度均衡发展\n- 职业意识：对自身发展有一定规划',
    profileAdvantages: '根据测评数据，该同学在部分维度上表现突出，显示出良好的发展潜力。',
    profileDevelopments: '部分维度得分处于中等水平，建议在这些领域投入更多精力进行针对性提升。',
    leadershipInterpretation: `领导风格测评显示主导风格为${scores.leadership.dominantStyle}，情境适应性${scores.adaptabilityLevel}（指数: ${scores.adaptabilityIndex}）。建议根据不同的管理情境灵活切换领导风格，增强领导弹性。`,
    personalityInterpretation: `人格特质测评显示创造力潜质${cp.level}、心理健康${mh.level}、管理潜能${mp.level}。三项特质反映了个人的基本素质画像，建议重点发展管理潜能和创造力。`,
    personality_creativity: dimFallback('创造力潜质', cp.raw, 10, cp.level),
    personality_mentalHealth: dimFallback('心理健康', mh.raw, 10, mh.level),
    personality_managementPotential: dimFallback('管理潜能', mp.raw, 10, mp.level),
    barrierInterpretation: `创造力障碍分析显示主要障碍类型为${scores.creativityBarrier.primaryBarrierType}。心理障碍${bp.level}、认知障碍${bc.level}、环境障碍${be.level}。`,
    barrier_psychological: `心理障碍得分${bp.score}/${bp.max}，等级"${bp.level}"。${bp.level === '低障碍' ? '心理层面的创造力阻碍较少，自信心和尝试意愿较好。' : bp.level === '中障碍' ? '存在一定程度的自我怀疑或怕失败心理，建议通过小步尝试建立信心。' : '心理障碍较为明显，建议从低风险创造性活动开始，逐步建立自信。'}`,
    barrier_cognitive: `认知障碍得分${bc.score}/${bc.max}，等级"${bc.level}"。${bc.level === '低障碍' ? '思维灵活度好，能够多角度思考问题。' : bc.level === '中障碍' ? '偶尔存在思维定势，建议加强跨领域阅读和联想训练。' : '认知模式较为固化，建议通过思维导图、头脑风暴等工具拓展思维广度。'}`,
    barrier_environmental: `环境与资源障碍得分${be.score}/${be.max}，等级"${be.level}"。${be.level === '低障碍' ? '所处环境对创造力发挥较为有利。' : be.level === '中障碍' ? '环境支持度一般，建议主动创造有利于创新的小环境。' : '环境对创造力存在较大制约，建议主动寻求外部资源支持。'}`,
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
