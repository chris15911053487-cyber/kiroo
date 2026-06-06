# 潜能星图 —— 技术开发策划书 (PROJECT_PLAN.md)

> **目的**：本文档供编程AI阅读，全面了解项目需求、旧版现状与新版改造方案。  
> **编制日期**：2026年6月  
> **项目路径**：`E:\kiroo\ai-assessment-assistant\`

---

## 一、项目背景与定位

### 1.1 产品是什么

「潜能星图」是一个AI驱动的人才潜能测评系统。用户通过完成多套权威心理学问卷，系统综合所有问卷得分，由AI生成一份专业的「人才综合测评报告」，帮助用户发现自身核心优势与发展方向。

### 1.2 核心原则（贯穿所有AI生成内容）

1. **报告语言中性偏正面**，不突出用户缺点，不贴负面标签
2. **聚焦优势发现**，用"发展空间"代替"劣势"
3. **标准化报告模板**，所有用户的报告结构一致，数据填充不同
4. **综合得分区间设定为65-85分**（正态分布中心75分），让大多数用户感到积极但不夸张

---

## 二、旧版现状 vs 新版改造对照表

### 2.1 架构不变的部分

| 模块 | 说明 |
|------|------|
| 技术栈 | React 18 + TypeScript + Vite + Tailwind CSS + Node.js/Express + MySQL |
| AI接口 | DeepSeek Chat API |
| 部署 | 腾讯云轻量服务器 |
| 认证 | 手机号 + 验证码登录（保留） |
| 管理后台 | 保留admin路由和基础框架 |

### 2.2 需要改造的部分

| 模块 | 旧版 | 新版 | 改造程度 |
|------|------|------|---------|
| **首页** | Hero展示+测评卡片列表 | Hello品牌页（全新） | 🔴 重写 |
| **问卷选择** | 列表页直接点击单个问卷开始 | 多选勾选页 + "开始探索"按钮 | 🔴 重写 |
| **答题流程** | 做一个问卷→立即出单个报告 | 做完所有选定问卷→统一出综合报告 | 🔴 大改 |
| **问卷数据** | 5套（personality/temperament/mbti/leadership/career） | 7套（leadership/temperament/big5/mbti/16pf/creativity/holland） | 🟡 替换+新增 |
| **计分引擎** | 单问卷计分→单独AI分析 | 所有问卷计分→综合AI分析 | 🟡 改造 |
| **报告页** | 单问卷AI报告（纯文字） | 综合报告（固定模板+图表+PDF下载） | 🔴 重写 |
| **审核机制** | 每个问卷单独审核 | 只审核综合报告（一次审核） | 🟡 修改 |
| **用户流程** | 登录→选问卷→答题→看报告 | Hello页→登录→选问卷组合→逐个答题→提交→等待审核→看报告 | 🟡 流程重构 |
| **进度保存** | 无 | 以问卷为单位保存进度 | 🟢 新增 |
| **过渡页** | 无 | 问卷之间有过渡动画页 | 🟢 新增 |

---

## 三、新版完整用户流程

```
用户打开应用
    │
    ▼
┌─────────────────────────────────┐
│  [Hello品牌页]                   │
│  - 品牌价值传递                   │
│  - 核心卖点展示                   │
│  - CTA: 「立刻探索潜能」          │
└─────────────────────────────────┘
    │ 点击CTA
    ▼
┌─────────────────────────────────┐
│  [登录/注册页]                    │
│  - 已登录 → 跳过                  │
│  - 未登录 → 手机号+验证码注册/登录  │
└─────────────────────────────────┘
    │ 登录成功
    ▼
┌─────────────────────────────────┐
│  [问卷选择页]                     │
│  - 展示7个问卷卡片（含题数、用时）  │
│  - 用户自由勾选（无最低/最高限制）  │
│  - 推荐提示：全选获得最完整画像     │
│  - CTA: 「开始探索」              │
│  - 如有未完成的测评，显示"继续"入口 │
└─────────────────────────────────┘
    │ 点击开始探索
    ▼
    系统按优先级排序用户选择的问卷
    │
    ▼
┌─────────────────────────────────┐
│  [答题页] 问卷1（按排序后第一个）  │
│  - 逐题回答                      │
│  - 显示进度（当前第X题/共Y题）     │
│  - 顶部显示：第1/N个问卷           │
└─────────────────────────────────┘
    │ 完成问卷1
    ▼
┌─────────────────────────────────┐
│  [过渡页]                         │
│  - "恭喜完成第1个测评！"           │
│  - 鼓励语                         │
│  - 按钮: 「继续下一个」           │
│  - 自动保存当前进度               │
└─────────────────────────────────┘
    │
    ▼
   ... 重复答题→过渡 直到所有选定问卷做完 ...
    │
    ▼
┌─────────────────────────────────┐
│  [提交成功页]                     │
│  - "所有测评已完成！"             │
│  - "您的综合报告正在生成中"       │
│  - "提交成功，等待专家审核"       │
│  - 可返回首页                     │
└─────────────────────────────────┘
    │
    ▼ (后台)
┌─────────────────────────────────┐
│  [AI自动生成报告]                 │
│  - 汇总所有问卷得分               │
│  - 按固定模板生成综合报告         │
│  - 状态标记为 pending             │
└─────────────────────────────────┘
    │
    ▼ (管理员)
┌─────────────────────────────────┐
│  [管理员审核页]                   │
│  - 查看用户做了哪些问卷           │
│  - 查看AI生成的报告               │
│  - 可直接编辑报告文字             │
│  - 点击「审核通过」发布           │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  [用户查看报告]                   │
│  - 综合报告（含图表）             │
│  - 可下载PDF版本                  │
└─────────────────────────────────┘
```

---

## 四、页面清单与路由设计

| 路由 | 页面 | 说明 | 状态 |
|------|------|------|------|
| `/` | HelloPage | 品牌展示页 | 🆕 新增 |
| `/login` | LoginPage | 登录页 | ♻️ 保留改造 |
| `/register` | RegisterPage | 注册页 | ♻️ 保留改造 |
| `/select` | SelectQuestionnairePage | 问卷多选页 | 🆕 新增 |
| `/quiz/:sessionId` | QuizPage | 答题页（按session进行，含过渡逻辑） | ♻️ 大改 |
| `/quiz/:sessionId/transition` | TransitionPage | 问卷间过渡页（通过路由参数获取session上下文） | 🆕 新增 |
| `/submitted` | SubmittedPage | 提交成功等待审核页 | 🆕 新增 |
| `/report/:id` | ReportPage | 综合报告查看页 | 🔴 重写 |
| `/history` | HistoryPage | 历史报告列表 | ♻️ 修改 |
| `/profile` | ProfilePage | 个人中心 | ♻️ 保留 |
| `/admin/login` | AdminLoginPage | 管理员登录 | ♻️ 保留 |
| `/admin/dashboard` | AdminDashboard | 管理后台 | ♻️ 改造 |

**删除的路由：**
- `/assessments`（旧的问卷列表页，被 `/select` 替代）
- `/report`（旧的单问卷报告页，被 `/report/:id` 替代）

---

## 五、测评问卷系统

### 5.1 问卷清单与优先级

系统内固定优先级顺序（用于排序用户选择的问卷）：

```javascript
const QUESTIONNAIRE_PRIORITY = [
  { id: 'leadership',   name: '领导风格测评',           questions: 12,  estimatedMinutes: 3  },
  { id: 'temperament',  name: '气质类型测试',           questions: 60,  estimatedMinutes: 10 },
  { id: 'big5',         name: '大五人格测试',           questions: 60,  estimatedMinutes: 10 },
  { id: 'mbti',         name: 'MBTI性格测试',           questions: 93,  estimatedMinutes: 15 },
  { id: '16pf',         name: '卡氏十六种人格因素测验',  questions: 187, estimatedMinutes: 30 },
  { id: 'creativity',   name: '创造力障碍测评',         questions: 37,  estimatedMinutes: 6  },
  { id: 'holland',      name: '霍兰德职业兴趣测试',     questions: 90,  estimatedMinutes: 15 },
]
```

### 5.2 问卷数据格式

沿用现有JSON格式，但需要：
- 将 `personality.json` 替换为 `big5.json`（大五人格）
- 将 `career.json` 替换为 `holland.json`（霍兰德职业兴趣）
- 新增 `16pf.json`（卡氏16PF）
- 新增 `creativity.json`（创造力障碍）
- 保留 `leadership.json`、`temperament.json`、`mbti.json`

### 5.3 计分规则

每个问卷JSON保留现有的 `scoring_rule` 结构：
- `additive` 类型：维度得分累加
- `categorical` 类型：频次统计归类

关键变化：**计分后不再单独出报告，而是将所有问卷的计分结果汇总，传给AI生成综合报告。**

---

## 六、数据库设计改造

### 6.1 新增表：assessment_sessions（测评会话）

```sql
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  selected_questionnaires JSON NOT NULL,    -- ["leadership","temperament","big5"]
  ordered_questionnaires JSON NOT NULL,     -- 按优先级排序后的列表
  current_index INT DEFAULT 0,             -- 当前做到第几个问卷（0-based）
  status ENUM('in_progress', 'completed', 'submitted', 'approved') DEFAULT 'in_progress',
  status ENUM('in_progress', 'completed', 'submitted', 'approved', 'rejected') DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  CONSTRAINT uk_user_active UNIQUE (user_id, status)  -- 配合应用层逻辑确保同时只有一个活跃session
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.2 修改表：assessment_records

```sql
-- 旧版：每做一个问卷一条记录，独立审核
-- 新版：每做一个问卷一条记录，但关联到session，不单独审核

ALTER TABLE assessment_records 
  ADD COLUMN session_id INT DEFAULT NULL,
  ADD FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE SET NULL;

-- 去掉单条记录的审核字段（审核移到综合报告级别）
-- review_status, review_comment, reviewed_at 字段保留但不再使用
```

### 6.3 新增表：comprehensive_reports（综合报告）

```sql
CREATE TABLE IF NOT EXISTS comprehensive_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  questionnaires_completed JSON NOT NULL,   -- 完成的问卷ID列表
  score_summary JSON NOT NULL,              -- 各问卷汇总得分
  report_content LONGTEXT NOT NULL,         -- AI生成的报告正文（Markdown/HTML）
  comprehensive_score DECIMAL(5,2) NOT NULL, -- 综合得分（65-85区间）
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  review_comment VARCHAR(500) DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 七、API设计

### 7.1 新增/修改的API端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sessions` | 创建测评会话（传入选择的问卷列表） |
| GET | `/api/sessions/current` | 获取当前用户进行中的会话 |
| GET | `/api/sessions/:id` | 获取会话详情 |
| POST | `/api/sessions/:id/answers` | 提交单个问卷的答案（存档点） |
| POST | `/api/sessions/:id/submit` | 完成所有问卷，触发报告生成 |
| GET | `/api/reports` | 获取用户的综合报告列表 |
| GET | `/api/reports/:id` | 获取报告详情 |
| GET | `/api/reports/:id/pdf` | 下载PDF版本 |
| GET | `/api/admin/reports` | 管理员：获取待审核报告列表 |
| GET | `/api/admin/reports/:id` | 管理员：获取报告详情（含用户做了哪些问卷） |
| PUT | `/api/admin/reports/:id` | 管理员：编辑报告内容 |
| POST | `/api/admin/reports/:id/approve` | 管理员：审核通过 |
| POST | `/api/admin/reports/:id/reject` | 管理员：退回 |

### 7.2 废弃的API

| 方法 | 路径 | 原因 |
|------|------|------|
| POST | `/api/assessment/analyze` | 旧版单问卷AI分析，改为综合分析 |
| PUT | `/api/admin/assessments/:id/review` | 旧版单条审核，改为综合报告审核 |

---

## 八、AI报告生成策略

### 8.1 输入数据

AI接收的输入为所有已完成问卷的计分结果汇总：

```json
{
  "user_name": "用户昵称",
  "completed_questionnaires": ["leadership", "temperament", "big5", "mbti", "16pf", "creativity", "holland"],
  "scores": {
    "leadership": { "supportive": 7, "directive": 3, "coaching": 2, "delegating": 0 },
    "temperament": { "sanguine": 19, "choleric": 12, "phlegmatic": 8, "melancholic": 5 },
    "big5": { "openness": 60, "conscientiousness": 58, "extraversion": 62, "agreeableness": 58, "neuroticism": 68 },
    "mbti": { "type": "ENFP", "dimensions": {"E": 65, "N": 58, "F": 55, "P": 60} },
    "16pf": { "A": 12, "B": 14, "C": 8, "E": 10, "F": 14, "G": 8, "H": 14, "I": 6, "L": 8, "M": 14, "N": 6, "O": 8, "Q1": 14, "Q2": 4, "Q3": 6, "Q4": 8 },
    "creativity": { "barriers": ["perfectionism", "fear_of_failure"], "total_score": 28 },
    "holland": { "R": 12, "I": 18, "A": 22, "S": 25, "E": 20, "C": 10, "dominant": "SAE" }
  }
}
```

### 8.2 Prompt模板核心约束

```
你是一位资深人才测评专家。请根据以下多维测评数据，生成一份专业的人才综合测评报告。

## 报告风格约束（必须严格遵守）：
1. 语言中性偏正面，绝对不可以使用否定性、贬义性词汇描述用户
2. 用"发展空间"、"提升方向"代替"缺点"、"劣势"
3. 聚焦优势发现，先讲核心优势，再讲发展潜力
4. 综合得分必须在65-85分之间（基于测评数据合理计算）
5. 所有描述必须有数据支撑，不可凭空编造

## 报告结构（必须严格按此结构输出）：
### 第一部分 综合评估概览
- 测评总览（一段话概括）
- 综合得分：XX分（满分100分）
- 核心评价（一段话，200字以内）

### 第二部分 核心优势
- 提炼5-6项核心竞争优势，每项包含：优势名称+数据支撑+简要描述

### 第三部分 能力维度分析
- 3.1 人格特质分析（大五人格维度解读表格）
- 3.2 16PF深度分析（如有）
- 3.3 气质类型分析
- 3.4 MBTI类型解读（如有）
- 3.5 二元性格特征（基于16PF计算）
- 3.6 领导力风格分析
- 3.7 创造力分析（如有）
- 3.8 职业兴趣分析（霍兰德，如有）

### 第四部分 发展潜力与建议
- 4.1 适合的职业方向（3-4个方向，每个配简要理由）
- 4.2 能力提升建议（3-4条，正面表述）
- 4.3 团队角色定位（贝尔宾模型）

### 第五部分 总结与展望
- 整体总结（一段话）
- 发展寄语（正面激励）

## 注意事项：
- 只输出用户实际完成的问卷对应的分析板块
- 如用户只做了3个问卷，则只分析对应的3个维度，但仍要给出综合建议
- 综合得分需根据实际做的问卷数量和得分合理计算
```

### 8.3 报告图表

报告中的图表使用**前端渲染**（固定模板+数据填充）：
- 综合得分仪表盘
- 大五人格雷达图
- 16PF柱状图
- 领导风格饼图/环形图
- 霍兰德六边形图
- 核心特质标签云

图表数据从 `score_summary` 直接读取渲染，不依赖AI生成图片。

---

## 九、Hello品牌页内容规划

### 9.1 页面结构

```
┌──────────────────────────────────────┐
│  [Hero区域]                           │
│  大标题：多维测评，点亮你的潜能星图      │
│  副标题：基于7大权威量表 × AI智能分析    │
│  CTA按钮：「立刻探索潜能」 ✨          │
│  背景：星空/星图风格渐变               │
├──────────────────────────────────────┤
│  [核心卖点 - 3-4个卡片]               │
│  ① 7大权威量表，多维度深度测评          │
│  ② AI智能交叉分析，发现你的优势组合     │
│  ③ 专家团队审核，确保报告质量           │
│  ④ 正向赋能，聚焦潜能而非标签          │
├──────────────────────────────────────┤
│  [测评流程展示 - 步骤图]               │
│  选择问卷 → 完成测评 → 生成报告 → 查看  │
├──────────────────────────────────────┤
│  [数据背书]                           │
│  "已帮助 XXX+ 人发现潜能"              │
│  "专家团队指导设计"                    │
│  "基于百万级科研数据验证"              │
├──────────────────────────────────────┤
│  [用户评价/案例]（前期可放模拟案例）     │
│  "通过测评，我更清晰了自己的方向..."    │
├──────────────────────────────────────┤
│  [底部CTA]                            │
│  再次出现「立刻探索潜能」按钮           │
└──────────────────────────────────────┘
```

### 9.2 设计要点

- 移动端优先，单列布局
- 品牌色：深空蓝 `#1E3A5F` + 星光金 `#F4C550`
- 不提及具体专家姓名，使用"专家团队"
- 风格：科技感 + 温暖感并存

---

## 十、管理后台改造

### 10.1 管理员Dashboard新需求

| 功能 | 说明 |
|------|------|
| 报告审核列表 | 显示待审核的综合报告（非单条问卷） |
| 报告详情 | 显示用户做了哪些问卷 + AI生成的报告全文 |
| 编辑报告 | 管理员可直接修改报告文字（富文本编辑器） |
| 审核操作 | 「通过」/「退回」按钮 |
| 用户管理 | 查看用户列表和测评历史 |

### 10.2 管理员看到的信息

```
用户：张三
提交时间：2026-06-05 14:30
完成问卷：领导风格 ✓ | 气质类型 ✓ | 大五人格 ✓ | MBTI ✓ | 16PF ✗ | 创造力 ✓ | 霍兰德 ✗
综合得分：76.5分
报告状态：待审核

[查看/编辑报告]  [审核通过]  [退回]
```

---

## 十一、前端组件改造清单

### 11.1 需要新增的组件

| 文件路径 | 说明 |
|---------|------|
| `src/pages/HelloPage.tsx` | 品牌展示页 |
| `src/pages/SelectQuestionnairePage.tsx` | 问卷多选页 |
| `src/pages/TransitionPage.tsx` | 问卷间过渡页 |
| `src/pages/SubmittedPage.tsx` | 提交成功等待审核页 |
| `src/components/QuestionnaireCheckbox.tsx` | 问卷选择卡片（带勾选） |
| `src/components/ProgressTracker.tsx` | 整体进度追踪（第X/Y个问卷） |
| `src/components/ReportViewer.tsx` | 综合报告展示组件 |
| `src/components/charts/RadarChart.tsx` | 雷达图（大五人格） |
| `src/components/charts/BarChart.tsx` | 柱状图（16PF） |
| `src/components/charts/PieChart.tsx` | 环形图（领导风格） |
| `src/components/charts/HexagonChart.tsx` | 六边形图（霍兰德） |
| `src/components/charts/GaugeChart.tsx` | 仪表盘（综合得分） |

### 11.2 需要修改的组件

| 文件路径 | 改动 |
|---------|------|
| `src/App.tsx` | 路由重构，替换旧路由 |
| `src/pages/QuizPage.tsx` | 改为基于session答题，完成后跳过渡页而非报告页 |
| `src/pages/HistoryPage.tsx` | 显示综合报告列表（而非单问卷记录） |
| `src/pages/ReportPage.tsx` | 重写为综合报告展示页 |
| `src/pages/admin/AdminDashboard.tsx` | 改为审核综合报告 |
| `src/context/AssessmentContext.tsx` | 新增session状态管理 |
| `src/services/api.ts` | 新增session和report相关API调用 |

### 11.3 可以删除的组件

| 文件路径 | 原因 |
|---------|------|
| `src/pages/AssessmentListPage.tsx` | 被SelectQuestionnairePage替代 |
| `src/pages/LandingPage.tsx` | 被HelloPage替代 |

---

## 十二、问卷JSON数据文件对照

| 旧文件 | 新文件 | 操作 |
|--------|--------|------|
| `leadership.json` | `leadership.json` | 保留，可能需更新题目 |
| `temperament.json` | `temperament.json` | 保留，可能需更新题目 |
| `personality.json` | `big5.json` | 重命名+更新题目 |
| `mbti.json` | `mbti.json` | 保留，可能需更新题目 |
| `career.json` | `holland.json` | 重命名+更新题目 |
| — | `16pf.json` | 🆕 新增（187题） |
| — | `creativity.json` | 🆕 新增（37题） |

---

## 十三、PDF报告生成

### 13.1 方案

使用后端生成PDF：
- 报告内容存储为结构化数据（JSON/Markdown）
- 使用 Node.js PDF库（如 puppeteer/pdfkit）渲染为PDF
- 图表使用服务端渲染或预生成的SVG嵌入

### 13.2 报告模板

PDF报告的视觉设计参考提供的Word版报告模板，包含：
- 封面页（CONFIDENTIAL + 用户名 + 日期 + 报告编号）
- 目录页
- 各章节内容（带配图/图表）
- 标准化表格
- 页眉页脚

---

## 十四、进度保存机制

### 14.1 规则

- 以问卷为单位保存（做完一个问卷=一个存档点）
- 做一半的问卷不保存（如果中途退出，下次从该问卷第1题重新开始）
- 用户下次登录后，如有进行中的session，显示"继续测评"入口

### 14.2 实现

- 完成一个问卷时，调用 `POST /api/sessions/:id/answers` 保存该问卷答案
- 同时更新 session 的 `current_index + 1`
- 用户登录后查询 `GET /api/sessions/current` 检查是否有未完成的session

---

## 十四点五、补充规则与边界情况

### 14.3 前端校验规则

- **至少选择1个问卷**：用户在问卷选择页未勾选任何问卷时，"开始探索"按钮禁用（disabled），并显示提示文字"请至少选择一个测评问卷"
- **同一用户同时只能有一个活跃session**：如果用户已有 `status = 'in_progress'` 的session，则不允许创建新session。问卷选择页应检测是否有未完成session，如有则显示"继续上次测评"入口，隐藏"开始探索"按钮
- 后端 `POST /api/sessions` 也需校验：如当前用户已有 in_progress 的 session，返回 409 Conflict

### 14.4 已登录用户访问首页的跳转逻辑

```
用户访问 /（HelloPage）
    │
    ├── 未登录 → 正常显示品牌页
    │
    └── 已登录 → 自动跳转 /select（问卷选择页）
```

即：品牌页仅面向未登录新用户展示，已登录用户无需重复看品牌页。

### 14.5 管理员退回(Reject)后的流程

```
管理员点击"退回"
    │
    ├── comprehensive_reports.review_status → 'rejected'
    ├── assessment_sessions.status → 'rejected'
    │
    └── 用户端显示：
        "您的报告正在修订中，请耐心等待"
        （用户无需重做测评，管理员修改后可重新提交审核）

管理员修改报告内容后：
    │
    ├── PUT /api/admin/reports/:id 编辑报告
    └── POST /api/admin/reports/:id/approve 重新通过
```

即：退回 = 管理员认为AI报告质量不够，需要手动修改后再通过。用户不需要重做。

### 14.6 过渡页上下文传递方式

过渡页通过路由参数 `:sessionId` + 从API获取session详情来确定上下文：

```typescript
// TransitionPage 获取信息
const { sessionId } = useParams()
// 调用 GET /api/sessions/:id 获取:
// - ordered_questionnaires（排序后的问卷列表）
// - current_index（刚完成的是第几个，0-based）
// 显示: "恭喜完成第 {current_index} 个测评！"
// 按钮: 跳转到 /quiz/:sessionId 继续下一个
// 如果 current_index === total - 1，则跳转到 /submitted
```

### 14.7 PDF报告生成技术方案明确

前端报告页和PDF报告使用**同一套图表逻辑**，具体方案：

1. **前端查看**：ReportViewer组件使用前端图表库（如 Chart.js / ECharts）渲染
2. **PDF生成（后端）**：使用 Puppeteer 渲染一个专用的报告HTML模板页面（含相同的图表JS），然后导出为PDF
   - 后端路径: 创建一个 `/internal/report-render/:id` 页面（不暴露给用户）
   - Puppeteer 打开这个页面 → 等待图表渲染完成 → `page.pdf()` 导出
   - 这样前端展示和PDF下载的视觉效果保持一致

### 14.8 移动端导航（BottomNav）方案

新版保留底部Tab导航，但调整Tab项：

| Tab | 图标 | 路径 | 说明 |
|-----|------|------|------|
| 探索 | 🧭 | `/select` | 问卷选择/继续测评 |
| 报告 | 📊 | `/history` | 历史报告列表 |
| 我的 | 👤 | `/profile` | 个人中心 |

**隐藏BottomNav的页面**：`/`（HelloPage）、`/login`、`/register`、`/quiz/*`（答题中）、`/quiz/*/transition`、`/submitted`、`/admin/*`

---

## 十五、部署配置

| 项目 | 配置 |
|------|------|
| 服务器 | 腾讯云轻量应用服务器 2核2G |
| 系统 | Ubuntu / CentOS |
| 运行时 | Node.js 18+ |
| 数据库 | MySQL 8.0 |
| 进程管理 | PM2 |
| 反向代理 | Nginx |
| AI接口 | DeepSeek Chat API |
| 域名/SSL | 待配置 |

---

## 十六、开发优先级建议

```
Phase 1 - 核心流程（先跑通最小闭环）
├── 数据库新建表
├── 问卷选择页 + session创建API
├── 答题页改造（基于session）
├── 过渡页
├── 提交页
├── AI综合报告生成API
└── 报告查看页（基础版）

Phase 2 - 管理后台
├── 综合报告审核列表
├── 报告编辑功能
├── 审核通过/退回
└── 用户问卷完成标注

Phase 3 - 品牌与体验
├── Hello品牌页
├── 图表组件（雷达图/柱状图等）
├── PDF下载功能
├── 进度保存与恢复
└── UI美化与动效

Phase 4 - 问卷数据
├── 替换/新增7套问卷JSON数据
├── 各问卷计分规则校准
└── AI Prompt调优
```

---

> **本文档为编程开发参考文档，包含完整的产品需求与技术实现方案。**  
> **开发时请严格遵循上述流程、数据结构和API设计。**
