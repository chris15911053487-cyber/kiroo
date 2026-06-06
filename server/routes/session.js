const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 问卷优先级排序（与服务端保持一致）
const QUESTIONNAIRE_PRIORITY_ORDER = [
  'leadership', 'temperament', 'big5', 'mbti', '16pf', 'creativity', 'holland'
];

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

    // 构建AI Prompt（结构化JSON格式）
    const userName = req.user.nickname || '测评用户';
    const prompt = buildReportPrompt(userName, questionnairesCompleted, scoreSummary);

    // 调用DeepSeek API生成结构化报告
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let reportContent = null;
    let comprehensiveScore = 75; // 默认值

    if (apiKey) {
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
            // 尝试解析JSON
            try {
              const reportJson = JSON.parse(content);
              comprehensiveScore = reportJson.comprehensiveScore || 75;

              // 确保分数在65-85区间
              if (comprehensiveScore < 65 || comprehensiveScore > 85) {
                comprehensiveScore = Math.max(65, Math.min(85, comprehensiveScore));
              }

              // 补充报告编号和日期
              const now = new Date();
              reportJson.reportDate = now.toISOString().split('T')[0];
              reportJson.reportId = `TAR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(session.id).padStart(3, '0')}`;
              reportJson.userName = userName;

              reportContent = JSON.stringify(reportJson);
            } catch (parseErr) {
              console.error('Failed to parse AI JSON response:', parseErr.message);
              // 解析失败，存储原始内容
              reportContent = content;
            }
          }
        } else {
          console.error(`DeepSeek API error: ${aiResponse.status}`);
        }
      } catch (aiErr) {
        console.error('AI generation error:', aiErr.message);
        // AI生成失败时继续流程，允许管理员手动编辑
      }
    } else {
      console.warn('DEEPSEEK_API_KEY not configured, report will need manual editing');
    }

    // 如果没有生成报告内容，创建一个占位JSON
    if (!reportContent) {
      const placeholderJson = {
        userName,
        reportDate: new Date().toISOString().split('T')[0],
        reportId: `TAR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(session.id).padStart(3, '0')}`,
        comprehensiveScore: 75,
        coreEvaluation: 'AI报告生成中，请管理员手动编辑。',
        coreAdvantages: [],
        personalityAnalysis: null,
        leadershipAnalysis: null,
        temperamentAnalysis: null,
        mbtiAnalysis: null,
        sixteenPFAnalysis: null,
        creativityAnalysis: null,
        hollandAnalysis: null,
        careerSuggestions: [],
        improvementSuggestions: ['积极参与各类活动', '保持学习习惯', '培养团队协作能力'],
        teamRole: { primary: '待评估', secondary: '待评估', description: '请管理员编辑' },
        summary: '报告待生成，请管理员手动编辑。',
      };
      reportContent = JSON.stringify(placeholderJson);
    }

    // 存入comprehensive_reports表
    const [insertResult] = await conn.query(
      `INSERT INTO comprehensive_reports
       (session_id, user_id, questionnaires_completed, score_summary, report_content, comprehensive_score, review_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
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
  lines.push('JSON结构：');
  lines.push('{');
  lines.push('  "comprehensiveScore": 76.5,');
  lines.push('  "coreEvaluation": "核心评价一段话，200字以内，正面积极",');
  lines.push('  "coreAdvantages": [');
  lines.push('    {"title":"优势","score":分数,"description":"基于数据的描述"}');
  lines.push('  ],');
  lines.push('  "personalityAnalysis": null,');
  lines.push('  "leadershipAnalysis": null,');
  lines.push('  "temperamentAnalysis": null,');
  lines.push('  "mbtiAnalysis": null,');
  lines.push('  "sixteenPFAnalysis": null,');
  lines.push('  "creativityAnalysis": null,');
  lines.push('  "hollandAnalysis": null,');
  lines.push('  "careerSuggestions": [{"direction":"方向","reason":"理由"}],');
  lines.push('  "improvementSuggestions": ["建议1","建议2","建议3"],');
  lines.push('  "teamRole": {"primary":"主角色","secondary":"次角色","description":"描述"},');
  lines.push('  "summary": "总结一段话"');
  lines.push('}');
  lines.push('');
  lines.push('子模块结构：');
  lines.push('- personalityAnalysis: {"big5":{"o":分,"c":分,"e":分,"a":分,"n":分},"big5Interpretation":[{"dimension":"名","score":分,"interpretation":"解"}]}');
  lines.push('- leadershipAnalysis: {"styles":[{"name":"名","score":分,"percentage":百分比}],"interpretation":"解"}');
  lines.push('- temperamentAnalysis: {"types":[{"name":"名","score":分}],"dominant":"主导","interpretation":"解"}');
  lines.push('- mbtiAnalysis: {"type":"ENFP","dimensions":{"E":分,"N":分,"F":分,"P":分},"interpretation":"解"}');
  lines.push('- creativityAnalysis: {"totalScore":分,"maxScore":分,"barriers":["碍"],"interpretation":"解"}');
  lines.push('- hollandAnalysis: {"scores":{"R":分,"I":分,"A":分,"S":分,"E":分,"C":分},"dominantType":"SAE","interpretation":"解"}');
  lines.push('- sixteenPFAnalysis: {"factors":{16因素},"derivedTraits":[{"name":"名","score":计算值,"level":"级","description":"述"}],"interpretation":"解"}');
  lines.push('');
  lines.push('16PF二元特征公式：焦虑性=(38+2L+3O+4Q4-2C-2H-2Q3)/10, 外向性=(2A+3E+4F+5H-2Q2-11)/10, 警觉性=(77+2L+2O+2Q4-2A-2C-2H)/10, 独立性=(2E+2M+2Q1+2Q2-2A-2G)/10, 心理健康=(C+2Q3+2Q4), 专业成就=(2Q3+2G+2C-2M), 创造能力=(2B+2M+2Q1-2A), 成长能力=(2B+2G+2Q3)');
  lines.push('');
  lines.push('规则：语言正面积极，综合得分65-85，只输出做了的问卷对应字段（未做的设null），核心优势4-6项，职业建议3-4个。');
  lines.push('');
  lines.push(`用户：${userName}`);
  lines.push(`完成问卷：${completedIds.join(', ')}`);
  lines.push('');

  for (const qid of completedIds) {
    const score = scoreSummary[qid];
    if (!score) continue;
    lines.push(`${qid}: ${JSON.stringify(score)}`);
  }

  lines.push('');
  lines.push('现在输出JSON：');
  return lines.join('\n');
}

module.exports = router;
