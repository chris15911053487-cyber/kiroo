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
