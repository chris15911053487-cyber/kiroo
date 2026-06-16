# MIDS-F2 量表开发 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 MIDS-F2 家族二代多维创新力量表集成到"潜能星图"平台，支持独立测评、Likert 计分、S-P-F 矩阵判定，以及 AI 驱动的报告生成与专属可视化。

**Architecture:** 问卷数据用 JSON 存储，前端 scoringEngine 扩展 `likert` 类型计算维度均分，新增 `midsF2Scoring.ts` 处理 S-P-F 矩阵和警示判定。后端 `midsF2ReportService.js` 调用 DeepSeek 生成个性化解读。前端复用 `QuizPage` 答题流程，报告通过 `ReportPage` 的 `reportType` 字段自动路由到 `MidsF2ReportPage`。

**Tech Stack:** React + TypeScript + Tailwind CSS (前端), Express.js + SQLite + DeepSeek API (后端)

---

### Task 1: 问卷 JSON 数据

**Files:**
- Create: `src/data/questionnaires/mids-f2.json`

- [ ] **Step 1: 写入完整问卷 JSON 文件**

```json
{
  "id": "mids-f2",
  "name": "家族二代多维创新力量表",
  "category": "family-business",
  "description": "本量表包含5个一级维度共23个条目，评估家族企业二代的创新力与接班潜力。",
  "enabled": true,
  "createdAt": "2026-06-16T00:00:00Z",
  "questions": [
    {
      "id": "m1",
      "sequence": 1,
      "dimension": "strategic_breakthrough",
      "text": "我能敏锐地发现父辈产业中与新技术结合的空白点（如数字化、AI应用）。",
      "options": [
        {"id": "m1-a", "text": "完全不符合", "score": 1},
        {"id": "m1-b", "text": "不太符合", "score": 2},
        {"id": "m1-c", "text": "不确定", "score": 3},
        {"id": "m1-d", "text": "比较符合", "score": 4},
        {"id": "m1-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m2",
      "sequence": 2,
      "dimension": "strategic_breakthrough",
      "text": "面对行业周期波动，我更倾向于"逆周期布局"而非"收缩过冬"。",
      "options": [
        {"id": "m2-a", "text": "完全不符合", "score": 1},
        {"id": "m2-b", "text": "不太符合", "score": 2},
        {"id": "m2-c", "text": "不确定", "score": 3},
        {"id": "m2-d", "text": "比较符合", "score": 4},
        {"id": "m2-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m3",
      "sequence": 3,
      "dimension": "strategic_breakthrough",
      "text": "我敢于质疑企业现有的商业模式，即使它在过去很成功。",
      "options": [
        {"id": "m3-a", "text": "完全不符合", "score": 1},
        {"id": "m3-b", "text": "不太符合", "score": 2},
        {"id": "m3-c", "text": "不确定", "score": 3},
        {"id": "m3-d", "text": "比较符合", "score": 4},
        {"id": "m3-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m4",
      "sequence": 4,
      "dimension": "strategic_breakthrough",
      "text": "我擅长将抽象的宏观趋势（如双碳、ESG）转化为企业具体的执行动作。",
      "options": [
        {"id": "m4-a", "text": "完全不符合", "score": 1},
        {"id": "m4-b", "text": "不太符合", "score": 2},
        {"id": "m4-c", "text": "不确定", "score": 3},
        {"id": "m4-d", "text": "比较符合", "score": 4},
        {"id": "m4-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m5",
      "sequence": 5,
      "dimension": "strategic_breakthrough",
      "text": "我认为"跨界打劫"（进入新赛道）是比"内部改良"更有效的创新。",
      "options": [
        {"id": "m5-a", "text": "完全不符合", "score": 1},
        {"id": "m5-b", "text": "不太符合", "score": 2},
        {"id": "m5-c", "text": "不确定", "score": 3},
        {"id": "m5-d", "text": "比较符合", "score": 4},
        {"id": "m5-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m6",
      "sequence": 6,
      "dimension": "execution_disruption",
      "text": "我擅长引入数字化工具（如ERP、数据中台）来推翻低效的原有流程。",
      "options": [
        {"id": "m6-a", "text": "完全不符合", "score": 1},
        {"id": "m6-b", "text": "不太符合", "score": 2},
        {"id": "m6-c", "text": "不确定", "score": 3},
        {"id": "m6-d", "text": "比较符合", "score": 4},
        {"id": "m6-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m7",
      "sequence": 7,
      "dimension": "execution_disruption",
      "text": "当直觉与数据冲突时，我会无条件选择相信数据并调整决策。",
      "options": [
        {"id": "m7-a", "text": "完全不符合", "score": 1},
        {"id": "m7-b", "text": "不太符合", "score": 2},
        {"id": "m7-c", "text": "不确定", "score": 3},
        {"id": "m7-d", "text": "比较符合", "score": 4},
        {"id": "m7-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m8",
      "sequence": 8,
      "dimension": "execution_disruption",
      "text": "我经常在团队中带头试用最新的效率工具（如AI、协同软件）。",
      "options": [
        {"id": "m8-a", "text": "完全不符合", "score": 1},
        {"id": "m8-b", "text": "不太符合", "score": 2},
        {"id": "m8-c", "text": "不确定", "score": 3},
        {"id": "m8-d", "text": "比较符合", "score": 4},
        {"id": "m8-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m9",
      "sequence": 9,
      "dimension": "execution_disruption",
      "text": "我习惯将复杂的产品参数或服务流程进行"通俗化/标准化"改造，以扩大市场。",
      "options": [
        {"id": "m9-a", "text": "完全不符合", "score": 1},
        {"id": "m9-b", "text": "不太符合", "score": 2},
        {"id": "m9-c", "text": "不确定", "score": 3},
        {"id": "m9-d", "text": "比较符合", "score": 4},
        {"id": "m9-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m10",
      "sequence": 10,
      "dimension": "execution_disruption",
      "text": "我推崇"小步快跑、快速迭代"的试错机制，而非追求一步到位的完美。",
      "options": [
        {"id": "m10-a", "text": "完全不符合", "score": 1},
        {"id": "m10-b", "text": "不太符合", "score": 2},
        {"id": "m10-c", "text": "不确定", "score": 3},
        {"id": "m10-d", "text": "比较符合", "score": 4},
        {"id": "m10-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m11",
      "sequence": 11,
      "dimension": "resource_integration",
      "text": "我能够将国外的先进理念或技术，因地制宜地嫁接到家族的本土业务中。",
      "options": [
        {"id": "m11-a", "text": "完全不符合", "score": 1},
        {"id": "m11-b", "text": "不太符合", "score": 2},
        {"id": "m11-c", "text": "不确定", "score": 3},
        {"id": "m11-d", "text": "比较符合", "score": 4},
        {"id": "m11-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m12",
      "sequence": 12,
      "dimension": "resource_integration",
      "text": "我善于利用资本手段（如并购、融资）来解决业务发展瓶颈，而非仅靠利润滚动。",
      "options": [
        {"id": "m12-a", "text": "完全不符合", "score": 1},
        {"id": "m12-b", "text": "不太符合", "score": 2},
        {"id": "m12-c", "text": "不确定", "score": 3},
        {"id": "m12-d", "text": "比较符合", "score": 4},
        {"id": "m12-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m13",
      "sequence": 13,
      "dimension": "resource_integration",
      "text": "我倾向于引入外部职业经理人来制衡或激励家族旧部。",
      "options": [
        {"id": "m13-a", "text": "完全不符合", "score": 1},
        {"id": "m13-b", "text": "不太符合", "score": 2},
        {"id": "m13-c", "text": "不确定", "score": 3},
        {"id": "m13-d", "text": "比较符合", "score": 4},
        {"id": "m13-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m14",
      "sequence": 14,
      "dimension": "resource_integration",
      "text": "我擅长挖掘"老臣"们虽未言明但客观存在的痛点，并以此推动改革。",
      "options": [
        {"id": "m14-a", "text": "完全不符合", "score": 1},
        {"id": "m14-b", "text": "不太符合", "score": 2},
        {"id": "m14-c", "text": "不确定", "score": 3},
        {"id": "m14-d", "text": "比较符合", "score": 4},
        {"id": "m14-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m15",
      "sequence": 15,
      "dimension": "adversity_quotient",
      "text": "当我提出的创新方案被父辈否决时，我会寻找迂回方式再次尝试，而非放弃。",
      "options": [
        {"id": "m15-a", "text": "完全不符合", "score": 1},
        {"id": "m15-b", "text": "不太符合", "score": 2},
        {"id": "m15-c", "text": "不确定", "score": 3},
        {"id": "m15-d", "text": "比较符合", "score": 4},
        {"id": "m15-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m16",
      "sequence": 16,
      "dimension": "adversity_quotient",
      "text": "我能接受为了长远的创新，暂时牺牲短期的财务收益。",
      "options": [
        {"id": "m16-a", "text": "完全不符合", "score": 1},
        {"id": "m16-b", "text": "不太符合", "score": 2},
        {"id": "m16-c", "text": "不确定", "score": 3},
        {"id": "m16-d", "text": "比较符合", "score": 4},
        {"id": "m16-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m17",
      "sequence": 17,
      "dimension": "adversity_quotient",
      "text": "在处理"家族亲情"与"企业制度"冲突时，我能做到理性决策。",
      "options": [
        {"id": "m17-a", "text": "完全不符合", "score": 1},
        {"id": "m17-b", "text": "不太符合", "score": 2},
        {"id": "m17-c", "text": "不确定", "score": 3},
        {"id": "m17-d", "text": "比较符合", "score": 4},
        {"id": "m17-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m18",
      "sequence": 18,
      "dimension": "adversity_quotient",
      "text": "面对创业/就业的不确定性带来的孤独感，我依然能保持较高的工作投入度。",
      "options": [
        {"id": "m18-a", "text": "完全不符合", "score": 1},
        {"id": "m18-b", "text": "不太符合", "score": 2},
        {"id": "m18-c", "text": "不确定", "score": 3},
        {"id": "m18-d", "text": "比较符合", "score": 4},
        {"id": "m18-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m19",
      "sequence": 19,
      "dimension": "adversity_quotient",
      "text": "我能放下"二代"身段，从最基层或最苦的岗位开始验证我的想法。",
      "options": [
        {"id": "m19-a", "text": "完全不符合", "score": 1},
        {"id": "m19-b", "text": "不太符合", "score": 2},
        {"id": "m19-c", "text": "不确定", "score": 3},
        {"id": "m19-d", "text": "比较符合", "score": 4},
        {"id": "m19-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m20",
      "sequence": 20,
      "dimension": "ethics_vision",
      "text": "我在设计创新业务时，会优先考虑是否符合社会责任或环保要求。",
      "options": [
        {"id": "m20-a", "text": "完全不符合", "score": 1},
        {"id": "m20-b", "text": "不太符合", "score": 2},
        {"id": "m20-c", "text": "不确定", "score": 3},
        {"id": "m20-d", "text": "比较符合", "score": 4},
        {"id": "m20-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m21",
      "sequence": 21,
      "dimension": "ethics_vision",
      "text": "我关注企业的品牌声誉和价值观输出，胜过短期的价格战胜利。",
      "options": [
        {"id": "m21-a", "text": "完全不符合", "score": 1},
        {"id": "m21-b", "text": "不太符合", "score": 2},
        {"id": "m21-c", "text": "不确定", "score": 3},
        {"id": "m21-d", "text": "比较符合", "score": 4},
        {"id": "m21-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m22",
      "sequence": 22,
      "dimension": "ethics_vision",
      "text": "我愿意分享创新带来的红利，建立合伙人机制而非纯粹的雇佣关系。",
      "options": [
        {"id": "m22-a", "text": "完全不符合", "score": 1},
        {"id": "m22-b", "text": "不太符合", "score": 2},
        {"id": "m22-c", "text": "不确定", "score": 3},
        {"id": "m22-d", "text": "比较符合", "score": 4},
        {"id": "m22-e", "text": "完全符合", "score": 5}
      ]
    },
    {
      "id": "m23",
      "sequence": 23,
      "dimension": "ethics_vision",
      "text": "我认为企业存在的价值是解决社会问题，而不仅是积累财富。",
      "options": [
        {"id": "m23-a", "text": "完全不符合", "score": 1},
        {"id": "m23-b", "text": "不太符合", "score": 2},
        {"id": "m23-c", "text": "不确定", "score": 3},
        {"id": "m23-d", "text": "比较符合", "score": 4},
        {"id": "m23-e", "text": "完全符合", "score": 5}
      ]
    }
  ],
  "scoring_rule": {
    "type": "likert",
    "dimensions": [
      {"key": "strategic_breakthrough", "name": "战略破局力", "itemCount": 5},
      {"key": "execution_disruption", "name": "执行颠覆力", "itemCount": 5},
      {"key": "resource_integration", "name": "资源整合力", "itemCount": 4},
      {"key": "adversity_quotient", "name": "逆商与灰度", "itemCount": 5},
      {"key": "ethics_vision", "name": "伦理与格局", "itemCount": 4}
    ]
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/data/questionnaires/mids-f2.json
git commit -m "feat: 添加 MIDS-F2 问卷 JSON 数据"
```

---

### Task 2: 类型系统更新

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 扩展类型定义**

在 `src/types/index.ts` 中做三处修改：

**修改 1 — `Question` 接口加 `dimension` 字段（第 24-29 行）：**

```typescript
export interface Question {
  id: string
  sequence: number
  text: string
  dimension?: string  // likert 计分类型的维度标识
  options: Option[]
}
```

**修改 2 — `Option` 接口加 `score` 字段（第 17-22 行）：**

```typescript
export interface Option {
  id: string
  text: string
  scores?: Record<string, number>
  category?: string
  score?: number  // likert 计分类型的单一分值 (1-5)
}
```

**修改 3 — `QuestionnaireCategory` 加 `'family-business'`（第 3-15 行）：**

```typescript
export type QuestionnaireCategory =
  | 'personality'
  | 'temperament'
  | 'mbti'
  | 'leadership'
  | 'career'
  | 'big5'
  | '16pf'
  | 'creativity'
  | 'holland'
  | 'lzu-leadership'
  | 'lzu-personality'
  | 'lzu-creativity'
  | 'family-business'
```

**修改 4 — `ScoringRuleType` 加 `'likert'`（第 45 行）：**

```typescript
export type ScoringRuleType = 'additive' | 'categorical' | 'likert'
```

**修改 5 — `DimensionDefinition` 加 `itemCount`（第 31-37 行）：**

```typescript
export interface DimensionDefinition {
  key: string
  name: string
  min?: number
  max?: number
  description?: string
  itemCount?: number  // likert 计分类型的维度条目数
}
```

**修改 6 — `QUESTIONNAIRE_PRIORITY` 数组末尾追加 `mids-f2` 条目（第 82-90 行的数组内）：**

```typescript
export const QUESTIONNAIRE_PRIORITY: Array<{
  id: string
  name: string
  questions: number
  estimatedMinutes: number
}> = [
  // ... 已有条目保持不变 ...
  { id: 'mids-f2',    name: '家族二代多维创新力量表', questions: 23,  estimatedMinutes: 4  },
]
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: 类型系统添加 family-business 分类和 likert 计分类型"
```

---

### Task 3: 问卷校验器更新

**Files:**
- Modify: `src/lib/questionnaireValidator.ts`

- [ ] **Step 1: 添加新分类和计分类型到校验白名单**

修改 `VALID_CATEGORIES` 数组（第 3-16 行），在末尾追加：

```typescript
const VALID_CATEGORIES: QuestionnaireCategory[] = [
  'personality',
  'temperament',
  'mbti',
  'leadership',
  'career',
  'big5',
  '16pf',
  'creativity',
  'holland',
  'lzu-leadership',
  'lzu-personality',
  'lzu-creativity',
  'family-business',
]
```

修改 `VALID_SCORING_RULE_TYPES` 数组（第 18 行）：

```typescript
const VALID_SCORING_RULE_TYPES: ScoringRuleType[] = ['additive', 'categorical', 'likert']
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/questionnaireValidator.ts
git commit -m "feat: 校验器支持 family-business 分类和 likert 计分"
```

---

### Task 4: 计分引擎 — likert 类型支持

**Files:**
- Modify: `src/lib/scoringEngine.ts`

- [ ] **Step 1: 在 compute() 函数中添加 likert 分支**

在 `src/lib/scoringEngine.ts` 的 `compute` 函数中，在 `categorical` 分支（Step 3）之后，`return` 语句之前，插入 likert 处理逻辑。

找到 `// Step 3: Categorical scoring` 之后的 `const frequencies` ... 到最终 `return` 代码块，在其后添加：

```typescript
  // Step 4: Likert scoring — 每个条目独立 Likert 1-5 分，按维度计算均分
  if (questionnaire.scoring_rule.type === 'likert') {
    const dimensionScores: Record<string, number> = {}
    const dimensionCounts: Record<string, number> = {}

    // 初始化所有维度
    for (const dim of questionnaire.scoring_rule.dimensions ?? []) {
      dimensionScores[dim.key] = 0
      dimensionCounts[dim.key] = 0
    }

    // 累加每个问题的选中选项分值
    for (const q of questionnaire.questions) {
      const selectedOption = q.options.find(o => o.id === answers[q.id])
      const dim = (q as any).dimension as string | undefined
      if (selectedOption?.score !== undefined && dim && dimensionScores[dim] !== undefined) {
        dimensionScores[dim] += selectedOption.score
        dimensionCounts[dim] += 1
      }
    }

    // 计算均分
    for (const key of Object.keys(dimensionScores)) {
      if (dimensionCounts[key] > 0) {
        dimensionScores[key] = Math.round((dimensionScores[key] / dimensionCounts[key]) * 100) / 100
      }
    }

    return {
      questionnaireId: questionnaire.id,
      type: 'likert' as any,
      dimensionScores,
      answeredAt: new Date().toISOString(),
    }
  }
```

注意：这段代码必须放在 `categorical` 分支的 `return` 语句之后、`compute` 函数结尾 `}` 之前，使得三个 `if` 分支（additive / categorical / likert）互斥且完整。

- [ ] **Step 2: 提交**

```bash
git add src/lib/scoringEngine.ts
git commit -m "feat: 计分引擎添加 likert 类型支持"
```

---

### Task 5: MIDS-F2 计分模块

**Files:**
- Create: `src/lib/midsF2Scoring.ts`
- Create: `src/lib/__tests__/midsF2Scoring.test.ts`

- [ ] **Step 1: 创建 MIDS-F2 计分模块**

写入 `src/lib/midsF2Scoring.ts`：

```typescript
// ==================== MIDS-F2 计分服务 ====================

/** MIDS-F2 五维度 key 常量 */
export const MIDS_DIMENSION_KEYS = [
  'strategic_breakthrough',
  'execution_disruption',
  'resource_integration',
  'adversity_quotient',
  'ethics_vision',
] as const

export const MIDS_DIMENSION_NAMES: Record<string, string> = {
  strategic_breakthrough: '战略破局力',
  execution_disruption: '执行颠覆力',
  resource_integration: '资源整合力',
  adversity_quotient: '逆商与灰度',
  ethics_vision: '伦理与格局',
}

export type DecisionPath =
  | 'leading_succession'
  | 'independent_startup'
  | 'functional_employment'
  | 'further_study'

export const DECISION_PATH_LABELS: Record<DecisionPath, { emoji: string; label: string; logic: string }> = {
  leading_succession: {
    emoji: '🏆',
    label: '领军接班',
    logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。',
  },
  independent_startup: {
    emoji: '🚀',
    label: '独立创业',
    logic: '理念超前但受限于家族产业属性（如传统制造业）难以施展，或家族内耗严重，适合脱离体系外部创业。',
  },
  functional_employment: {
    emoji: '💼',
    label: '职能就业',
    logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等技术或管理岗位。',
  },
  further_study: {
    emoji: '📚',
    label: '深造蓄力',
    logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验，再图回归或创业。',
  },
}

export interface MidsF2Result {
  dimensionAverages: Record<string, number>
  totalScore: number
  sScore: number
  pScore: number
  fScore: number
  decisionPath: DecisionPath
  decisionLabel: string
  decisionEmoji: string
  decisionLogic: string
  warnings: string[]
}

/**
 * 根据维度均分计算 MIDS-F2 综合结果
 *
 * @param dimensionScores — 各维度的均分 (1-5 范围)，由 scoringEngine compute 返回
 */
export function computeMidsF2(dimensionScores: Record<string, number>): MidsF2Result {
  const D1 = dimensionScores['strategic_breakthrough'] ?? 0
  const D2 = dimensionScores['execution_disruption'] ?? 0
  const D3 = dimensionScores['resource_integration'] ?? 0
  const D4 = dimensionScores['adversity_quotient'] ?? 0
  const D5 = dimensionScores['ethics_vision'] ?? 0

  // 综合总分 (20-100)
  const totalScore = Math.round((D1 + D2 + D3 + D4 + D5) * 4 * 10) / 10

  // S-P-F 三维模型
  const THRESHOLD = 3.5
  const sScore = D1
  const pScore = D2
  const fScore = Math.round(((D3 + D4 + D5) / 3) * 100) / 100

  const sHigh = sScore >= THRESHOLD
  const pHigh = pScore >= THRESHOLD
  const fHigh = fScore >= THRESHOLD

  // 决策矩阵
  let decisionPath: DecisionPath
  if (sHigh && pHigh && fHigh) {
    decisionPath = 'leading_succession'
  } else if (sHigh && !pHigh && !fHigh) {
    decisionPath = 'independent_startup'
  } else if (!sHigh && pHigh && fHigh) {
    decisionPath = 'functional_employment'
  } else {
    // 包括: sHigh + pLow + fLow, 以及其他未覆盖的组合
    decisionPath = 'further_study'
  }

  const decisionMeta = DECISION_PATH_LABELS[decisionPath]

  // 特别警示
  const warnings: string[] = []
  if (D4 < 2.5) {
    warnings.push(
      '逆商维度得分低于2.5：心理韧性不足，难以应对传承过程中的复杂人际关系和改革阵痛，建议暂缓独立决策，先通过实践磨练心力。'
    )
  }
  if (D5 < 3) {
    warnings.push(
      '伦理与格局维度得分低于3：若缺乏责任感和伦理约束，创新力越强，对企业的"破坏力"（如盲目多元化、合规风险）可能越大，建议暂缓赋予重权。'
    )
  }

  return {
    dimensionAverages: {
      strategic_breakthrough: D1,
      execution_disruption: D2,
      resource_integration: D3,
      adversity_quotient: D4,
      ethics_vision: D5,
    },
    totalScore,
    sScore,
    pScore,
    fScore,
    decisionPath,
    decisionLabel: decisionMeta.label,
    decisionEmoji: decisionMeta.emoji,
    decisionLogic: decisionMeta.logic,
    warnings,
  }
}
```

- [ ] **Step 2: 创建测试文件**

写入 `src/lib/__tests__/midsF2Scoring.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { computeMidsF2 } from '../midsF2Scoring'

describe('computeMidsF2', () => {
  it('calculates total score correctly (all max → 100)', () => {
    const scores = {
      strategic_breakthrough: 5,
      execution_disruption: 5,
      resource_integration: 5,
      adversity_quotient: 5,
      ethics_vision: 5,
    }
    const result = computeMidsF2(scores)
    expect(result.totalScore).toBe(100)
    expect(result.sScore).toBe(5)
    expect(result.pScore).toBe(5)
    expect(result.fScore).toBe(5)
    expect(result.decisionPath).toBe('leading_succession')
    expect(result.warnings).toHaveLength(0)
  })

  it('calculates total score correctly (all min → 20)', () => {
    const scores = {
      strategic_breakthrough: 1,
      execution_disruption: 1,
      resource_integration: 1,
      adversity_quotient: 1,
      ethics_vision: 1,
    }
    const result = computeMidsF2(scores)
    expect(result.totalScore).toBe(20)
    expect(result.decisionPath).toBe('further_study')
  })

  it('classifies as independent_startup when S high, P low, F low', () => {
    const scores = {
      strategic_breakthrough: 4.5,
      execution_disruption: 2.0,
      resource_integration: 2.0,
      adversity_quotient: 3.0,
      ethics_vision: 2.5,
    }
    const result = computeMidsF2(scores)
    expect(result.decisionPath).toBe('independent_startup')
  })

  it('classifies as functional_employment when S low, P high, F high', () => {
    const scores = {
      strategic_breakthrough: 2.0,
      execution_disruption: 4.5,
      resource_integration: 4.0,
      adversity_quotient: 4.0,
      ethics_vision: 4.0,
    }
    const result = computeMidsF2(scores)
    expect(result.decisionPath).toBe('functional_employment')
  })

  it('triggers warning when D4 < 2.5', () => {
    const scores = {
      strategic_breakthrough: 3.0,
      execution_disruption: 3.0,
      resource_integration: 3.0,
      adversity_quotient: 2.0,
      ethics_vision: 3.0,
    }
    const result = computeMidsF2(scores)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('2.5')
  })

  it('triggers warning when D5 < 3', () => {
    const scores = {
      strategic_breakthrough: 3.0,
      execution_disruption: 3.0,
      resource_integration: 3.0,
      adversity_quotient: 3.0,
      ethics_vision: 2.5,
    }
    const result = computeMidsF2(scores)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('伦理')
  })

  it('handles missing dimensions gracefully', () => {
    const result = computeMidsF2({ strategic_breakthrough: 3, execution_disruption: 3 })
    expect(result.totalScore).toBe(24)  // (3+3+0+0+0)*4
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/lib/__tests__/midsF2Scoring.test.ts
```

预期：6 个测试全部通过。

- [ ] **Step 4: 提交**

```bash
git add src/lib/midsF2Scoring.ts src/lib/__tests__/midsF2Scoring.test.ts
git commit -m "feat: 添加 MIDS-F2 计分模块（S-P-F 矩阵 + 警示判定）"
```

---

### Task 6: MIDS-F2 专属报告页面

**Files:**
- Create: `src/pages/MidsF2ReportPage.tsx`

- [ ] **Step 1: 创建报告页面组件**

写入 `src/pages/MidsF2ReportPage.tsx`：

```typescript
import { Link } from 'react-router-dom'
import { GaugeChart, RadarChart, BarChart } from '../components/charts'
import {
  computeMidsF2,
  MIDS_DIMENSION_KEYS,
  MIDS_DIMENSION_NAMES,
  type MidsF2Result,
  type DecisionPath,
} from '../lib/midsF2Scoring'

// ==================== 报告数据结构 ====================

interface MidsF2AIInsight {
  dimensionKey: string
  interpretation: string
  suggestion: string
}

interface MidsF2AIReport {
  comprehensiveScore: number
  coreEvaluation: string
  dimensionInsights: MidsF2AIInsight[]
  careerSuggestions?: { direction: string; reason: string }[]
  improvementPlan?: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
  summary: string
  userName?: string
  reportDate?: string
  reportId?: string
}

// ==================== 截面组件 ====================

function ScoreSection({ score, result }: { score: number; result: MidsF2Result }) {
  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] via-[#1A2D4A] to-[#1E3A5F] rounded-2xl p-8 text-white text-center mb-6 shadow-[0_8px_30px_rgba(30,58,95,0.3)]">
      <p className="text-sm text-white/60 mb-1">家族二代多维创新力量表（MIDS-F2）</p>
      <GaugeChart value={score} min={20} max={100} size={180} />
      <p className="text-xs text-white/40 mt-2">综合得分 · 满分100分</p>
      <div className="inline-block mt-3 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold shadow-lg">
        {result.decisionEmoji} {result.decisionLabel}
      </div>
    </div>
  )
}

function RadarSection({ result }: { result: MidsF2Result }) {
  const radarData = MIDS_DIMENSION_KEYS.map(key => ({
    label: MIDS_DIMENSION_NAMES[key],
    value: result.dimensionAverages[key] ?? 0,
    maxValue: 5,
  }))

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
        五维雷达图
      </h2>
      <div className="flex justify-center mb-4">
        <RadarChart data={radarData} size={280} color="#6366F1" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {MIDS_DIMENSION_KEYS.map(key => (
          <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">{MIDS_DIMENSION_NAMES[key]}</p>
            <p className="font-bold text-indigo-600">{result.dimensionAverages[key]?.toFixed(1) ?? '-'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionMatrixSection({ result }: { result: MidsF2Result }) {
  const cards: { label: string; key: string; score: number; threshold: number; isHigh: boolean }[] = [
    { label: 'S 战略破局力', key: 'S', score: result.sScore, threshold: 3.5, isHigh: result.sScore >= 3.5 },
    { label: 'P 执行颠覆力', key: 'P', score: result.pScore, threshold: 3.5, isHigh: result.pScore >= 3.5 },
    { label: 'F 资源匹配度', key: 'F', score: result.fScore, threshold: 3.5, isHigh: result.fScore >= 3.5 },
  ]

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-amber-500" />
        S-P-F 三维决策矩阵
      </h2>

      {/* 三卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(c => (
          <div
            key={c.key}
            className={`rounded-xl p-4 text-center border-2 transition-all ${
              c.isHigh
                ? 'bg-green-50 border-green-300'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.isHigh ? 'text-green-600' : 'text-orange-500'}`}>
              {c.score.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-400">阈值 {c.threshold}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                c.isHigh ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
              }`}
            >
              {c.isHigh ? '✓ 高' : '— 中/低'}
            </span>
          </div>
        ))}
      </div>

      {/* 推荐路径 */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100">
        <p className="text-3xl mb-2">{result.decisionEmoji}</p>
        <p className="text-lg font-bold text-indigo-700 mb-1">推荐路径：{result.decisionLabel}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{result.decisionLogic}</p>
      </div>
    </div>
  )
}

function WarningsSection({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-red-500" />
        ⚠️ 特别警示
      </h2>
      <ul className="space-y-2">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-red-700 leading-relaxed">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DimensionInsightsSection({ insights, dimensionAverages }: {
  insights: MidsF2AIInsight[]
  dimensionAverages: Record<string, number>
}) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500" />
        维度深度解读
      </h2>
      <div className="space-y-4">
        {insights.map(insight => (
          <div key={insight.dimensionKey} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#1a1a2e]">
                {MIDS_DIMENSION_NAMES[insight.dimensionKey] || insight.dimensionKey}
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {dimensionAverages[insight.dimensionKey]?.toFixed(1) ?? '-'} / 5
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{insight.interpretation}</p>
            <p className="text-xs text-indigo-600 flex items-start gap-1">
              <span>💡</span>
              <span>{insight.suggestion}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImprovementPlanSection({ plan }: {
  plan: { shortTerm: string[]; midTerm: string[]; longTerm: string[] }
}) {
  if (!plan) return null

  const sections = [
    { title: '近期行动（0-6个月）', items: plan.shortTerm, color: 'border-l-green-500 bg-green-50/50' },
    { title: '中期规划（6个月-2年）', items: plan.midTerm, color: 'border-l-blue-500 bg-blue-50/50' },
    { title: '长期发展（2-5年）', items: plan.longTerm, color: 'border-l-purple-500 bg-purple-50/50' },
  ].filter(s => s.items && s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
        发展建议
      </h2>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className={`border-l-4 rounded-r-xl p-4 ${s.color}`}>
            <h3 className="font-bold text-sm text-[#1a1a2e] mb-2">{s.title}</h3>
            <ul className="space-y-1">
              {s.items.map((item: string, j: number) => (
                <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummarySection({ summary }: { summary: string }) {
  if (!summary) return null

  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] rounded-2xl p-6 text-white mb-6 shadow-[0_4px_20px_rgba(30,58,95,0.25)]">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-[#F4C550]" />
        总结与展望
      </h2>
      <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
    </div>
  )
}

// ==================== 主组件 ====================

export interface MidsF2ReportPageProps {
  scoreResult: Record<string, number>  // 维度均分 (additive 计分结果)
  aiReport?: MidsF2AIReport | null
  reportId?: number
}

export default function MidsF2ReportPage({ scoreResult, aiReport, reportId }: MidsF2ReportPageProps) {
  const result = computeMidsF2(scoreResult)

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-3xl mx-auto">
          <Link to="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-sm font-bold text-[#1a1a2e]">MIDS-F2 创新力报告</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {/* 报告封面 */}
        {aiReport && (
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400">{aiReport.reportId}</p>
            <p className="text-lg font-bold text-[#1a1a2e]">{aiReport.userName || '测评用户'}</p>
            <p className="text-xs text-gray-400">{aiReport.reportDate || ''}</p>
          </div>
        )}

        {/* 综合得分 */}
        <ScoreSection score={result.totalScore} result={result} />

        {/* 五维雷达图 */}
        <RadarSection result={result} />

        {/* S-P-F 决策矩阵 */}
        <DecisionMatrixSection result={result} />

        {/* 特别警示 */}
        <WarningsSection warnings={result.warnings} />

        {/* AI 维度解读 */}
        {aiReport?.dimensionInsights && (
          <DimensionInsightsSection
            insights={aiReport.dimensionInsights}
            dimensionAverages={result.dimensionAverages}
          />
        )}

        {/* 发展建议 */}
        {aiReport?.improvementPlan && (
          <ImprovementPlanSection plan={aiReport.improvementPlan} />
        )}

        {/* 总结 */}
        <SummarySection summary={aiReport?.summary || ''} />

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {reportId && (
            <button
              onClick={() => {
                const token = localStorage.getItem('token')
                fetch(`/api/reports/${reportId}/pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.blob()).then(blob => {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `MIDS-F2创新力报告_${reportId}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                }).catch(() => alert('下载失败'))
              }}
              className="px-6 py-3 rounded-xl bg-white border border-black/[0.04] text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 transition-all text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              📥 下载报告
            </button>
          )}
          <Link
            to="/history"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all text-center"
          >
            我的报告列表
          </Link>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/MidsF2ReportPage.tsx
git commit -m "feat: 添加 MIDS-F2 专属报告页面组件"
```

---

### Task 7: ReportPage 集成 — 报告类型路由

**Files:**
- Modify: `src/pages/ReportPage.tsx`

- [ ] **Step 1: 在 ReportPage 中添加 MIDS-F2 检测和渲染**

在 `src/pages/ReportPage.tsx` 顶部 import 区添加：

```typescript
import MidsF2ReportPage from './MidsF2ReportPage'
```

在 `parseReportData` 函数之后，添加一个辅助函数检测是否为 MIDS-F2 报告（放在 `// ==================== Main Component ====================` 之前）：

```typescript
function isMidsF2Report(data: any): boolean {
  return data?.reportType === 'mids-f2' || data?.midsF2Result !== undefined
}
```

在 ReportPage 主组件中，`reportData` 成功解析后的渲染逻辑里，在所有现有条件分支之前插入 MIDS-F2 检测。找到以下代码：

```typescript
  // 检测是否为兰大格式报告
  const lzuData = reportData && isLZUReport(reportData) ? reportData : null
```

在这行之前插入：

```typescript
  // 检测是否为 MIDS-F2 格式报告
  if (reportData && isMidsF2Report(reportData)) {
    const midsData = reportData as any
    const dimensionScores = midsData.scoreSummary?.['mids-f2']?.dimensionScores
      || midsData.midsF2Scores
      || {}

    return (
      <MidsF2ReportPage
        scoreResult={dimensionScores}
        aiReport={midsData}
        reportId={report?.id}
      />
    )
  }
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/ReportPage.tsx
git commit -m "feat: ReportPage 集成 MIDS-F2 报告类型路由"
```

---

### Task 8: 后端 — MIDS-F2 AI 报告生成服务

**Files:**
- Create: `server/services/midsF2ReportService.js`

- [ ] **Step 1: 创建 AI 报告生成服务**

写入 `server/services/midsF2ReportService.js`：

```javascript
/**
 * MIDS-F2 AI 报告生成服务
 * 调用 DeepSeek 生成维度解读和发展建议
 */

const MIDS_DIMENSION_NAMES = {
  strategic_breakthrough: '战略破局力',
  execution_disruption: '执行颠覆力',
  resource_integration: '资源整合力',
  adversity_quotient: '逆商与灰度',
  ethics_vision: '伦理与格局',
};

const DECISION_PATH_INFO = {
  leading_succession: { emoji: '🏆', label: '领军接班', logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。' },
  independent_startup: { emoji: '🚀', label: '独立创业', logic: '理念超前但受限于家族产业属性难以施展，或家族内耗严重，适合脱离体系外部创业。' },
  functional_employment: { emoji: '💼', label: '职能就业', logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等岗位。' },
  further_study: { emoji: '📚', label: '深造蓄力', logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验。' },
};

/**
 * 构建 MIDS-F2 报告的 AI Prompt
 */
function buildMidsF2Prompt(dimensionScores, midsF2Result, userName) {
  const lines = [];

  lines.push('你是一位资深家族企业传承与人才测评专家。请根据以下 MIDS-F2（家族二代多维创新力量表）测评数据，生成一份专业、个性化的测评解读报告。');
  lines.push('');
  lines.push('## 输出要求');
  lines.push('你必须输出一个合法的JSON对象，不要包含任何Markdown标记（如```json或```），只输出纯JSON。');
  lines.push('');
  lines.push('## JSON结构定义');
  lines.push('{');
  lines.push('  "comprehensiveScore": 75.5,');
  lines.push('  "coreEvaluation": "核心评价，一段话150-200字，正面积极，概述测评对象的创新力画像",');
  lines.push('  "dimensionInsights": [');
  lines.push('    {');
  lines.push('      "dimensionKey": "strategic_breakthrough",');
  lines.push('      "interpretation": "维度解读文字（80-120字），结合得分给出具体分析",');
  lines.push('      "suggestion": "该维度的具体提升建议（20-40字），以✔开头"');
  lines.push('    }');
  lines.push('  ],  // 5个维度各一条');
  lines.push('  "careerSuggestions": [');
  lines.push('    { "direction": "职业方向名称", "reason": "基于数据的推荐理由" }');
  lines.push('  ],  // 2-3个发展方向');
  lines.push('  "improvementPlan": {');
  lines.push('    "shortTerm": ["0-6个月：具体行动1", "0-6个月：具体行动2"],');
  lines.push('    "midTerm": ["6个月-2年：具体行动1"],');
  lines.push('    "longTerm": ["2-5年：具体行动1"]');
  lines.push('  },');
  lines.push('  "summary": "整体总结与寄语，一段话正面激励（100-150字）"');
  lines.push('}');
  lines.push('');
  lines.push('## 报告风格约束');
  lines.push('1. 语言中性偏正面，绝对不可使用否定性、贬义性词汇');
  lines.push('2. 用"发展空间"、"提升方向"代替"缺点"、"劣势"');
  lines.push('3. 聚焦优势发现，先讲核心优势，再讲发展潜力');
  lines.push('4. 所有描述必须有数据支撑，不可凭空编造');
  lines.push('5. 每个维度的 interpretation 必须引用具体得分并给出分析');
  lines.push('6. 结合家族企业传承的实际场景给出建议');
  lines.push('');
  lines.push('## 测评数据');
  lines.push('');
  lines.push(`测评对象：${userName || '测评用户'}`);
  lines.push(`综合总分：${midsF2Result.totalScore}/100`);
  lines.push(`决策路径：${DECISION_PATH_INFO[midsF2Result.decisionPath]?.label || '进一步评估'}`);
  lines.push('');
  lines.push('### 各维度均分（满分5分）：');
  for (const [key, value] of Object.entries(dimensionScores)) {
    const name = MIDS_DIMENSION_NAMES[key] || key;
    lines.push(`  ${name}：${Number(value).toFixed(1)} / 5`);
  }
  lines.push('');
  lines.push('### S-P-F 矩阵：');
  lines.push(`  S（战略破局力）= ${midsF2Result.sScore.toFixed(1)} ${midsF2Result.sScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  P（执行颠覆力）= ${midsF2Result.pScore.toFixed(1)} ${midsF2Result.pScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  F（资源匹配度）= ${midsF2Result.fScore.toFixed(1)} ${midsF2Result.fScore >= 3.5 ? '→ 高' : '→ 中/低'}`);
  lines.push(`  推荐路径：${DECISION_PATH_INFO[midsF2Result.decisionPath]?.label || '进一步评估'}`);
  lines.push('');
  if (midsF2Result.warnings.length > 0) {
    lines.push('### ⚠️ 特别警示：');
    midsF2Result.warnings.forEach(w => lines.push(`  ${w}`));
    lines.push('');
  }
  lines.push('请现在输出JSON，不要加任何前缀或后缀。');

  return lines.join('\n');
}

/**
 * 构建降级占位文字（AI不可用时使用）
 */
function buildFallbackReport(dimensionScores, midsF2Result, userName) {
  const name = userName || '测评用户';
  const dims = ['strategic_breakthrough', 'execution_disruption', 'resource_integration', 'adversity_quotient', 'ethics_vision'];

  const dimensionInsights = dims.map(key => {
    const score = Number(dimensionScores[key] || 0).toFixed(1);
    const name = MIDS_DIMENSION_NAMES[key];
    const level = score >= 4 ? '表现出色' : score >= 3 ? '处于中等偏上水平' : '有较大发展空间';
    return {
      dimensionKey: key,
      interpretation: `${name}维度得分为${score}/5，${level}。该维度反映了测评对象在${name}方面的现有水平和发展潜力。`,
      suggestion: `建议结合360度反馈进一步验证该维度表现。`,
    };
  });

  const dec = DECISION_PATH_INFO[midsF2Result.decisionPath] || DECISION_PATH_INFO.further_study;

  return {
    comprehensiveScore: midsF2Result.totalScore,
    coreEvaluation: `${name}在MIDS-F2量表测评中综合得分${midsF2Result.totalScore}分，推荐路径为"${dec.label}"。S-P-F三维分析显示其在家族企业传承中有明确的发展定位。`,
    dimensionInsights,
    improvementPlan: {
      shortTerm: ['深入了解家族企业各业务板块', '参与行业交流拓展视野'],
      midTerm: ['系统学习企业管理知识', '积累跨部门协作经验'],
      longTerm: ['明确个人发展路径并持续深耕'],
    },
    summary: `${name}的MIDS-F2测评展现了其在家族企业创新与传承中的独特潜力。建议持续关注各维度的均衡发展，在实践中不断验证和调整发展方向。`,
    userName: name,
    reportDate: new Date().toISOString().split('T')[0],
    reportId: `MIDS-${Date.now().toString(36).toUpperCase()}`,
  };
}

/**
 * 调用 DeepSeek API 生成 AI 解读
 */
async function callAI(dimensionScores, midsF2Result, userName) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 30) {
    console.warn('[MIDS-F2] DEEPSEEK_API_KEY not configured, using fallback');
    return null;
  }

  const prompt = buildMidsF2Prompt(dimensionScores, midsF2Result, userName);

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
        temperature: 0.7,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[MIDS-F2] DeepSeek API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content || content.length < 50) {
      console.error('[MIDS-F2] Empty or too short AI response');
      return null;
    }

    return content;
  } catch (err) {
    console.error('[MIDS-F2] AI call error:', err.message);
    return null;
  }
}

/**
 * 解析 AI 返回的 JSON 或降级
 */
function parseAIResponse(raw, dimensionScores, midsF2Result, userName) {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // 验证必要字段
      if (parsed.coreEvaluation && Array.isArray(parsed.dimensionInsights)) {
        return parsed;
      }
    } catch {
      console.warn('[MIDS-F2] Failed to parse AI JSON, using fallback');
    }
  }
  return buildFallbackReport(dimensionScores, midsF2Result, userName);
}

/**
 * 主入口：生成 MIDS-F2 报告
 */
async function generateMidsF2Report({ dimensionScores, midsF2Result, userName }) {
  const aiRaw = await callAI(dimensionScores, midsF2Result, userName);
  const report = parseAIResponse(aiRaw, dimensionScores, midsF2Result, userName);

  return {
    ...report,
    reportType: 'mids-f2',
    midsF2Result,
    midsF2Scores: dimensionScores,
  };
}

module.exports = { generateMidsF2Report };
```

- [ ] **Step 2: 提交**

```bash
git add server/services/midsF2ReportService.js
git commit -m "feat: 添加 MIDS-F2 AI 报告生成服务"
```

---

### Task 9: 后端 — 报告路由集成

**Files:**
- Modify: `server/routes/report.js`

- [ ] **Step 1: 在 report.js 路由中处理 MIDS-F2 报告生成**

在 `server/routes/report.js` 中，找到所有路由定义（`router.get('/'...)`, `router.get('/:id'...)`, `router.get('/:id/pdf'...)`），在这些之后、`module.exports` 之前添加：

```javascript
// POST /api/reports/mids-f2/generate — 生成 MIDS-F2 独立报告
router.post('/mids-f2/generate', authMiddleware, async (req, res) => {
  try {
    const { dimensionScores, userName } = req.body;

    if (!dimensionScores || typeof dimensionScores !== 'object') {
      return res.status(400).json({ error: '缺少 dimensionScores 参数' });
    }

    // 计算 MIDS-F2 结果（前端已算好，这里复用或后端重算）
    const { computeMidsF2 } = require('../services/midsF2ScoringService');
    const midsF2Result = computeMidsF2(dimensionScores);

    const { generateMidsF2Report } = require('../services/midsF2ReportService');
    const reportData = await generateMidsF2Report({
      dimensionScores,
      midsF2Result,
      userName: userName || '测评用户',
    });

    // 保存到 comprehensive_reports 表
    const pool = getPool();
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
```

同时创建后端 MIDS-F2 计分服务（与前端逻辑一致），避免跨语言重复：

写入 `server/services/midsF2ScoringService.js`：

```javascript
/**
 * MIDS-F2 计分服务（后端版本，与前端逻辑一致）
 */

const THRESHOLD = 3.5;

const DECISION_PATH_INFO = {
  leading_succession: { emoji: '🏆', label: '领军接班', logic: '具备改造传统产业的能力与魄力，适合作为改革派接手企业，进行数字化转型或赛道拓展。' },
  independent_startup: { emoji: '🚀', label: '独立创业', logic: '理念超前但受限于家族产业属性难以施展，或家族内耗严重，适合脱离体系外部创业。' },
  functional_employment: { emoji: '💼', label: '职能就业', logic: '执行力强但缺乏战略视野，不适合担任一把手。适合在成熟企业或家族企业中担任CTO、COO等岗位。' },
  further_study: { emoji: '📚', label: '深造蓄力', logic: '典型的"眼高手低"或资源不匹配阶段。建议先进入风投、咨询或头部大厂积累资源与实战经验。' },
};

function computeMidsF2(dimensionScores) {
  const D1 = dimensionScores['strategic_breakthrough'] || 0;
  const D2 = dimensionScores['execution_disruption'] || 0;
  const D3 = dimensionScores['resource_integration'] || 0;
  const D4 = dimensionScores['adversity_quotient'] || 0;
  const D5 = dimensionScores['ethics_vision'] || 0;

  const totalScore = Math.round((D1 + D2 + D3 + D4 + D5) * 4 * 10) / 10;
  const sScore = D1;
  const pScore = D2;
  const fScore = Math.round(((D3 + D4 + D5) / 3) * 100) / 100;

  const sHigh = sScore >= THRESHOLD;
  const pHigh = pScore >= THRESHOLD;
  const fHigh = fScore >= THRESHOLD;

  let decisionPath;
  if (sHigh && pHigh && fHigh) {
    decisionPath = 'leading_succession';
  } else if (sHigh && !pHigh && !fHigh) {
    decisionPath = 'independent_startup';
  } else if (!sHigh && pHigh && fHigh) {
    decisionPath = 'functional_employment';
  } else {
    decisionPath = 'further_study';
  }

  const warnings = [];
  if (D4 < 2.5) {
    warnings.push('逆商维度得分低于2.5：心理韧性不足，建议暂缓独立决策。');
  }
  if (D5 < 3) {
    warnings.push('伦理与格局维度得分低于3：缺乏责任感/伦理约束，建议暂缓赋予重权。');
  }

  const dec = DECISION_PATH_INFO[decisionPath];

  return {
    dimensionAverages: {
      strategic_breakthrough: D1,
      execution_disruption: D2,
      resource_integration: D3,
      adversity_quotient: D4,
      ethics_vision: D5,
    },
    totalScore,
    sScore,
    pScore,
    fScore,
    decisionPath,
    decisionLabel: dec.label,
    decisionEmoji: dec.emoji,
    decisionLogic: dec.logic,
    warnings,
  };
}

module.exports = { computeMidsF2 };
```

- [ ] **Step 2: 提交**

```bash
git add server/routes/report.js server/services/midsF2ScoringService.js
git commit -m "feat: 后端集成 MIDS-F2 报告生成路由和计分服务"
```

---

### Task 10: 全面测试验证

**Files:**
- No file changes — verification only

- [ ] **Step 1: 运行所有现有测试，确保无回归**

```bash
npx vitest run
```

预期：所有已有测试通过，新增的 midsF2Scoring 测试也通过。

- [ ] **Step 2: 启动开发服务器，验证问卷加载**

```bash
npm run dev
```

打开浏览器 → 控制台检查无 `[QuestionnaireValidator]` 警告。确认 `mids-f2` 问卷出现在选择页面。

- [ ] **Step 3: 完成一次完整答题流程**

选择 `mids-f2` → 答完全部 23 题 → 提交 → 观察报告页面渲染。

- [ ] **Step 4: 验证核心指标**

确认报告页面正确显示：
- GaugeChart 仪表在 20-100 范围内
- 雷达图显示 5 个维度
- S-P-F 三列卡片显示高/低判定
- 决策路径卡片正确展示
- 如有 D4 < 2.5 或 D5 < 3，警告区域出现
- AI 解读或降级文字正常显示

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "feat: MIDS-F2 量表集成完成 — 问卷、计分、报告页面、AI服务
Co-Authored-By: Claude <noreply@anthropic.com>"
```
