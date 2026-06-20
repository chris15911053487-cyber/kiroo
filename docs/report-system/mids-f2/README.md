# MIDS-F2 家族二代创新力报告

## 概述

MIDS-F2（Multi-dimensional Innovation Scale for Family Business 2nd Generation）是面向家族企业二代的创新力与接班潜力测评量表。报告包含综合得分、五维雷达图、S-P-F 决策矩阵、维度深度解读和发展建议。

## 涉及问卷

| 问卷ID | 文件 | 题数 | 计分方式 |
|--------|------|------|----------|
| `mids-f2` | `src/data/questionnaires/mids-f2.json` | 23题 | likert 5点 |

---

## 完整生成流程

```
用户答题 → 前端计分 → 提交 → 后端精准计分 → AI生成报告 → 入库 → 前端轮询 → 查看报告
```

### 阶段1：用户答题（前端）

| 步骤 | 文件 | 说明 |
|------|------|------|
| 入口 | `src/pages/MidsF2Landing.tsx` | 填写学历、毕业去向意图 → 创建 session → 进入答题 |
| 答题 | `src/pages/QuizPage.tsx` | 23道 Likert 5点量表题，逐题作答 |
| 实时计分 | `src/lib/scoringEngine.ts:compute()` | 前端实时计算 likert 类型维度均分 |
| 保存答案 | `src/services/sessionService.ts` | 答完最后一题 → `POST /api/sessions/:id/answers` → 写入 `assessment_records` 表 |
| 跳转 | `src/pages/TransitionPage.tsx` | 显示完成状态 → "查看结果"按钮导航到 `/submitted` |

### 阶段2：提交 & 服务端处理（核心）

**入口**: `server/routes/session.js` → `POST /api/sessions/:id/submit`（第 273-489 行）

```
POST /api/sessions/:id/submit
│
├─ 1. 验证 session 归属（user_id 匹配）
├─ 2. 读取所有 assessment_records（含原始 answers）
├─ 3. 汇总 scoreSummary = { "mids-f2": { dimensionScores, ... } }
├─ 4. 查询 users 表获取 education + graduation_intent
│
├─ 5. MIDS-F2 专属流程（非兰大模式 + 仅完成 mids-f2 问卷）
│   │
│   ├─ 5a. 精准计分：computeMidsF2(dimensionScores)
│   │     文件: server/services/midsF2ScoringService.js:14
│   │     ├─ 五维度原始分: D1(战略) D2(执行) D3(资源) D4(逆商) D5(伦理)
│   │     ├─ S-P-F 计算: S=D1, P=D2, F=(D3+D4+D5)/3
│   │     ├─ 综合总分: (D1+D2+D3+D4+D5) × 4，范围 20-100
│   │     ├─ 阈值判定（3.5）:
│   │     │   S≥3.5 P≥3.5 F≥3.5 → 领军接班 🏆
│   │     │   S≥3.5 P<3.5 F<3.5 → 独立创业 🚀
│   │     │   S<3.5 P≥3.5 F≥3.5 → 职能就业 💼
│   │     │   否则               → 深造蓄力 📚
│   │     └─ 警示: D4<2.5 或 D5<3 时触发
│   │
│   ├─ 5b. 构建条目级得分：buildEntryScores(rawAnswers, questionnaire)
│   │     文件: server/routes/session.js:55
│   │     从原始答案 + 问卷 JSON 构建 [{ dimension, sequence, text, score }]
│   │
│   └─ 5c. AI 报告生成：generateMidsF2Report()
│         文件: server/services/midsF2ReportService.js:726
│         │
│         ├─ buildMidsF2Prompt()  组装 prompt:
│         │   ├─ loadMidsF2PromptTemplate() → 从 docs/report-system/mids-f2/prompt.md 加载
│         │   │     失败则使用硬编码兜底模板 HARDCODED_MIDS_F2_TEMPLATE
│         │   ├─ buildDimensionTable()     → {{DIMENSION_TABLE}} Markdown 表格
│         │   ├─ buildEntryTables()        → {{ENTRY_TABLES}} 每题得分明细
│         │   ├─ buildSPFTable()           → {{SPF_TABLE}} S-P-F + 决策路径
│         │   └─ 填充 {{USER_NAME}} {{EDUCATION}} {{TOTAL_SCORE}} 等 15+ 占位符
│         │
│         ├─ callAI(prompt)
│         │   ├─ POST https://api.deepseek.com/v1/chat/completions
│         │   ├─ model: deepseek-chat, temperature: 0.7, max_tokens: 8192
│         │   ├─ 超时: 120s (AbortController)
│         │   └─ 失败返回 null
│         │
│         ├─ parseAIResponse(raw, ...)  解析 AI 返回:
│         │   ├─ 策略1: 去掉 markdown ```json ... ``` 代码块
│         │   ├─ 策略2: 找第一个 { 到最后一个 } 提取 JSON
│         │   ├─ 验证: 必须有 comprehensiveOverview + ≥5 个 dimensionInsights
│         │   ├─ 旧格式兼容: adaptLegacyFormat()
│         │   └─ 全部失败 → buildFallbackReport()
│         │
│         └─ buildFallbackReport()  降级方案（非 AI）:
│             ├─ 硬编码维度分析模板，按"卓越/良好/基础/待开发"四档选文案
│             ├─ buildDimensionAnalysis() + buildImpactOnSuccession()
│             ├─ buildCapabilityImprovements() → 针对 <3.5 的维度生成建议
│             ├─ buildTierSummary() → 三层能力不均衡总结
│             └─ 标记 _aiGenerated: false（管理员可识别并重新生成）
│
├─ 6. INSERT INTO comprehensive_reports
│     (report_content = JSON.stringify(aiReport), review_status = 'pending')
│     ON CONFLICT(session_id) → UPDATE 覆盖旧报告
│
├─ 7. UPDATE assessment_sessions SET status = 'submitted'
│
└─ 8. 返回 { sessionId, reportId, scoreSummary, comprehensiveScore }
```

**关键设计**: AI 调用在提交阶段是**同步**的（commit `2753ab5`），用户等待 15-60 秒，确保不降级到占位报告。若 AI 失败则用 `buildFallbackReport()` 兜底。

### 阶段3：前端轮询审核状态

**文件**: `src/pages/SubmittedPage.tsx`

```
提交成功 → 显示 "已提交，生成报告中…预计等待15s~60s"
│
├─ 每 5 秒轮询 GET /api/reports/:id
├─ 最长轮询 120 秒
├─ 检查 report.reviewStatus
│   ├─ pending  → 继续轮询
│   ├─ approved → 停止轮询，显示 "查看报告" 按钮
│   └─ rejected → 停止轮询，显示 "重新审核中"
│
└─ 点击 "查看报告" → 跳转 /report/{reportId}
```

### 阶段4：报告渲染（前端）

**入口**: `src/pages/ReportPage.tsx` → `isMidsF2Report()` 检测 → 委托 `src/pages/MidsF2ReportPage.tsx`

报告 JSON 包含 6 章，直接渲染：

| 章节 | 内容 | 对应组件区域 |
|------|------|-------------|
| Ch1 认识你自己 | 五维度框架说明（顶层·方向感 / 中层·落地感 / 底层·根基感） | `FrameworkSection` |
| Ch2 五维能力画像 | 雷达图 + 仪表盘 + S-P-F 决策路径卡片 | `ScoreSection` + `RadarSection` + `DecisionMatrixSection` |
| Ch3 维度深度解读 | 五个维度逐一分析，含条目级得分解读 | `DimensionInsightsSection` |
| Ch4 发展建议 | 能力提升建议 + 干系人（父辈/老臣）沟通建议 | `ImprovementPlanSection` |
| Ch5 总结与展望 | 三层能力不均衡总结 + 发展方向 | `SummarySection` |
| Ch6 职业路径建议 | 四选一职业路径详解 + 阶段发展路线图 | `CareerPathSection` |

### 阶段5：PDF 导出

| 步骤 | 文件 | 说明 |
|------|------|------|
| 构建 HTML | `server/services/pdfService.js:buildMidsF2ReportHTML()` | 将报告 JSON 渲染为完整 HTML 页面 |
| 生成 PDF | `server/services/pdfService.js:generateReportPDF()` | Puppeteer 渲染为 A4 PDF，失败则降级为 HTML 展示 |
| 接口 | `GET /api/reports/:id/pdf` | 返回 PDF 文件流 |

### 阶段6：管理员重新生成

**入口**: `server/routes/admin.js` → `POST /api/admin/reports/:id/generate`

与用户提交路径不同，管理员重新生成使用队列服务控制并发：

```
POST /api/admin/reports/:id/generate
│
├─ 重新读取 assessment_records 获取原始得分
├─ 重新执行 computeMidsF2() + generateMidsF2Report()
├─ 通过 queueService.enqueue() 控制并发:
│   ├─ 最多 3 个任务同时执行
│   ├─ 单任务超时 180 秒
│   └─ 超出并发限制的任务排队等待 (FIFO)
└─ UPDATE comprehensive_reports SET report_content = 新报告 JSON
```

---

## 计分方式

### 五维度计分

1. **前端计分**: `scoringEngine.ts:compute()` → likert 类型 → 返回 5 维度均分（1-5）
2. **后端计分**: `midsF2ScoringService.js:computeMidsF2()` → 与前端逻辑一致
3. **S-P-F 矩阵**:
   - S (Strategic) = `strategic_breakthrough` 维度均分
   - P (Practical) = `execution_disruption` 维度均分
   - F (Family/Foundation) = `(resource_integration + adversity_quotient + ethics_vision) / 3`
4. **决策路径**: 阈值 3.5 → 四象限判定
5. **综合总分**: 五维度均分之和 × 4，范围 20-100

### 得分等级

| 等级 | 范围 | 含义 |
|------|------|------|
| 卓越 | ≥ 4.5 | 该维度已是核心竞争力 |
| 良好 | 3.5 ~ 4.49 | 有不错基础，有提升空间 |
| 基础 | 2.5 ~ 3.49 | 有意识但尚未形成能力 |
| 待开发 | < 2.5 | 当前显著短板 |

---

## AI 报告生成配置

| 配置 | 值 |
|------|-----|
| 模型 | `deepseek-chat` |
| max_tokens | 8192 |
| temperature | 0.7 |
| 超时 | 120s（用户提交）/ 180s（管理员重新生成） |
| 提示词模板 | [`prompt.md`](./prompt.md) |
| 提示词加载 | 优先读文件，失败则用硬编码兜底 |

### prompt.md 核心设计原则

| 原则 | 说明 |
|------|------|
| 优势视角 | 每个维度先写"你厉害在哪"，再写"哪里还能长" |
| 像朋友聊天 | 全篇用"你"，禁用"赋能/闭环/抓手/底层逻辑"等术语 |
| 结论先行 | 每个维度第一句话就是核心判断，五个角度开头不雷同 |
| 有根有据 | 分数融化在叙述里，不出现"条目X得Y分" |
| 交叉不孤立 | 至少找 1-2 对维度之间的联动（协同放大/补偿掩盖/潜力激活） |
| 总分结构 | 每段第一句 `**粗体**` 写核心判断，后面展开 |

---

## 双重兜底机制

```
AI 调用
├─ 成功 → parseAIResponse()
│   ├─ JSON 解析成功 + 结构完整 → ✅ AI 报告 (_aiGenerated: true)
│   └─ JSON 解析/结构验证失败    → ⚠️ buildFallbackReport() (_aiGenerated: false)
│
└─ 失败 (超时/网络/API错误)      → ⚠️ buildFallbackReport() (_aiGenerated: false)

管理员可通过后台触发重新生成，用 queueService 限流
```

---

## 五维度体系

| 维度 Key | 中文名 | 层级 | 说明 |
|----------|--------|------|------|
| `strategic_breakthrough` | 战略破局力 | 顶层·方向感 | 看方向——行业判断、跨界思维、逆周期布局 |
| `execution_disruption` | 执行颠覆力 | 中层·落地感 | 做事情——数字化工具、数据决策、0→1实战 |
| `resource_integration` | 资源整合力 | 中层·落地感 | 撬资源——内部挖潜、外部资本、人才引入 |
| `adversity_quotient` | 逆商与灰度 | 底层·根基感 | 扛压力——被否后迂回、灰度决策、心理韧性 |
| `ethics_vision` | 伦理与格局 | 底层·根基感 | 价值观——社会责任、长期主义、品牌信念 |

---

## 数据库表结构

| 表 | 关键字段 | 说明 |
|----|---------|------|
| `assessment_sessions` | `id, user_id, ordered_questionnaires, status` | 测评会话，status: in_progress→submitted→approved/rejected |
| `assessment_records` | `id, session_id, questionnaire_id, answers(JSON), score_result(JSON)` | 每题原始答案 + 前端计分结果 |
| `comprehensive_reports` | `id, session_id(UNIQUE), report_content(JSON), report_html, docx_path, review_status` | 报告存储，session_id 唯一约束 |

---

## 对应代码

| 功能 | 文件 | 行号 |
|------|------|------|
| 问卷定义 | `src/data/questionnaires/mids-f2.json` | - |
| 前端计分引擎 | `src/lib/scoringEngine.ts` | `compute()`:14 |
| 前端 S-P-F 计分 | `src/lib/midsF2Scoring.ts` | `computeMidsF2()`:67 |
| 前端报告渲染 | `src/pages/MidsF2ReportPage.tsx` | - |
| 报告类型检测 | `src/pages/ReportPage.tsx` | `isMidsF2Report()`:430 |
| 提交入口 | `src/pages/SubmittedPage.tsx` | 轮询:65-87 |
| Submit 编排（后端入口） | `server/routes/session.js` | `POST /:id/submit`:273-489 |
| 条目得分构建 | `server/routes/session.js` | `buildEntryScores()`:55 |
| 后端 S-P-F 计分 | `server/services/midsF2ScoringService.js` | `computeMidsF2()`:14 |
| AI 报告生成（主编排） | `server/services/midsF2ReportService.js` | `generateMidsF2Report()`:726 |
| Prompt 构建 | `server/services/midsF2ReportService.js` | `buildMidsF2Prompt()`:295 |
| AI API 调用 | `server/services/midsF2ReportService.js` | `callAI()`:414 |
| AI 响应解析 | `server/services/midsF2ReportService.js` | `parseAIResponse()`:462 |
| 降级报告生成 | `server/services/midsF2ReportService.js` | `buildFallbackReport()`:347 |
| 维度分析模板 | `server/services/midsF2ReportService.js` | `buildDimensionAnalysis()`:578 |
| 能力提升建议 | `server/services/midsF2ReportService.js` | `buildCapabilityImprovements()`:639 |
| 三层总结 | `server/services/midsF2ReportService.js` | `buildTierSummary()`:695 |
| 提示词模板 | `docs/report-system/mids-f2/prompt.md` | - |
| PDF 生成 | `server/services/pdfService.js` | `generateReportPDF()`:627 |
| 任务队列 | `server/services/queueService.js` | `enqueue()`:25 |
| Admin 重新生成 | `server/routes/admin.js` | `POST /reports/:id/generate`:546 |
