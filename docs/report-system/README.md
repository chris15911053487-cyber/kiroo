# 测评报告系统 — 工作方法与核心资产

> 本文件夹是测评系统生成报告的"规则手册"和"工作指南"。
> 所有内容应长期保存、版本管理，作为系统维护和优化的唯一依据。
>
> 当前支持两套报告：**兰大综合报告**（LZU）和 **MIDS-F2 创新力报告**。

---

## 工作方法

### 兰大综合报告（LZU）

```
用户提交 3 套问卷
    │
    ├── ① 读取问卷规则（lzu/01-问卷规则/）
    │     按题目→选项→分值累加，计算各维度原始得分
    │
    ├── ② 系统精准计分（lzuScoringService.js）
    │     权重：领导风格(30%) + 人格特质(40%) + 创造力障碍(30%) = 总分100
    │     等级：卓越型(≥90) / 进取型(75-89) / 成长型(60-74) / 待发展型(<60)
    │
    ├── ③ 调用AI（发送提示词，代码写死在 lzuReportGenerator.js）
    │     AI获得：系统分数 + 输出格式要求
    │     AI返回：结构化文字分析（按 [SECTION:xxx] 标记分割）
    │
    └── ④ 按模版排版（lzuReportTemplate.js）
          将分数+图表+AI文字按固定模块顺序组装为HTML
```

### MIDS-F2 创新力报告

```
用户提交 mids-f2 问卷
    │
    ├── ① 前端/后端计分（midsF2Scoring.ts / midsF2ScoringService.js）
    │     5维度均分(1-5) → S-P-F矩阵 → 决策路径 → 警示
    │
    ├── ② 调用AI（发送提示词文件 → 见下方"提示词驱动"）
    │     AI获得：维度得分 + S-P-F数据 + JSON输出格式
    │     AI返回：结构化JSON（维度解读、职业建议、提升计划）
    │
    └── ③ 前端 React 渲染（MidsF2ReportPage.tsx）
          仪表盘 + 雷达图 + S-P-F矩阵 + AI解读 + 发展建议
```

**核心原则：**
- **MIDS-F2 提示词文件驱动**——修改报告内容只需编辑 `mids-f2/prompt.md`，**无需改代码**
- **LZU 提示词仍写死在代码中**——需修改 `lzuReportGenerator.js` 的 `buildAIPrompt()` 函数
- **分数由系统计算**——AI只解读分数，不修改分数
- **前端渲染**——MIDS-F2 由 React 组件渲染，不走 HTML 模版

---

## 文件夹结构

```
docs/report-system/
├── README.md                           ← 你正在看的文件
├── _template/                          ← 新问卷参考模板
│   ├── prompt.md                       ← AI 提示词模板（含 {{PLACEHOLDER}}）
│   ├── output-schema.json              ← JSON Schema 骨架
│   └── example-output.json             ← 示例输出骨架
├── lzu/                                ← 兰大综合报告
│   ├── README.md
│   ├── 01-问卷规则/                     ← 问卷规则文档
│   │   ├── 兰大研究生测评原始规则.docx    ★ 原始参考文件
│   │   ├── 01-LASI-领导风格量表.md
│   │   ├── 02-16PF-人格测验(精选版).md
│   │   └── 03-创造力障碍测试.md
│   ├── 02-报告模版/                     ← 报告模版（HTML 参考）
│   │   ├── 参考版本.html                ★ 原始参考文件
│   │   ├── 报告模版初版.html
│   │   ├── 参考模版更新.html
│   │   └── 综合报告排版规范.md
│   └── 03-提示词/                      ← 提示词文档（仅参考，代码不读取）
│       ├── 原始提示词参考.md             ★ 原始参考
│       ├── 提示词初版.md
│       ├── 提示词更新.json
│       └── AI报告生成提示词.md           ← 当前提示词文字版
└── mids-f2/                            ← MIDS-F2 创新力报告
    ├── README.md
    ├── prompt.md                       ★ AI 提示词模板（运行时读取！）
    ├── output-schema.json              ← AI 输出结构校验
    └── example-output.json             ← 示例输出参考
```

> 标注 ★ 的是用户提供的原始参考文件，具有最高权威性。
> 标注"运行时读取"的是代码实际加载并发送给 AI 的文件。**修改这些文件立即生效，无需重启。**

---

## 修改报告的方法

### MIDS-F2 报告（推荐方式 ✅）

| 调整目标 | 操作 | 示例 |
|---------|------|------|
| 改变AI角色/分析角度 | 编辑 `mids-f2/prompt.md` 第一段 | "把专家身份从传承专家改为职业规划师" |
| 改变输出JSON结构 | 编辑提示词中的"## JSON结构定义" | "增加一个 personalityAnalysis 字段" |
| 改变文字风格/语气 | 编辑提示词中的"## 报告风格约束" | "把150字改成200字" |
| 改变报告视觉布局 | 修改 `src/pages/MidsF2ReportPage.tsx` React 组件 | "把雷达图移到最上面" |
| 修改计分公式 | 同步修改 `midsF2Scoring.ts` + `midsF2ScoringService.js` | "THRESHOLD 从 3.5 调到 4.0" |

> **MIDS-F2 提示词文件修改后立即生效，无需重启服务。**

### LZU 报告（当前需改代码）

| 调整目标 | 修改文件 | 示例 |
|---------|---------|------|
| 改变AI分析角度/语气/深度 | `lzuReportGenerator.js` → `buildAIPrompt()` | "把分析角度从个人发展改为人岗匹配" |
| 增加/删除报告模块 | 提示词 + 报告模版 + 代码模板 | "增加一个'沟通风格'模块" |
| 修改计分权重 | `lzuScoringService.js` + 更新本文档 | "领导力从30%调到35%" |
| 修改图表样式 | `lzuChartService.js` + 更新模版文档 | "柱状图改成横向" |

---

## 代码文件对应关系

### LZU

| 功能 | 代码文件 |
|------|---------|
| 计分服务 | `server/services/lzuScoringService.js` |
| 图表生成 | `server/services/lzuChartService.js` |
| 报告编排 | `server/services/lzuReportGenerator.js` |
| HTML模版 | `server/services/lzuReportTemplate.js` |
| Word构建 | `server/services/lzuDocxBuilder.js` |
| PDF 导出 | `server/services/pdfService.js` |
| 问卷数据 | `src/data/questionnaires/lzu-*.json` |

### MIDS-F2

| 功能 | 代码文件 |
|------|---------|
| 提示词模板 | `docs/report-system/mids-f2/prompt.md` ← **可直接编辑** |
| AI 报告生成 | `server/services/midsF2ReportService.js` |
| 后端计分 | `server/services/midsF2ScoringService.js` |
| 前端计分 | `src/lib/midsF2Scoring.ts` |
| 前端渲染 | `src/pages/MidsF2ReportPage.tsx` |
| 问卷数据 | `src/data/questionnaires/mids-f2.json` |

---

## 核心资产速查

以下三张表覆盖了系统的全部可修改资产，按"改什么 → 去哪里改"组织。

### 一、题库（题目+选项）

题库以 **JSON 文件** 形式保存在前端源码目录，构建时直接打包进应用。

```
src/data/questionnaires/
├── big5.json              ← 大五人格测试（10题，additive）
├── mbti.json              ← 十六人格测试（12题，categorical）
├── 16pf.json              ← 卡氏十六种人格因素测验（187题，additive）
├── holland.json           ← 霍兰德职业兴趣测试（12题，categorical）
├── leadership.json        ← 领导风格测评（10题，additive）
├── creativity.json        ← 创造力障碍测评（37题，additive）
├── temperament.json       ← 气质类型测试（10题，categorical）
├── lzu-leadership.json    ← 兰大-领导风格问卷（12题，additive）
├── lzu-personality.json   ← 兰大-人格测验（15题，additive）
├── lzu-creativity.json    ← 兰大-创造力障碍测试（12题，additive）
└── mids-f2.json           ← 家族二代多维创新力量表（23题，likert）
```

每个 JSON 文件结构：

| 字段 | 说明 |
|------|------|
| `id` | 问卷唯一标识 |
| `name` | 问卷中文名 |
| `questions[]` | 题目列表（含 `id`、`text`、`options[]`） |
| `scoring_rule` | 计分规则（见下方"计分标准"） |

加载方式：`src/lib/questionnaireLoader.ts` 通过 `import.meta.glob` 在构建时动态导入。

**题库不经过后端 API，也没有数据库表存储。** 用户答案存于 SQLite（`server/data/kiroo.db` → `assessment_records` 表），但题目本身只在 JSON 文件中。

---

### 二、计分标准（分层存储）

计分规则分 **三层**，从微观到宏观：

#### 第 1 层：选项级计分（在 JSON 题库文件中）

每个选项携带分值，有三种模式：

| 模式 | 选项字段 | 示例 |
|------|---------|------|
| `additive` | `scores: { "维度key": 分值 }` | `{ "id": "p1-a", "scores": { "openness": 5 } }` |
| `categorical` | `category: "类别key"` | `{ "id": "m1-a", "category": "E" }` |
| `likert` | `score: 1-5` + 题目级 `dimension` | `{ "id": "m1-a", "score": 1 }` + 题目的 `"dimension": "strategic_breakthrough"` |

#### 第 2 层：问卷级计分规则（在 JSON 题库文件的 `scoring_rule` 中）

```json
// additive 型
{ "type": "additive", "dimensions": [{ "key": "openness", "name": "开放性", "min": 2, "max": 10 }] }

// categorical 型
{ "type": "categorical", "categories": [{ "key": "E", "name": "外向" }] }

// likert 型
{ "type": "likert", "dimensions": [{ "key": "strategic_breakthrough", "name": "战略破局力", "itemCount": 5 }] }
```

#### 第 3 层：综合计分服务（跨问卷加权 + 等级判定）

| 文件 | 作用 |
|------|------|
| `src/lib/scoringEngine.ts` | 前端通用计分引擎：处理 additive / categorical / likert 三种类型 |
| `server/services/lzuScoringService.js` | LZU 综合计分：领导风格30% + 人格特质40% + 创造力障碍30%，含原始分→标准分转换、等级阈值 |
| `server/services/midsF2ScoringService.js` | MIDS-F2 计分：S-P-F 矩阵（阈值 3.5）、四类决策路径、预警条件 |

> **要改某个选项的分值** → 改 `src/data/questionnaires/xxx.json` 中对应选项的 `scores`/`score`/`category`
> **要改综合报告的权重/等级** → 改 `server/services/lzuScoringService.js` 或 `midsF2ScoringService.js`

---

### 三、报告生成内容（提示词 + 模板）

报告文字由 AI 根据提示词生成，排版由模板控制。两份报告架构不同：

| 对比维度 | LZU 兰大 | MIDS-F2 |
|---------|---------|---------|
| **提示词位置** | 硬编码在 `lzuReportGenerator.js` 的 `buildAIPrompt()` | 文件 `mids-f2/prompt.md`，运行时加载 |
| **AI 输出格式** | `[SECTION:xxx]` 分隔的纯文本（18 个模块） | 结构化 JSON（含维度解读、职业建议、提升计划） |
| **排版渲染** | 服务端 HTML 模板 `lzuReportTemplate.js` → iframe 嵌入 | 前端 React 组件 `MidsF2ReportPage.tsx` |
| **图表** | SVG 内联在 HTML 中（`lzuChartService.js`） | React 图表组件（雷达图、仪表盘） |
| **Word 导出** | `lzuDocxBuilder.js` 完整支持 | 不支持 |
| **PDF 导出** | `pdfService.js`（Puppeteer） | `pdfService.js`（Puppeteer） |

#### LZU 报告生成链路

```
server/services/lzuReportGenerator.js  ← 主编排器
    ├── buildAIPrompt()        ← 🔑 提示词（18 个 SECTION，硬编码）
    ├── callAIForText()        ← 调 DeepSeek API
    ├── parseAIText()          ← 解析 [SECTION:xxx] 标记
    ├── buildFallbackText()    ← AI 不可用时的降级模板
    └── generateCharts()       ← 调 lzuChartService.js 生成 SVG

server/services/lzuReportTemplate.js   ← 🔑 HTML 排版模板（~450 行）
server/services/lzuChartService.js     ← SVG 图表生成（雷达图/柱状图/仪表盘）
server/services/lzuDocxBuilder.js      ← Word .docx 导出
server/services/pdfService.js          ← PDF 导出
```

#### MIDS-F2 报告生成链路

```
docs/report-system/mids-f2/prompt.md   ← 🔑 提示词模板（文件驱动，改完即生效）

server/services/midsF2ReportService.js ← 主编排器
    ├── loadMidsF2PromptTemplate()  ← 从磁盘读取 prompt.md
    ├── fillMidsF2PromptTemplate()  ← 填充 {{PLACEHOLDER}} 变量
    ├── 调 DeepSeek API             ← deepseek-chat, temp 0.7, 120s 超时
    ├── 解析 JSON 响应              ← 校验 output-schema.json
    └── buildFallbackReport()       ← 硬编码降级模板

src/pages/MidsF2ReportPage.tsx         ← 🔑 前端 React 渲染（7 大区块）
src/components/MidsF2ReportSections.tsx ← 可复用报告区块组件
```

#### 快速修改指南

| 想改什么 | 改哪个文件 |
|----------|-----------|
| LZU 报告文字风格/内容 | `server/services/lzuReportGenerator.js` → `buildAIPrompt()` |
| LZU 报告版面/HTML 样式 | `server/services/lzuReportTemplate.js` |
| LZU 图表样式 | `server/services/lzuChartService.js` |
| LZU Word 导出样式 | `server/services/lzuDocxBuilder.js` |
| LZU PDF 导出样式 | `server/services/pdfService.js` |
| MIDS-F2 报告文字风格/内容 | `docs/report-system/mids-f2/prompt.md` |
| MIDS-F2 报告版面/图表 | `src/pages/MidsF2ReportPage.tsx` |
| MIDS-F2 AI 输出结构 | `docs/report-system/mids-f2/prompt.md` + `mids-f2/output-schema.json` |

---

> 最后更新：2026年6月17日 — 重构目录结构（lzu/ mids-f2/ _template/），新增核心资产速查三表
