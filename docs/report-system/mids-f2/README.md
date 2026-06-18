# MIDS-F2 家族二代创新力报告

## 概述

MIDS-F2（Multi-dimensional Innovation Scale for Family Business 2nd Generation）是面向家族企业二代的创新力与接班潜力测评量表。报告包含综合得分、五维雷达图、S-P-F 决策矩阵、维度深度解读和发展建议。

## 涉及问卷

| 问卷ID | 文件 | 题数 | 计分方式 |
|--------|------|------|----------|
| `mids-f2` | `src/data/questionnaires/mids-f2.json` | 23题 | likert 5点 |

## 计分方式

1. **前端计分**: `scoringEngine.ts` → likert 类型 → 返回 5 维度均分（1-5）
2. **S-P-F 矩阵**: `midsF2Scoring.ts`（前端）/ `midsF2ScoringService.js`（后端）
   - S = strategic_breakthrough
   - P = execution_disruption
   - F = (resource_integration + adversity_quotient + ethics_vision) / 3
3. **决策路径**: 阈值 3.5 → 领军接班 / 独立创业 / 职能就业 / 深造蓄力
4. **综合总分**: (S+P+F 各维度原始分) × 4，范围 20-100

## AI 报告生成

| 配置 | 值 |
|------|-----|
| 模型 | `deepseek-chat` |
| max_tokens | 4096 |
| temperature | 0.7 |
| 超时 | 120s |
| 提示词 | [`prompt.md`](./prompt.md) |

## 渲染方式

**React 组件**: `src/pages/MidsF2ReportPage.tsx`
- ScoreSection（仪表盘）
- RadarSection（五维雷达图）
- DecisionMatrixSection（S-P-F 卡片）
- WarningsSection（红色警示）
- DimensionInsightsSection（AI 解读）
- ImprovementPlanSection（发展建议）
- SummarySection（总结）

## 对应代码

| 功能 | 文件 |
|------|------|
| 问卷定义 | `src/data/questionnaires/mids-f2.json` |
| 前端计分 | `src/lib/midsF2Scoring.ts` |
| 后端计分 | `server/services/midsF2ScoringService.js` |
| 报告生成 | `server/services/midsF2ReportService.js` |
| 前端渲染 | `src/pages/MidsF2ReportPage.tsx` |
| 报告路由 | `src/pages/ReportPage.tsx`（`isMidsF2Report()` 检测） |
| Submit 分发 | `server/routes/session.js` (L300-319) |
| Admin 重新生成 | `server/routes/admin.js` (L538-592) |
| 独立生成接口 | `server/routes/report.js` (L150-198) |
