# LZU 兰大综合报告

## 概述

兰州大学管理学院职业发展测评系统的综合报告。包含领导风格分析、16PF 人格测验、创造力障碍测试三大模块。

> ⚠️ **注意**: LZU 报告的提示词目前仍硬编码在 `server/services/lzuReportGenerator.js` 的 `buildAIPrompt()` 函数中，尚未迁移为文件驱动模式。下方 `03-提示词/` 中的文件为文档参考。

## 涉及问卷

| 问卷ID | 文件 | 计分方式 |
|--------|------|----------|
| `lzu-leadership` | `src/data/questionnaires/lzu-leadership.json` | additive |
| `lzu-personality` | `src/data/questionnaires/lzu-personality.json` | additive |
| `lzu-creativity` | `src/data/questionnaires/lzu-creativity.json` | additive |

## 计分方式

`server/services/lzuScoringService.js`:
- 领导风格 30%（S1/S2/S3/S4 四种风格 + 情境适应性指数）
- 16PF 人格特质 40%（创造力潜质/心理健康/管理潜能）
- 创造力障碍 30%（心理/认知/环境，反向计分）
- 等级：卓越型(≥90) / 进取型(75-89) / 成长型(60-74) / 待发展型(<60)

## 渲染方式

**HTML 模版**: `server/services/lzuReportTemplate.js`
- 服务端生成完整 HTML（含内联 CSS + SVG 图表）
- 前端通过 iframe 渲染

## 对应代码

| 功能 | 文件 |
|------|------|
| 计分 | `server/services/lzuScoringService.js` |
| 图表 | `server/services/lzuChartService.js` |
| 报告编排 | `server/services/lzuReportGenerator.js` |
| HTML 模版 | `server/services/lzuReportTemplate.js` |
| 前端渲染 | `src/pages/ReportPage.tsx`（`isLZUReport()` 检测） |
