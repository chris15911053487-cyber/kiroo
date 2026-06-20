const express = require('express');
const { getPool } = require('../db');
const pool = getPool();
const authMiddleware = require('../middleware/auth');
const { toChinaISO, toChinaShort } = require('../utils/timeUtils');

const router = express.Router();

// GET /api/reports - 获取用户的综合报告列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cr.id, cr.session_id AS sessionId, cr.comprehensive_score AS comprehensiveScore,
              cr.review_status AS reviewStatus, cr.created_at AS createdAt,
              s.ordered_questionnaires AS questionnairesCompleted
       FROM comprehensive_reports cr
       JOIN assessment_sessions s ON s.id = cr.session_id
       WHERE cr.user_id = ?
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );

    const reports = rows.map(r => ({
      ...r,
      createdAt: toChinaISO(r.createdAt),
      createdAtDisplay: toChinaShort(r.createdAt),
      questionnairesCompleted: typeof r.questionnairesCompleted === 'string'
        ? JSON.parse(r.questionnairesCompleted) : r.questionnairesCompleted,
    }));

    res.json({ reports, total: reports.length });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: '获取报告列表失败' });
  }
});

// GET /api/reports/:id - 获取报告详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cr.id, cr.session_id AS sessionId, cr.user_id AS userId,
              cr.questionnaires_completed AS questionnairesCompleted,
              cr.score_summary AS scoreSummary,
              cr.report_content AS reportContent,
              cr.report_html AS reportHtml,
              cr.docx_path AS docxPath,
              cr.comprehensive_score AS comprehensiveScore,
              cr.review_status AS reviewStatus,
              cr.review_comment AS reviewComment,
              cr.reviewed_at AS reviewedAt,
              cr.created_at AS createdAt
       FROM comprehensive_reports cr
       WHERE cr.id = ? AND cr.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];
    const dbCreatedAt = report.createdAt; // 保存原始 UTC 值
    report.createdAt = toChinaISO(dbCreatedAt);
    report.createdAtDisplay = toChinaShort(dbCreatedAt);
    if (report.reviewedAt) report.reviewedAt = toChinaISO(report.reviewedAt);

    // Parse JSON fields
    if (report.questionnairesCompleted && typeof report.questionnairesCompleted === 'string') {
      report.questionnairesCompleted = JSON.parse(report.questionnairesCompleted);
    }
    if (report.scoreSummary && typeof report.scoreSummary === 'string') {
      report.scoreSummary = JSON.parse(report.scoreSummary);
    }

    res.json({ report });
  } catch (err) {
    console.error('Get report detail error:', err);
    res.status(500).json({ error: '获取报告详情失败' });
  }
});

// GET /api/reports/:id/pdf - 下载报告文件（优先DOCX，降级PDF）
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    // 获取报告数据
    const [rows] = await pool.query(
      `SELECT report_content, report_html, docx_path, review_status, user_id
       FROM comprehensive_reports
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];

    // 只允许报告所有者下载
    if (report.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权下载此报告' });
    }

    // 优先使用生成的PDF文件
    if (report.docx_path) {
      const fs = require('fs');
      const path = require('path');
      const absolutePath = path.resolve(report.docx_path);

      if (fs.existsSync(absolutePath)) {
        const ext = path.extname(absolutePath).toLowerCase();
        const filename = `人才测评报告_${req.params.id}${ext}`;
        const mimeType = ext === '.pdf'
          ? 'application/pdf'
          : 'text/html';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        return res.sendFile(absolutePath);
      }
    }

    // 降级：生成PDF
    const { generateReportPDF } = require('../services/pdfService');
    const reportData = report.report_html || report.report_content;

    const pdfBuffer = await generateReportPDF(reportData);

    if (pdfBuffer.toString('utf-8', 0, 15).includes('<!DOCTYPE')) {
      // 降级为HTML输出
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
      });
    } else {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TalentReport_${req.params.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
    }

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: '下载失败' });
  }
});

// POST /api/reports/mids-f2/generate — 生成 MIDS-F2 独立报告
router.post('/mids-f2/generate', authMiddleware, async (req, res) => {
  try {
    const { dimensionScores, userName } = req.body;

    if (!dimensionScores || typeof dimensionScores !== 'object') {
      return res.status(400).json({ error: '缺少 dimensionScores 参数' });
    }

    // Fetch user education & graduation_intent for report personalization
    const pool = getPool();
    let userEducation = null;
    let userGraduationIntent = null;
    let userMajor = null;
    try {
      const [userRows] = await pool.query(
        'SELECT education, graduation_intent, major FROM users WHERE id = ?',
        [req.user.id]
      );
      if (userRows.length > 0) {
        userEducation = userRows[0].education;
        userGraduationIntent = userRows[0].graduation_intent;
        userMajor = userRows[0].major;
      }
    } catch (e) {
      console.warn('Failed to fetch user education/intent:', e.message);
    }

    // 计算 MIDS-F2 结果
    const { computeMidsF2 } = require('../services/midsF2ScoringService');
    const midsF2Result = computeMidsF2(dimensionScores);

    const { generateMidsF2Report } = require('../services/midsF2ReportService');
    const reportData = await generateMidsF2Report({
      dimensionScores,
      midsF2Result,
      userName: userName || '测评用户',
      userInfo: {
        name: userName || '测评用户',
        education: userEducation || '未提供',
        graduationIntention: userGraduationIntent || '未提供',
        major: userMajor || '未提供',
      },
    });

    // 保存到 comprehensive_reports 表
    const sessionId = req.body.sessionId || 0;
    const [result] = await pool.query(
      `INSERT INTO comprehensive_reports
       (session_id, user_id, questionnaires_completed, score_summary, report_content, report_html,
        comprehensive_score, review_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
      [
        sessionId,
        req.user.id,
        JSON.stringify(['mids-f2']),
        JSON.stringify({ 'mids-f2': { dimensionScores, type: 'likert' } }),
        JSON.stringify(reportData),
        null,
        reportData.comprehensiveScore,
      ]
    );

    // 返回报告 ID 供前端跳转
    res.json({
      reportId: result.insertId,
      report: reportData,
    });
  } catch (err) {
    console.error('[MIDS-F2] Report generation error:', err);
    res.status(500).json({ error: '报告生成失败' });
  }
});

module.exports = router;
