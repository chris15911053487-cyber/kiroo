const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');
const sessionRoutes = require('./routes/session');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DeepSeek API 代理接口 - 单问卷AI分析（保留兼容旧版）
app.post('/api/generate-report', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`DeepSeek API error: ${response.status}`);
      return res.status(response.status).json({
        error: 'AI service error',
        status: response.status
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content || content.length < 50) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    res.json({ content });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    console.error('API proxy error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DeepSeek API 代理接口 - 综合报告生成（结构化JSON输出）
app.post('/api/generate-comprehensive-report', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

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
        response_format: { type: 'json_object' },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`DeepSeek API error: ${response.status}`);
      return res.status(response.status).json({
        error: 'AI service error',
        status: response.status
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content || content.length < 50) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    // 尝试解析为JSON，如果失败则返回原始文本
    try {
      const parsed = JSON.parse(content);
      res.json({ content, parsed });
    } catch {
      res.json({ content });
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    console.error('API proxy error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 综合报告保存接口（在AI生成后调用）
app.post('/api/reports/save', async (req, res) => {
  const { sessionId, userId, questionnairesCompleted, scoreSummary, reportContent, comprehensiveScore, token } = req.body;

  if (!sessionId || !userId || !reportContent || !comprehensiveScore) {
    return res.status(400).json({ error: '缺少必要的报告数据' });
  }

  // 简易token验证
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id !== userId) {
      return res.status(403).json({ error: '无权操作' });
    }
  } catch {
    return res.status(401).json({ error: 'Token无效' });
  }

  try {
    const pool = require('./db');

    // 检查是否已有报告
    const [existing] = await pool.query(
      'SELECT id FROM comprehensive_reports WHERE session_id = ?',
      [sessionId]
    );

    if (existing.length > 0) {
      // 更新已有报告
      await pool.query(
        `UPDATE comprehensive_reports
         SET report_content = ?, comprehensive_score = ?, score_summary = ?,
             review_status = 'pending', updated_at = NOW()
         WHERE session_id = ?`,
        [reportContent, comprehensiveScore, JSON.stringify(scoreSummary), sessionId]
      );

      // 同时更新session状态
      await pool.query(
        'UPDATE assessment_sessions SET status = ? WHERE id = ?',
        ['submitted', sessionId]
      );

      return res.json({ message: '报告已更新', reportId: existing[0].id });
    }

    // 创建新报告
    const [result] = await pool.query(
      `INSERT INTO comprehensive_reports
       (session_id, user_id, questionnaires_completed, score_summary, report_content, comprehensive_score, review_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        sessionId,
        userId,
        JSON.stringify(questionnairesCompleted),
        JSON.stringify(scoreSummary),
        reportContent,
        comprehensiveScore,
      ]
    );

    // 更新session状态
    await pool.query(
      'UPDATE assessment_sessions SET status = ? WHERE id = ?',
      ['submitted', sessionId]
    );

    res.status(201).json({ message: '报告已保存', reportId: result.insertId });
  } catch (err) {
    console.error('Save report error:', err);
    res.status(500).json({ error: '保存报告失败' });
  }
});

// 用户认证路由
app.use('/api/auth', authRoutes);

// 测评记录路由（保留，兼容旧版）
app.use('/api/assessments', assessmentRoutes);

// 测评会话路由（新版）
app.use('/api/sessions', sessionRoutes);

// 综合报告路由（新版）
app.use('/api/reports', reportRoutes);

// 管理后台路由
app.use('/api/admin', adminRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 托管前端静态文件（兼容本地开发 server/ 目录 和 Docker /app 目录）
const fs = require('fs');
const distPath = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA 路由兜底 — 所有非 /api 路径返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   API: http://0.0.0.0:${PORT}/api/`);
  console.log(`   Web: http://0.0.0.0:${PORT}`);
});
