# MIDS-F2 家族二代多维创新力量表 — 设计文档

> 日期: 2026-06-16 | 状态: 已批准

## 1. 概述

将 MIDS-F2 (Multidimensional Innovation Drive Scale - Family 2nd Generation) 量表集成到"潜能星图"测评平台，作为独立测评问卷使用。

### 量表信息

- **名称**: 家族二代多维创新力量表 (MIDS-F2)
- **条目数**: 23 题（实际 23 条，文档声称 28 条）
- **维度**: 5 个一级维度
- **计分方式**: Likert 5 点 (1=完全不符合 ~ 5=完全符合)
- **分类**: `family-business`（新增分类）

## 2. 五个维度

| 维度 Key | 名称 | 条目 | 核心考察 |
|---|---|---|---|
| `strategic_breakthrough` | 战略破局力 | Q1-Q5 (5项) | "二次创业"思维 vs "单纯守成" |
| `execution_disruption` | 执行颠覆力 | Q6-Q10 (5项) | 工程师/数据思维，摆脱经验主义 |
| `resource_integration` | 资源整合力 | Q11-Q14 (4项) | 新资源改造旧产业 |
| `adversity_quotient` | 逆商与灰度 | Q15-Q19 (5项) | 权力交接混沌期的心力 |
| `ethics_vision` | 伦理与格局 | Q20-Q23 (4项) | 现代企业家精神，长期价值 |

## 3. 计分规则

### 3.1 维度均分

每个条目 Likert 1-5 分。维度均分 = 维度内所有条目得分的算术平均（范围 1-5）。

```
D1 = avg(Q1..Q5)   # 战略破局力
D2 = avg(Q6..Q10)  # 执行颠覆力
D3 = avg(Q11..Q14) # 资源整合力
D4 = avg(Q15..Q19) # 逆商与灰度
D5 = avg(Q20..Q23) # 伦理与格局
```

### 3.2 综合总分

```
总分 = (D1 + D2 + D3 + D4 + D5) × 4
范围: 20-100
```

### 3.3 S-P-F 三维模型

```
S (战略破局力)            = D1
P (执行颠覆力)            = D2
F (家族/资源匹配度)        = (D3 + D4 + D5) / 3
```

- 高/低阈值: **≥ 3.5 为高**，< 3.5 为中/低

### 3.4 决策矩阵

| S | P | F | 推荐路径 | 逻辑 |
|---|---|---|---|---|
| 高 | 高 | 高 | 🏆 领军接班 | 具备改造传统产业的能力与魄力 |
| 高 | 中/低 | 低 | 🚀 独立创业 | 理念超前但受限于家族产业属性 |
| 中/低 | 高 | 高 | 💼 职能就业 | 执行力强但缺乏战略视野 |
| 高 | 低 | 低 | 📚 深造蓄力 | "眼高手低"或资源不匹配 |

### 3.5 特别警示指标

- **D4 < 2.5**: 心理韧性不足，建议暂缓独立决策
- **D5 < 3**: 缺乏责任感/伦理约束，建议暂缓赋予重权

## 4. 技术实现

### 4.1 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/data/questionnaires/mids-f2.json` | **新增** | 23 题问卷数据 |
| `src/types/index.ts` | 修改 | 新增 `'family-business'` 分类 |
| `src/lib/scoringEngine.ts` | 修改 | 支持 `likert` 计分类型 |
| `src/lib/midsF2Scoring.ts` | **新增** | S-P-F 矩阵判定 + 总分计算 |
| `src/pages/MidsF2ReportPage.tsx` | **新增** | MIDS-F2 专属报告页面 |
| `server/services/midsF2ReportService.js` | **新增** | AI 生成维度解读和发展建议 |
| `server/routes/report.js` | 修改 | 新增 MIDS-F2 报告生成端点 |

### 4.2 计分引擎扩展

在 `scoringEngine.ts` 中新增 `likert` 类型处理：
- 每个选项携带单一 `score: number`（1-5）
- 按 `scoring_rule.dimensions[].key` 分组，计算每组的平均分
- 返回 `dimensionScores`（各维度均分）和 `totalScore`（百分制总分）

### 4.3 MIDS-F2 计分服务 (`midsF2Scoring.ts`)

```typescript
interface MidsF2Result {
  dimensionAverages: Record<string, number>  // D1~D5 均分
  totalScore: number                          // 20-100
  sScore: number                              // S = D1
  pScore: number                              // P = D2
  fScore: number                              // F = (D3+D4+D5)/3
  decisionPath: 'leading_succession' | 'independent_startup' | 'functional_employment' | 'further_study'
  warnings: string[]                          // 特别警示
}

function computeMidsF2(dimensionScores: Record<string, number>): MidsF2Result
```

### 4.4 报告页面组件结构

```
MidsF2ReportPage
├── MidsF2ScoreSection        — GaugeChart 仪表盘 (20-100)
├── MidsF2RadarSection        — RadarChart 五维雷达图
├── MidsF2DecisionMatrix      — S-P-F 三列卡片 + 推荐路径
├── MidsF2DimensionInsights   — AI 生成的各维度解读
├── MidsF2Warnings            — 条件显示的特殊警示 (D4<2.5, D5<3)
├── MidsF2Suggestions         — AI 生成的发展建议
└── ActionButtons             — 下载 PDF / 返回列表
```

### 4.5 报告路由策略

- 复用现有 `/report/:id` 路由
- 在 `ReportPage` 中根据 session/questionnaire 来源判断报告类型
- 若为 `mids-f2` 问卷生成的报告，渲染 `MidsF2ReportPage` 组件
- 或者在 `reportContent` JSON 中添加 `reportType` 字段区分

## 5. 不做的

- 不修改 QuizPage 答题流程（完全复用）
- 不修改用户认证/会话体系
- 不新建独立路由（复用 `/report/:id`）
- 不属于兰大模式（不受 `LZU_MODE` 控制）

## 6. AI 报告生成

调用 DeepSeek，传入维度得分和 S-P-F 判定结果，生成：
- 五个维度的个性化文字解读
- 基于决策路径的发展建议
- 特别警示的详细说明（如有触发）

输出格式为结构化 JSON，前端渲染到专属报告组件中。
