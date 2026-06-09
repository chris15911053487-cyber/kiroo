const express = require('express');
const { getPool } = require('../db');
const pool = getPool();
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 问卷优先级排序（与服务端保持一致）
const DEFAULT_QUESTIONNAIRE_PRIORITY_ORDER = [
  'leadership', 'temperament', 'big5', 'mbti', '16pf', 'creativity', 'holland'
];

// 兰大测评优先级排序
const LZU_QUESTIONNAIRE_PRIORITY_ORDER = [
  'lzu-leadership', 'lzu-personality', 'lzu-creativity'
];

// 根据环境变量选择排序方案
const USE_LZU = process.env.LZU_MODE === 'true';
const QUESTIONNAIRE_PRIORITY_ORDER = USE_LZU ? LZU_QUESTIONNAIRE_PRIORITY_ORDER : DEFAULT_QUESTIONNAIRE_PRIORITY_ORDER;

// POST /api/sessions - 创建测评会话
router.post('/', authMiddleware, async (req, res) => {
  const { selectedQuestionnaires } = req.body;

  if (!selectedQuestionnaires || !Array.isArray(selectedQuestionnaires) || selectedQuestionnaires.length === 0) {
    return res.status(400).json({ error: '请至少选择一个测评问卷' });
  }

  try {
    // 检查是否有进行中的session
    const [existing] = await pool.query(
      'SELECT id FROM assessment_sessions WHERE user_id = ? AND status = ?',
      [req.user.id, 'in_progress']
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: '您有一个进行中的测评会话',
        existingSessionId: existing[0].id,
      });
    }

    // 按固定优先级排序
    const ordered = [...selectedQuestionnaires].sort(
      (a, b) => QUESTIONNAIRE_PRIORITY_ORDER.indexOf(a) - QUESTIONNAIRE_PRIORITY_ORDER.indexOf(b)
    );

    const [result] = await pool.query(
      `INSERT INTO assessment_sessions (user_id, selected_questionnaires, ordered_questionnaires, current_index, status)
       VALUES (?, ?, ?, 0, 'in_progress')`,
      [
        req.user.id,
        JSON.stringify(selectedQuestionnaires),
        JSON.stringify(ordered),
      ]
    );

    res.status(201).json({
      id: result.insertId,
      selectedQuestionnaires,
      orderedQuestionnaires: ordered,
      currentIndex: 0,
      status: 'in_progress',
      message: '测评会话已创建',
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: '创建测评会话失败' });
  }
});

// GET /api/sessions/current - 获取当前用户进行中的会话
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, selected_questionnaires, ordered_questionnaires, current_index, status, created_at, updated_at
       FROM assessment_sessions
       WHERE user_id = ? AND status = 'in_progress'
       ORDER BY updated_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ session: null });
    }

    const session = rows[0];
    session.selectedQuestionnaires = typeof session.selected_questionnaires === 'string'
      ? JSON.parse(session.selected_questionnaires) : session.selected_questionnaires;
    session.orderedQuestionnaires = typeof session.ordered_questionnaires === 'string'
      ? JSON.parse(session.ordered_questionnaires) : session.ordered_questionnaires;
    session.currentIndex = session.current_index;

    res.json({ session });
  } catch (err) {
    console.error('Get current session error:', err);
    res.status(500).json({ error: '获取会话失败' });
  }
});

// GET /api/sessions/:id - 获取会话详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, selected_questionnaires, ordered_questionnaires, current_index, status, created_at, updated_at
       FROM assessment_sessions
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const session = rows[0];
    session.selectedQuestionnaires = typeof session.selected_questionnaires === 'string'
      ? JSON.parse(session.selected_questionnaires) : session.selected_questionnaires;
    session.orderedQuestionnaires = typeof session.ordered_questionnaires === 'string'
      ? JSON.parse(session.ordered_questionnaires) : session.ordered_questionnaires;
    session.currentIndex = session.current_index;

    res.json({ session });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: '获取会话详情失败' });
  }
});

// POST /api/sessions/:id/answers - 提交单个问卷的答案（存档点）
router.post('/:id/answers', authMiddleware, async (req, res) => {
  const { questionnaireId, questionnaireName, answers, scoreResult } = req.body;

  if (!questionnaireId || !questionnaireName || !answers || !scoreResult) {
    return res.status(400).json({ error: '缺少必要的测评数据' });
  }

  const conn = await pool.getConnection();
  try {
    // 验证session归属
    const [sessions] = await conn.query(
      'SELECT id, ordered_questionnaires, current_index, status FROM assessment_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const session = sessions[0];
    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: '该会话已结束' });
    }

    const orderedQuestionnaires = typeof session.ordered_questionnaires === 'string'
      ? JSON.parse(session.ordered_questionnaires) : session.ordered_questionnaires;

    // 保存测评记录
    await conn.query(
      `INSERT INTO assessment_records (user_id, session_id, questionnaire_id, questionnaire_name, answers, score_result)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        session.id,
        questionnaireId,
        questionnaireName,
        JSON.stringify(answers),
        JSON.stringify(scoreResult),
      ]
    );

    // 更新session进度
    const newIndex = session.current_index + 1;
    const newStatus = newIndex >= orderedQuestionnaires.length ? 'completed' : 'in_progress';

    await conn.query(
      'UPDATE assessment_sessions SET current_index = ?, status = ? WHERE id = ?',
      [newIndex, newStatus, session.id]
    );

    res.json({
      currentIndex: newIndex,
      status: newStatus,
      totalQuestionnaires: orderedQuestionnaires.length,
      isLastQuestionnaire: newIndex >= orderedQuestionnaires.length,
      message: '答案已保存',
    });
  } catch (err) {
    console.error('Save answers error:', err);
    res.status(500).json({ error: '保存答案失败' });
  } finally {
    conn.release();
  }
});

// POST /api/sessions/:id/submit - 完成所有问卷，触发AI报告生成并保存
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // 验证session归属
    const [sessions] = await conn.query(
      'SELECT id, user_id, ordered_questionnaires, selected_questionnaires, status FROM assessment_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const session = sessions[0];

    // 获取该session所有已保存的测评记录
    const [records] = await conn.query(
      `SELECT questionnaire_id, questionnaire_name, score_result
       FROM assessment_records
       WHERE session_id = ? AND user_id = ?
       ORDER BY id ASC`,
      [session.id, req.user.id]
    );

    if (records.length === 0) {
      return res.status(400).json({ error: '没有找到测评记录' });
    }

    // 汇总所有问卷的得分
    const orderedQuestionnaires = typeof session.ordered_questionnaires === 'string'
      ? JSON.parse(session.ordered_questionnaires) : session.ordered_questionnaires;
    const questionnairesCompleted = records.map(r => r.questionnaire_id);
    const scoreSummary = {};

    for (const r of records) {
      const scoreResult = typeof r.score_result === 'string'
        ? JSON.parse(r.score_result) : r.score_result;
      scoreSummary[r.questionnaire_id] = scoreResult;
    }

    const userName = req.user.nickname || '测评用户';

    // ========== 兰大模式：服务端精准计分 ==========
    let comprehensiveScore = 75;
    let lzuComprehensive = null;

    if (USE_LZU) {
      lzuComprehensive = calculateLZUComprehensiveScore(scoreSummary);
      comprehensiveScore = lzuComprehensive.totalScore;
      console.log(`[LZU Score] Total=${comprehensiveScore}, Grade=${lzuComprehensive.grade}, Breakdown:`, lzuComprehensive.breakdown);
    }

    // 构建AI Prompt
    const prompt = USE_LZU
      ? buildLZUReportPrompt(userName, scoreSummary, lzuComprehensive)
      : buildReportPrompt(userName, questionnairesCompleted, scoreSummary);

    // 调用DeepSeek API生成结构化报告
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let reportContent = null;

    if (apiKey && apiKey.startsWith('sk-') && apiKey.length > 30) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
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
            response_format: { type: 'json_object' },
          }),
        });

        clearTimeout(timeoutId);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content ?? '';
          if (content) {
            try {
              const reportJson = JSON.parse(content);

              // 兰大模式：用精准计算的分数覆盖 AI 返回的分数
              if (USE_LZU && lzuComprehensive) {
                reportJson.comprehensiveScore = lzuComprehensive.totalScore;
                reportJson.grade = lzuComprehensive.grade;
                reportJson.gradeDescription = lzuComprehensive.gradeDescription;
                reportJson.breakdown = lzuComprehensive.breakdown;
                reportJson.adaptabilityIndex = lzuComprehensive.adaptabilityIndex;
                reportJson.adaptabilityLevel = lzuComprehensive.adaptabilityLevel;
              }

              comprehensiveScore = reportJson.comprehensiveScore || 75;

              // 补充报告编号和日期
              const now = new Date();
              reportJson.reportDate = now.toISOString().split('T')[0];
              reportJson.reportId = `TAR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(session.id).padStart(3, '0')}`;
              reportJson.userName = userName;

              reportContent = JSON.stringify(reportJson);
            } catch (parseErr) {
              console.error('Failed to parse AI JSON response:', parseErr.message);
              reportContent = content;
            }
          }
        } else {
          console.error(`DeepSeek API error: ${aiResponse.status}`);
        }
      } catch (aiErr) {
        console.error('AI generation error:', aiErr.message);
      }
    } else {
      console.warn('DEEPSEEK_API_KEY not configured, report will need manual editing');
    }

    // 如果没有生成报告内容，创建占位JSON
    if (!reportContent) {
      reportContent = JSON.stringify(buildPlaceholderReport(userName, questionnairesCompleted, scoreSummary, comprehensiveScore, session.id));
    }

    // 存入comprehensive_reports表（重复提交则更新）
    const [insertResult] = await conn.query(
      `INSERT INTO comprehensive_reports
       (session_id, user_id, questionnaires_completed, score_summary, report_content, comprehensive_score, review_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       ON CONFLICT(session_id) DO UPDATE SET
         questionnaires_completed = excluded.questionnaires_completed,
         score_summary = excluded.score_summary,
         report_content = excluded.report_content,
         comprehensive_score = excluded.comprehensive_score,
         review_status = 'pending',
         updated_at = datetime('now')`,
      [
        session.id,
        req.user.id,
        JSON.stringify(questionnairesCompleted),
        JSON.stringify(scoreSummary),
        reportContent,
        comprehensiveScore,
      ]
    );

    // 更新session状态为submitted
    await conn.query(
      'UPDATE assessment_sessions SET status = ? WHERE id = ?',
      ['submitted', session.id]
    );

    const reportId = insertResult.insertId;

    res.json({
      sessionId: session.id,
      reportId,
      questionnairesCompleted,
      scoreSummary,
      comprehensiveScore,
      status: 'submitted',
      message: '综合报告已生成，等待审核',
    });
  } catch (err) {
    console.error('Submit session error:', err);
    res.status(500).json({ error: '提交失败' });
  } finally {
    conn.release();
  }
});

/**
 * 构建提交时发送给AI的报告生成Prompt
 */
function buildReportPrompt(userName, completedIds, scoreSummary) {
  const lines = [];
  lines.push('你是一位资深人才测评专家。请根据以下多维测评数据，生成一份专业的人才综合测评报告。');
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记。');
  lines.push('');
  lines.push('JSON结构：{');
  lines.push('  "comprehensiveScore": 76.5,');
  lines.push('  "coreEvaluation": "核心评价一段话，200字以内，正面积极",');
  lines.push('  "coreAdvantages": [{"title":"优势","score":分数,"description":"基于数据的描述"}],');
  lines.push('  "personalityAnalysis": null, "leadershipAnalysis": null, "temperamentAnalysis": null,');
  lines.push('  "mbtiAnalysis": null, "sixteenPFAnalysis": null, "creativityAnalysis": null, "hollandAnalysis": null,');
  lines.push('  "careerSuggestions": [{"direction":"方向","reason":"理由"}],');
  lines.push('  "improvementSuggestions": ["建议1","建议2","建议3"],');
  lines.push('  "teamRole": {"primary":"主角色","secondary":"次角色","description":"描述"},');
  lines.push('  "summary": "总结一段话"');
  lines.push('}');
  lines.push('');
  lines.push('规则：语言正面积极，综合得分65-85区间，只输出做了的问卷对应字段（未做的设null），核心优势4-6项，职业建议3-4个。');
  lines.push(`用户：${userName}`);
  lines.push(`完成问卷：${completedIds.join(', ')}`);
  for (const qid of completedIds) {
    const score = scoreSummary[qid];
    if (score) lines.push(`${qid}: ${JSON.stringify(score)}`);
  }
  lines.push('现在输出JSON：');
  return lines.join('\n');
}

// ================================================================
//  兰大模式：精准计分引擎（严格按文档规则）
// ================================================================

function rawToStandard(raw, maxRaw) {
  const ratio = raw / maxRaw;
  if (ratio <= 0.2) return Math.max(1, Math.round(ratio / 0.2 * 2));
  if (ratio <= 0.4) return 3 + Math.round((ratio - 0.2) / 0.2 * 2);
  if (ratio <= 0.6) return 5 + Math.round((ratio - 0.4) / 0.2 * 2);
  if (ratio <= 0.8) return 7 + Math.round((ratio - 0.6) / 0.2 * 2);
  return 9 + Math.round(Math.min(1, (ratio - 0.8) / 0.2) * 1);
}

function standardToLevel(standard) {
  if (standard >= 9) return '优秀';
  if (standard >= 7) return '良好';
  if (standard >= 5) return '中等';
  if (standard >= 3) return '稍低';
  return '较低';
}

function barrierLevel(score, lowThreshold, midThreshold) {
  if (score >= lowThreshold) return '低障碍';
  if (score >= midThreshold) return '中障碍';
  return '高障碍';
}

function calculateLZUComprehensiveScore(scoreSummary) {
  const result = {
    totalScore: 0, grade: '待发展型', gradeDescription: '',
    breakdown: { leadership: 0, personality: 0, creativityBarrier: 0 },
    adaptabilityIndex: 0, adaptabilityLevel: '',
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
  };

  const ls = scoreSummary['lzu-leadership'];
  if (ls?.dimensionScores) {
    const { S1 = 0, S2 = 0, S3 = 0, S4 = 0 } = ls.dimensionScores;
    result.leadership = { s1: S1, s2: S2, s3: S3, s4: S4, dominantStyle: '' };
    const styles = [
      { name: '指令型（S1）', score: S1 }, { name: '教练型（S2）', score: S2 },
      { name: '支持型（S3）', score: S3 }, { name: '授权型（S4）', score: S4 },
    ];
    styles.sort((a, b) => b.score - a.score);
    result.leadership.dominantStyle = styles[0].name;
    if (styles[1].score === styles[0].score) {
      result.leadership.dominantStyle += ' / ' + styles[1].name;
    }
    const values = [S1, S2, S3, S4];
    const mean = values.reduce((a, b) => a + b, 0) / 4;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 4;
    const std = Math.sqrt(variance);
    result.adaptabilityIndex = Math.round(std * 100) / 100;
    const maxStd = 5.2;
    const adaptabilityScore = Math.max(0, Math.min(100, (1 - std / maxStd) * 100));
    result.breakdown.leadership = Math.round(adaptabilityScore * 0.30 * 10) / 10;
    if (std < 1.5) result.adaptabilityLevel = '强';
    else if (std < 3.0) result.adaptabilityLevel = '一般';
    else result.adaptabilityLevel = '需提升';
  }

  const ps = scoreSummary['lzu-personality'];
  if (ps?.dimensionScores) {
    const cp = ps.dimensionScores['creativity_potential'] ?? 0;
    const mh = ps.dimensionScores['mental_health'] ?? 0;
    const mp = ps.dimensionScores['management_potential'] ?? 0;
    result.personality.creativityPotential = { raw: cp, standard: rawToStandard(cp, 10), level: standardToLevel(rawToStandard(cp, 10)) };
    result.personality.mentalHealth = { raw: mh, standard: rawToStandard(mh, 10), level: standardToLevel(rawToStandard(mh, 10)) };
    result.personality.managementPotential = { raw: mp, standard: rawToStandard(mp, 10), level: standardToLevel(rawToStandard(mp, 10)) };
    const cpNorm = (cp / 10) * 100, mhNorm = (mh / 10) * 100, mpNorm = (mp / 10) * 100;
    const personalityComposite = cpNorm * 0.40 + mhNorm * 0.30 + mpNorm * 0.30;
    result.breakdown.personality = Math.round(personalityComposite * 0.40 * 10) / 10;
  }

  const cs = scoreSummary['lzu-creativity'];
  if (cs?.dimensionScores) {
    const psy = cs.dimensionScores['psychological_barrier'] ?? 0;
    const cog = cs.dimensionScores['cognitive_barrier'] ?? 0;
    const env = cs.dimensionScores['environmental_barrier'] ?? 0;
    result.creativityBarrier.psychological = { score: psy, max: 16, level: barrierLevel(psy, 12, 6) };
    result.creativityBarrier.cognitive = { score: cog, max: 12, level: barrierLevel(cog, 9, 5) };
    result.creativityBarrier.environmental = { score: env, max: 20, level: barrierLevel(env, 15, 8) };
    const psyNorm = (psy / 16) * 100, cogNorm = (cog / 12) * 100, envNorm = (env / 20) * 100;
    const barrierComposite = (psyNorm + cogNorm + envNorm) / 3;
    result.breakdown.creativityBarrier = Math.round(barrierComposite * 0.30 * 10) / 10;
    const barriers = [
      { type: '心理障碍', score: psyNorm }, { type: '认知障碍', score: cogNorm }, { type: '环境与资源障碍', score: envNorm },
    ];
    barriers.sort((a, b) => a.score - b.score);
    result.creativityBarrier.primaryBarrierType = barriers[0].type;
  }

  result.totalScore = Math.round(result.breakdown.leadership + result.breakdown.personality + result.breakdown.creativityBarrier);
  if (result.totalScore >= 90) { result.grade = '卓越型'; result.gradeDescription = '领导力、人格素质与创造力俱佳'; }
  else if (result.totalScore >= 75) { result.grade = '进取型'; result.gradeDescription = '具备良好的发展潜力'; }
  else if (result.totalScore >= 60) { result.grade = '成长型'; result.gradeDescription = '有明确的可提升空间'; }
  else { result.grade = '待发展型'; result.gradeDescription = '需系统性的能力建设'; }
  return result;
}

function buildLZUReportPrompt(userName, scoreSummary, lzu) {
  const lines = [];
  lines.push('你是兰州大学管理学院人才测评专家。请根据以下已计算好的测评数据，生成报告的**文字解读部分**。');
  lines.push('分数和等级已由系统精确计算，你只需生成文字解读、优势提炼、职业建议和提升计划。');
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记。');
  lines.push('');
  lines.push('## 系统计算的精准数据（请直接复制到输出JSON中，不要修改）');
  lines.push(`综合得分：${lzu.totalScore} / 100`);
  lines.push(`评定等级：${lzu.grade}（${lzu.gradeDescription}）`);
  lines.push(`领导风格得分：S1指令型=${lzu.leadership.s1}/7, S2教练型=${lzu.leadership.s2}/12, S3支持型=${lzu.leadership.s3}/12, S4授权型=${lzu.leadership.s4}/12`);
  lines.push(`主导风格：${lzu.leadership.dominantStyle}，情境适应性指数=${lzu.adaptabilityIndex}（${lzu.adaptabilityLevel}）`);
  lines.push(`维度加权：领导力${lzu.breakdown.leadership}/30分, 人格特质${lzu.breakdown.personality}/40分, 创造力${lzu.breakdown.creativityBarrier}/30分`);
  lines.push('');
  lines.push(`人格特质：创造力潜质原始${lzu.personality.creativityPotential.raw}/10 标准${lzu.personality.creativityPotential.standard} ${lzu.personality.creativityPotential.level}；心理健康原始${lzu.personality.mentalHealth.raw}/10 标准${lzu.personality.mentalHealth.standard} ${lzu.personality.mentalHealth.level}；管理潜能原始${lzu.personality.managementPotential.raw}/10 标准${lzu.personality.managementPotential.standard} ${lzu.personality.managementPotential.level}`);
  lines.push('');
  lines.push(`创造力障碍：心理${lzu.creativityBarrier.psychological.score}/${lzu.creativityBarrier.psychological.max}（${lzu.creativityBarrier.psychological.level}）；认知${lzu.creativityBarrier.cognitive.score}/${lzu.creativityBarrier.cognitive.max}（${lzu.creativityBarrier.cognitive.level}）；环境${lzu.creativityBarrier.environmental.score}/${lzu.creativityBarrier.environmental.max}（${lzu.creativityBarrier.environmental.level}）。主要障碍：${lzu.creativityBarrier.primaryBarrierType}`);
  lines.push('');
  lines.push('## 输出JSON结构（数值部分直接复制，文字部分需生成）');
  lines.push('{');
  lines.push(`  "comprehensiveScore": ${lzu.totalScore},`);
  lines.push(`  "grade": "${lzu.grade}",`);
  lines.push(`  "gradeDescription": "${lzu.gradeDescription}",`);
  lines.push('  "coreEvaluation": "核心评价，200字以内，基于数据正面积极",');
  lines.push('  "coreAdvantages": [{"title":"优势","score":分数,"description":"描述"}],');
  lines.push('  "leadershipAnalysis": {');
  lines.push(`    "s1Score": ${lzu.leadership.s1}, "s2Score": ${lzu.leadership.s2}, "s3Score": ${lzu.leadership.s3}, "s4Score": ${lzu.leadership.s4},`);
  lines.push(`    "dominantStyle": "${lzu.leadership.dominantStyle}",`);
  lines.push(`    "adaptabilityIndex": ${lzu.adaptabilityIndex},`);
  lines.push(`    "adaptabilityLevel": "${lzu.adaptabilityLevel}",`);
  lines.push('    "interpretation": "领导风格解读（含主导风格分析+情境适应性评估+发展建议）"');
  lines.push('  },');
  lines.push('  "personalityAnalysis": {');
  lines.push(`    "creativityPotential": {"raw": ${lzu.personality.creativityPotential.raw}, "standard": ${lzu.personality.creativityPotential.standard}, "level": "${lzu.personality.creativityPotential.level}"},`);
  lines.push(`    "mentalHealth": {"raw": ${lzu.personality.mentalHealth.raw}, "standard": ${lzu.personality.mentalHealth.standard}, "level": "${lzu.personality.mentalHealth.level}"},`);
  lines.push(`    "managementPotential": {"raw": ${lzu.personality.managementPotential.raw}, "standard": ${lzu.personality.managementPotential.standard}, "level": "${lzu.personality.managementPotential.level}"},`);
  lines.push('    "interpretation": "人格特质整体解读（每维度2-3句）"');
  lines.push('  },');
  lines.push('  "creativityBarrierAnalysis": {');
  lines.push(`    "psychologicalBarrier": {"score": ${lzu.creativityBarrier.psychological.score}, "max": 16, "level": "${lzu.creativityBarrier.psychological.level}"},`);
  lines.push(`    "cognitiveBarrier": {"score": ${lzu.creativityBarrier.cognitive.score}, "max": 12, "level": "${lzu.creativityBarrier.cognitive.level}"},`);
  lines.push(`    "environmentalBarrier": {"score": ${lzu.creativityBarrier.environmental.score}, "max": 20, "level": "${lzu.creativityBarrier.environmental.level}"},`);
  lines.push(`    "primaryBarrierType": "${lzu.creativityBarrier.primaryBarrierType}",`);
  lines.push('    "interpretation": "创造力障碍整体解读",');
  lines.push('    "suggestions": ["针对主要障碍的突破建议1", "建议2", "建议3"]');
  lines.push('  },');
  lines.push('  "careerSuggestions": [{"direction":"职业方向","matchLevel":"★★★★★","reason":"结合测评数据的推荐理由"}],');
  lines.push('  "improvementPlan": {');
  lines.push('    "shortTerm": ["0-6个月行动1","行动2","行动3"],');
  lines.push('    "midTerm": ["6个月-2年行动1","行动2","行动3"],');
  lines.push('    "longTerm": ["2-5年行动1","行动2","行动3"]');
  lines.push('  },');
  lines.push('  "summary": "整体总结，150字以内，正面激励"');
  lines.push('}');
  lines.push('');
  lines.push('## 风格约束');
  lines.push('1. 正面积极，用"发展空间"代替"缺点"');
  lines.push('2. 解读必须有数据支撑；核心优势4-6项；职业建议3-4个');
  lines.push('3. 职业方向结合管理类研究生特点（企业管理、创业、咨询、公共管理）');
  lines.push('4. 提升计划需具体可操作');
  lines.push('5. 领导风格解读：S1适合带新团队需授权; S2重任务与成长; S3营造支持氛围; S4信任成熟团队');
  lines.push('6. 等级解读语气：优秀→突出优势, 良好→肯定鼓励, 中等→指出空间, 稍低/较低→建设性建议');
  lines.push('');
  lines.push('请现在输出JSON，不要加任何前缀或后缀。');
  return lines.join('\n');
}

function buildPlaceholderReport(userName, questionnairesCompleted, scoreSummary, comprehensiveScore, sessionId) {
  const now = new Date();
  const reportDate = now.toISOString().split('T')[0];
  const reportId = `TAR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sessionId).padStart(3, '0')}`;
  if (USE_LZU) {
    const lzu = calculateLZUComprehensiveScore(scoreSummary);
    return {
      userName, reportDate, reportId,
      comprehensiveScore: lzu.totalScore, grade: lzu.grade, gradeDescription: lzu.gradeDescription,
      coreEvaluation: 'AI报告生成中，请管理员手动编辑。', coreAdvantages: [],
      leadershipAnalysis: {
        s1Score: lzu.leadership.s1, s2Score: lzu.leadership.s2,
        s3Score: lzu.leadership.s3, s4Score: lzu.leadership.s4,
        dominantStyle: lzu.leadership.dominantStyle,
        adaptabilityIndex: lzu.adaptabilityIndex, adaptabilityLevel: lzu.adaptabilityLevel,
        interpretation: '报告待生成，请管理员手动编辑。',
      },
      personalityAnalysis: {
        creativityPotential: lzu.personality.creativityPotential,
        mentalHealth: lzu.personality.mentalHealth,
        managementPotential: lzu.personality.managementPotential,
        interpretation: '报告待生成，请管理员手动编辑。',
      },
      creativityBarrierAnalysis: {
        psychologicalBarrier: lzu.creativityBarrier.psychological,
        cognitiveBarrier: lzu.creativityBarrier.cognitive,
        environmentalBarrier: lzu.creativityBarrier.environmental,
        primaryBarrierType: lzu.creativityBarrier.primaryBarrierType,
        interpretation: '报告待生成，请管理员手动编辑。', suggestions: [],
      },
      careerSuggestions: [],
      improvementPlan: { shortTerm: [], midTerm: [], longTerm: [] },
      summary: '报告待生成，请管理员手动编辑。',
    };
  }
  return {
    userName, reportDate, reportId,
    comprehensiveScore: 75, coreEvaluation: 'AI报告生成中，请管理员手动编辑。', coreAdvantages: [],
    personalityAnalysis: null, leadershipAnalysis: null, temperamentAnalysis: null,
    mbtiAnalysis: null, sixteenPFAnalysis: null, creativityAnalysis: null, hollandAnalysis: null,
    careerSuggestions: [],
    improvementSuggestions: ['积极参与各类活动', '保持学习习惯', '培养团队协作能力'],
    teamRole: { primary: '待评估', secondary: '待评估', description: '请管理员编辑' },
    summary: '报告待生成，请管理员手动编辑。',
  };
}

module.exports = router;
