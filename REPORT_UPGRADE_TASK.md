# 报告展示改造 + PDF下载功能开发任务

> **目的**：将当前纯Markdown文字报告改造为「固定模板+图表+精美排版」的综合报告页，并实现PDF下载功能。  
> **参考文件**：`PROJECT_PLAN.md` 第八、九、十三章节  
> **优先级**：高

---

## 一、当前问题

1. ReportPage 直接渲染 AI 返回的 Markdown 文字，没有图表、没有排版
2. 没有 PDF 下载功能
3. AI生成的是纯文字，没有结构化输出

---

## 二、改造目标

### 2.1 AI生成策略改为结构化JSON

AI不再直接输出Markdown报告全文，而是输出**结构化JSON数据**，前端用固定模板渲染。

**AI输出格式设计：**

```json
{
  "userName": "张书恺",
  "reportDate": "2026-06-05",
  "reportId": "TAR-2026-0605-001",
  "comprehensiveScore": 76.5,
  "coreEvaluation": "张书恺先生是一位具有高度外向性、聪慧机敏、善于交际的优秀人才...",
  "coreAdvantages": [
    { "title": "极强的外向性", "score": 62, "description": "性格外向活跃，善于社交，是团队中的活跃分子" },
    { "title": "多血质气质", "score": 19, "description": "活泼开朗，适应力强，善于交际" },
    { "title": "聪慧机敏", "score": 14, "description": "思维敏捷，理解能力强" }
  ],
  "personalityAnalysis": {
    "big5": {
      "openness": 60,
      "conscientiousness": 58,
      "extraversion": 62,
      "agreeableness": 58,
      "neuroticism": 68
    },
    "big5Interpretation": [
      { "dimension": "开放性", "score": 60, "interpretation": "思维较为开放，愿意接受新事物" },
      { "dimension": "尽责性", "score": 58, "interpretation": "工作认真负责，条理性较强" },
      { "dimension": "外倾性", "score": 62, "interpretation": "性格外向活跃，善于社交" },
      { "dimension": "宜人性", "score": 58, "interpretation": "善于合作，能与他人建立良好关系" },
      { "dimension": "神经质", "score": 68, "interpretation": "情绪波动相对较大，建议加强情绪管理" }
    ]
  },
  "leadershipAnalysis": {
    "styles": [
      { "name": "支持式", "score": 7, "percentage": 58 },
      { "name": "命令式", "score": 3, "percentage": 25 },
      { "name": "教练式", "score": 2, "percentage": 17 },
      { "name": "授权式", "score": 0, "percentage": 0 }
    ],
    "interpretation": "领导风格以支持式为主导，善于倾听下属意见，提供情感支持..."
  },
  "temperamentAnalysis": {
    "types": [
      { "name": "多血质", "score": 19 },
      { "name": "胆汁质", "score": 12 },
      { "name": "粘液质", "score": 8 },
      { "name": "抑郁质", "score": 5 }
    ],
    "dominant": "多血质",
    "interpretation": "主导气质为多血质，活泼开朗，善于交际..."
  },
  "mbtiAnalysis": {
    "type": "ENFP",
    "dimensions": { "E": 65, "N": 58, "F": 55, "P": 60 },
    "interpretation": "ENFP类型的人充满活力和创造力..."
  },
  "creativityAnalysis": {
    "totalScore": 28,
    "maxScore": 37,
    "barriers": ["完美主义倾向", "害怕失败"],
    "interpretation": "创造力潜能较高，主要障碍为..."
  },
  "hollandAnalysis": {
    "scores": { "R": 12, "I": 18, "A": 22, "S": 25, "E": 20, "C": 10 },
    "dominantType": "SAE",
    "interpretation": "主要职业兴趣类型为社会型(S)、艺术型(A)、企业型(E)..."
  },
  "sixteenPFAnalysis": {
    "factors": { "A": 12, "B": 14, "C": 8, "E": 10, "F": 14, "G": 8, "H": 14, "I": 6, "L": 8, "M": 14, "N": 6, "O": 8, "Q1": 14, "Q2": 4, "Q3": 6, "Q4": 8 },
    "derivedTraits": [
      { "name": "焦虑性", "score": 6.6, "level": "中等", "description": "情绪稳定性一般，建议加强情绪管理" },
      { "name": "外向性", "score": 31.0, "level": "极高", "description": "极度外向，善于社交，适应力强" },
      { "name": "警觉性", "score": 19.0, "level": "较高", "description": "对环境敏感，善于观察细节" },
      { "name": "独立性", "score": 19.4, "level": "较高", "description": "独立思考，有自己的主见" },
      { "name": "心理健康因素", "score": 30, "level": "健康", "description": "心理状态良好，适应能力强" },
      { "name": "专业成就因素", "score": 22.0, "level": "优秀", "description": "专业发展潜力大，易获成就" },
      { "name": "创造能力因素", "score": 11.4, "level": "优秀", "description": "创造力突出，思维活跃" },
      { "name": "成长能力因素", "score": 35, "level": "优秀", "description": "学习能力强，成长空间大" }
    ],
    "interpretation": "16PF测评结果显示，其在乐群性、聪慧性、兴奋性、敢为性、实验性等维度表现突出..."
  },
  "careerSuggestions": [
    { "direction": "销售与商务拓展类岗位", "reason": "多血质气质和外向性使其善于交际" },
    { "direction": "市场营销与品牌推广", "reason": "实验精神和创新意识突出" },
    { "direction": "团队管理类岗位", "reason": "支持式领导风格适合带领团队" },
    { "direction": "培训讲师类岗位", "reason": "善于表达和指导" }
  ],
  "improvementSuggestions": [
    "通过时间管理、任务分解等方法提升专注力",
    "学习情绪管理技巧，增强心理稳定性",
    "在专业成就因素基础上，持续深耕特定领域"
  ],
  "teamRole": {
    "primary": "资源调查者",
    "secondary": "协调者",
    "description": "善于发现和利用外部资源，同时能够协调团队成员关系..."
  },
  "summary": "综合来看，张书恺先生是一位兼具社交才能与创新精神的复合型人才..."
}
```

### 2.2 AI Prompt 改造

修改 AI 报告生成的 Prompt，要求 DeepSeek 输出上述 JSON 格式。

**关键约束写入Prompt：**
- 必须输出合法JSON，不要附加任何Markdown标记
- 综合得分必须在65-85之间
- 语言中性偏正面，不突出缺点
- 只输出用户实际做了的问卷对应的分析字段
- 未做的问卷对应字段设为 null
- 16PF的8项二元性格特征需根据16个因素原始分通过公式计算得出

**DeepSeek API调用时设置 `response_format: { type: "json_object" }`** 以确保输出合法JSON。

### 2.3 后端改造

**文件：`server/routes/session.js`** 的 submit 接口

在 `POST /api/sessions/:id/submit` 中：
1. 汇总所有问卷得分
2. 调用 DeepSeek API，使用结构化Prompt，要求返回JSON
3. 解析JSON，存入 `comprehensive_reports.report_content`（存整个JSON字符串）
4. 从JSON中提取 `comprehensiveScore` 存入 `comprehensive_reports.comprehensive_score`

**关键实现逻辑（当前submit接口只返回了scoreSummary，需要新增以下逻辑）：**

```javascript
// 在submit接口中，获取scoreSummary后，新增以下代码：

// 构造AI Prompt
const prompt = buildComprehensivePrompt(scoreSummary, questionnairesCompleted, userName);

// 调用DeepSeek API
const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  }),
});

const aiData = await aiResponse.json();
const reportContent = aiData.choices[0].message.content;
const reportJson = JSON.parse(reportContent);

// 存入数据库
await conn.query(
  `INSERT INTO comprehensive_reports 
   (session_id, user_id, questionnaires_completed, score_summary, report_content, comprehensive_score, review_status)
   VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
  [
    session.id, req.user.id,
    JSON.stringify(questionnairesCompleted),
    JSON.stringify(scoreSummary),
    reportContent,  // 存AI返回的原始JSON字符串
    reportJson.comprehensiveScore
  ]
);
```

---

## 三、前端 ReportPage 改造

**文件：`src/pages/ReportPage.tsx`**

将当前的 Markdown 渲染改为**固定模板+图表组件**渲染。

### 3.1 页面结构

```
┌─────────────────────────────────────┐
│  报告封面区域                         │
│  - 品牌Logo + "人才综合测评报告"      │
│  - 用户名、日期、报告编号             │
├─────────────────────────────────────┤
│  综合得分区域                         │
│  - GaugeChart 仪表盘（综合得分）      │
│  - 核心评价（一段话）                 │
├─────────────────────────────────────┤
│  核心优势区域                         │
│  - 标签云/卡片展示核心优势            │
├─────────────────────────────────────┤
│  人格特质分析                         │
│  - RadarChart 雷达图（大五人格）      │
│  - 各维度得分表格 + 解读              │
├─────────────────────────────────────┤
│  领导力风格                           │
│  - PieChart 饼图（领导风格分布）      │
│  - 解读文字                           │
├─────────────────────────────────────┤
│  气质类型                             │
│  - BarChart 柱状图（四种气质得分）    │
│  - 主导气质解读                       │
├─────────────────────────────────────┤
│  MBTI类型（如有）                     │
│  - 四维度得分展示                     │
│  - 类型解读                           │
├─────────────────────────────────────┤
│  16PF深度分析（如有）                 │
│  - BarChart 柱状图（16因素得分）      │
│  - 二元性格特征表格（8项）            │
│  - 解读文字                           │
├─────────────────────────────────────┤
│  创造力分析（如有）                   │
│  - 得分进度条                         │
│  - 障碍因素标签                       │
├─────────────────────────────────────┤
│  职业倾向（如有）                     │
│  - HexagonChart 六边形图（霍兰德）   │
│  - 主要类型解读                       │
├─────────────────────────────────────┤
│  发展建议                             │
│  - 职业方向卡片                       │
│  - 能力提升建议列表                   │
│  - 团队角色定位                       │
├─────────────────────────────────────┤
│  总结与展望                           │
│  - 总结段落                           │
├─────────────────────────────────────┤
│  下载PDF按钮                          │
└─────────────────────────────────────┘
```

### 3.2 图表组件使用

已有图表组件在 `src/components/charts/` 下：
- `RadarChart.tsx` — 大五人格雷达图
- `BarChart.tsx` — 气质类型/16PF柱状图
- `PieChart.tsx` — 领导风格饼图
- `HexagonChart.tsx` — 霍兰德六边形图
- `GaugeChart.tsx` — 综合得分仪表盘

需要确认这些组件接受的 props 格式，并在 ReportPage 中传入从 `report_content` JSON 解析出的数据。

### 3.3 条件渲染

根据用户实际做了哪些问卷，只显示对应的分析板块：
```typescript
{reportData.personalityAnalysis && <PersonalitySection data={reportData.personalityAnalysis} />}
{reportData.leadershipAnalysis && <LeadershipSection data={reportData.leadershipAnalysis} />}
{reportData.temperamentAnalysis && <TemperamentSection data={reportData.temperamentAnalysis} />}
// ... 以此类推
```

---

## 四、PDF下载功能

### 4.1 方案：后端 Puppeteer 渲染

**安装依赖：**
```bash
cd server
npm install puppeteer-core chromium
```

或者使用轻量方案：
```bash
npm install puppeteer
```

> 注意：腾讯云2核2G可能内存紧张。如果装不了完整puppeteer，改用 `@sparticuz/chromium` + `puppeteer-core`（无头Chrome压缩版）。

### 4.2 实现 PDF 生成路由

**新建文件：`server/services/pdfService.js`**

```javascript
const puppeteer = require('puppeteer');

async function generateReportPDF(reportData) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 渲染报告HTML模板
  const html = buildReportHTML(reportData);
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // 导出PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  
  await browser.close();
  return pdfBuffer;
}

function buildReportHTML(data) {
  // 生成一个完整的HTML页面，包含：
  // - 内联CSS样式（品牌色、排版）
  // - SVG图表（用简单的SVG生成雷达图、柱状图等，不依赖外部JS库）
  // - 报告内容数据填充
  // 参考 PROJECT_PLAN.md 中的报告模板结构
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #1a1a2e; padding: 40px; }
    .cover { text-align: center; margin-bottom: 40px; padding: 60px 0; background: linear-gradient(135deg, #1E3A5F, #2D5A8E); color: white; border-radius: 16px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h2 { font-size: 18px; color: #1E3A5F; border-bottom: 2px solid #F4C550; padding-bottom: 8px; margin-bottom: 16px; }
    .score-display { text-align: center; font-size: 48px; font-weight: 800; color: #1E3A5F; }
    .advantage-tag { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #EEF2FF; color: #1E3A5F; font-size: 13px; margin: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 10px 12px; border: 1px solid #E5E7EB; text-align: left; font-size: 13px; }
    th { background: #F9FAFB; font-weight: 600; }
    .career-card { background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 10px; }
    .footer { text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>人才综合测评报告</h1>
    <p>${data.userName} | ${data.reportDate}</p>
    <p>报告编号：${data.reportId}</p>
  </div>
  
  <div class="section">
    <h2>综合评估概览</h2>
    <div class="score-display">${data.comprehensiveScore}分</div>
    <p>${data.coreEvaluation}</p>
  </div>
  
  <!-- 更多章节... 根据JSON数据动态生成 -->
  
  <div class="footer">
    <p>本报告由「潜能星图」AI测评系统生成 | CONFIDENTIAL</p>
  </div>
</body>
</html>`;
}

module.exports = { generateReportPDF };
```

### 4.3 修改 report.js 的 PDF 接口

**文件：`server/routes/report.js`**

将原来返回501的接口改为实际实现：

```javascript
const { generateReportPDF } = require('../services/pdfService');

// GET /api/reports/:id/pdf
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM comprehensive_reports WHERE id = ? AND user_id = ? AND review_status = ?',
      [req.params.id, req.user.id, 'approved']
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在或未审核通过' });
    }
    
    const report = rows[0];
    const reportData = JSON.parse(report.report_content);
    
    const pdfBuffer = await generateReportPDF(reportData);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report_${report.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate PDF error:', err);
    res.status(500).json({ error: 'PDF生成失败' });
  }
});
```

---

## 五、管理员报告编辑

管理员在后台看到的报告也应该以**结构化方式**展示（而不是纯Markdown），并且可以编辑各字段：

- 查看报告时：使用和前台相同的模板渲染预览
- 编辑时：提供JSON字段级别的编辑界面（或富文本编辑核心文字段落）
- 通过后：用户即可查看

---

## 六、开发优先级

```
1. 修改AI Prompt → 输出结构化JSON（后端 session.js submit接口）
2. 改造 ReportPage → 固定模板+图表渲染（前端）
3. 实现 PDF 生成服务（后端 pdfService.js）
4. 实现 PDF 下载接口（后端 report.js）
5. 前端添加"下载PDF"按钮（ReportPage底部）
6. 管理后台报告预览改造（可选，后续做）
```

---

## 七、注意事项

1. **图表在PDF中的渲染**：PDF用Puppeteer渲染HTML，图表用纯CSS/SVG实现（不依赖Canvas），确保PDF中能正确显示
2. **内存限制**：服务器2核2G，Puppeteer较耗内存。生成PDF时限制并发（同时只允许1个PDF生成任务），完成后立即关闭browser
3. **报告数据兼容**：如果 `report_content` 中某些字段为null（用户没做对应问卷），前端和PDF模板都需要处理缺失字段
4. **品牌一致性**：PDF样式使用品牌色（深空蓝#1E3A5F + 星光金#F4C550）
