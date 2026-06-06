const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/assessments/save
router.post('/save', authMiddleware, async (req, res) => {
  const { questionnaireId, questionnaireName, answers, scoreResult, aiReport } = req.body;

  if (!questionnaireId || !questionnaireName || !answers || !scoreResult) {
    return res.status(400).json({ error: '缺少必要的测评数据' });
  }

  try {
    // Combine aiAnalysis and suggestions into aiReport if passed separately
    let reportText = aiReport;
    if (!reportText && req.body.aiAnalysis) {
      reportText = req.body.aiAnalysis;
      if (req.body.suggestions) {
        reportText += '\n\n' + req.body.suggestions;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO assessment_records (user_id, questionnaire_id, questionnaire_name, answers, score_result, ai_report)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        questionnaireId,
        questionnaireName,
        JSON.stringify(answers),
        JSON.stringify(scoreResult),
        reportText || null,
      ]
    );

    res.status(201).json({ id: result.insertId, message: '测评记录已保存' });
  } catch (err) {
    console.error('Save assessment error:', err);
    res.status(500).json({ error: '保存测评记录失败' });
  }
});

// GET /api/assessments/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, questionnaire_id AS questionnaireId, questionnaire_name AS questionnaireName,
              score_result AS scoreResult, review_status AS reviewStatus, created_at AS createdAt
       FROM assessment_records
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Parse score_result JSON
    const records = rows.map(r => ({
      ...r,
      scoreResult: typeof r.scoreResult === 'string' ? JSON.parse(r.scoreResult) : r.scoreResult,
    }));

    res.json({ records, total: records.length });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// GET /api/assessments/:id/status - 查询审核状态
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, review_status AS reviewStatus, review_comment AS reviewComment
       FROM assessment_records
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ reviewStatus: rows[0].reviewStatus, reviewComment: rows[0].reviewComment });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: '查询状态失败' });
  }
});

// GET /api/assessments/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, questionnaire_id AS questionnaireId, questionnaire_name AS questionnaireName,
              answers, score_result AS scoreResult, ai_report AS aiReport,
              review_status AS reviewStatus, review_comment AS reviewComment,
              created_at AS createdAt
       FROM assessment_records
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const record = rows[0];
    record.scoreResult = typeof record.scoreResult === 'string'
      ? JSON.parse(record.scoreResult) : record.scoreResult;
    record.answers = typeof record.answers === 'string'
      ? JSON.parse(record.answers) : record.answers;

    // 如果未审核通过，隐藏报告内容
    if (record.reviewStatus !== 'approved') {
      record.aiReport = null;
      record.scoreResult = null;
      record.answers = null;
    }

    res.json({ record });
  } catch (err) {
    console.error('Assessment detail error:', err);
    res.status(500).json({ error: '获取测评详情失败' });
  }
});

module.exports = router;
