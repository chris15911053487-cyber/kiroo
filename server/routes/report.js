const express = require('express');
const { getPool } = require('../db');
const pool = getPool();
const authMiddleware = require('../middleware/auth');

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

    // 审核未通过时隐藏报告内容
    if (report.reviewStatus !== 'approved') {
      report.reportContent = null;
      report.reportHtml = null;
      report.docxPath = null;
      report.scoreSummary = null;
    }

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

    // 只有审核通过的报告才能下载
    if (report.review_status !== 'approved') {
      return res.status(400).json({ error: '报告尚未通过审核，无法下载' });
    }

    // 优先使用新格式 .doc 文件
    if (report.docx_path) {
      const fs = require('fs');
      const path = require('path');
      const absolutePath = path.resolve(report.docx_path);

      if (fs.existsSync(absolutePath)) {
        const ext = path.extname(absolutePath).toLowerCase();
        const filename = `人才测评报告_${req.params.id}${ext}`;
        const mimeType = ext === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/msword';
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

module.exports = router;
