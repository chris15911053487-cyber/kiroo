/**
 * 兰大综合测评 — 精准计分服务
 * 所有权重、公式、等级判定写死，确保计分标准化
 */

function rawToStandard(raw, maxRaw) {
  const ratio = raw / maxRaw;
  if (ratio <= 0.2) return Math.max(1, Math.round(ratio / 0.2 * 2));
  if (ratio <= 0.4) return 3 + Math.round((ratio - 0.2) / 0.2 * 2);
  if (ratio <= 0.6) return 5 + Math.round((ratio - 0.4) / 0.2 * 2);
  if (ratio <= 0.8) return 7 + Math.round((ratio - 0.6) / 0.2 * 2);
  return 9 + Math.round(Math.min(1, (ratio - 0.8) / 0.2) * 1);
}

function standardToLevel(standard) {
  if (standard >= 9) return '优秀';
  if (standard >= 7) return '良好';
  if (standard >= 5) return '中等';
  if (standard >= 3) return '稍低';
  return '较低';
}

function barrierLevel(score, lowThreshold, midThreshold) {
  if (score >= lowThreshold) return '低障碍';
  if (score >= midThreshold) return '中障碍';
  return '高障碍';
}

/**
 * 计算兰大综合测评得分
 * 权重：领导风格30% + 人格特质40% + 创造力障碍30%
 */
function calculateLZUComprehensiveScore(scoreSummary) {
  const result = {
    totalScore: 0,
    grade: '待发展型',
    gradeDescription: '',
    breakdown: { leadership: 0, personality: 0, creativityBarrier: 0 },
    adaptabilityIndex: 0,
    adaptabilityLevel: '',
    leadership: { s1: 0, s2: 0, s3: 0, s4: 0, dominantStyle: '' },
    personality: {
      creativityPotential: { raw: 0, standard: 5, level: '中等' },
      mentalHealth: { raw: 0, standard: 5, level: '中等' },
      managementPotential: { raw: 0, standard: 5, level: '中等' },
    },
    creativityBarrier: {
      psychological: { score: 0, max: 16, level: '中障碍' },
      cognitive: { score: 0, max: 12, level: '中障碍' },
      environmental: { score: 0, max: 20, level: '中障碍' },
      primaryBarrierType: '',
    },
  };

  // ---- 领导风格得分 (30%) ----
  const ls = scoreSummary['lzu-leadership'];
  if (ls?.dimensionScores) {
    const { S1 = 0, S2 = 0, S3 = 0, S4 = 0 } = ls.dimensionScores;
    result.leadership = { s1: S1, s2: S2, s3: S3, s4: S4, dominantStyle: '' };

    const styles = [
      { name: '指令型（S1）', score: S1 }, { name: '教练型（S2）', score: S2 },
      { name: '支持型（S3）', score: S3 }, { name: '授权型（S4）', score: S4 },
    ];
    styles.sort((a, b) => b.score - a.score);
    result.leadership.dominantStyle = styles[0].name;
    if (styles[1].score === styles[0].score) {
      result.leadership.dominantStyle += ' / ' + styles[1].name;
    }

    const values = [S1, S2, S3, S4];
    const mean = values.reduce((a, b) => a + b, 0) / 4;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 4;
    const std = Math.sqrt(variance);
    result.adaptabilityIndex = Math.round(std * 100) / 100;

    const maxStd = 5.2;
    const adaptabilityScore = Math.max(0, Math.min(100, (1 - std / maxStd) * 100));
    result.breakdown.leadership = Math.round(adaptabilityScore * 0.30 * 10) / 10;

    if (std < 1.5) result.adaptabilityLevel = '强';
    else if (std < 3.0) result.adaptabilityLevel = '一般';
    else result.adaptabilityLevel = '需提升';
  }

  // ---- 人格特质得分 (40%) ----
  const ps = scoreSummary['lzu-personality'];
  if (ps?.dimensionScores) {
    const cp = ps.dimensionScores['creativity_potential'] ?? 0;
    const mh = ps.dimensionScores['mental_health'] ?? 0;
    const mp = ps.dimensionScores['management_potential'] ?? 0;

    result.personality.creativityPotential = {
      raw: cp, standard: rawToStandard(cp, 10), level: standardToLevel(rawToStandard(cp, 10)),
    };
    result.personality.mentalHealth = {
      raw: mh, standard: rawToStandard(mh, 10), level: standardToLevel(rawToStandard(mh, 10)),
    };
    result.personality.managementPotential = {
      raw: mp, standard: rawToStandard(mp, 10), level: standardToLevel(rawToStandard(mp, 10)),
    };

    const cpNorm = (cp / 10) * 100;
    const mhNorm = (mh / 10) * 100;
    const mpNorm = (mp / 10) * 100;
    const personalityComposite = cpNorm * 0.40 + mhNorm * 0.30 + mpNorm * 0.30;
    result.breakdown.personality = Math.round(personalityComposite * 0.40 * 10) / 10;
  }

  // ---- 创造力障碍得分 (30%，反向计分: 障碍越少得分越高) ----
  const cs = scoreSummary['lzu-creativity'];
  if (cs?.dimensionScores) {
    const psy = cs.dimensionScores['psychological_barrier'] ?? 0;
    const cog = cs.dimensionScores['cognitive_barrier'] ?? 0;
    const env = cs.dimensionScores['environmental_barrier'] ?? 0;

    result.creativityBarrier.psychological = {
      score: psy, max: 16, level: barrierLevel(psy, 12, 6),
    };
    result.creativityBarrier.cognitive = {
      score: cog, max: 12, level: barrierLevel(cog, 9, 5),
    };
    result.creativityBarrier.environmental = {
      score: env, max: 20, level: barrierLevel(env, 15, 8),
    };

    const psyNorm = (psy / 16) * 100;
    const cogNorm = (cog / 12) * 100;
    const envNorm = (env / 20) * 100;
    const barrierComposite = (psyNorm + cogNorm + envNorm) / 3;
    result.breakdown.creativityBarrier = Math.round(barrierComposite * 0.30 * 10) / 10;

    const barriers = [
      { type: '心理障碍', score: psyNorm },
      { type: '认知障碍', score: cogNorm },
      { type: '环境与资源障碍', score: envNorm },
    ];
    barriers.sort((a, b) => a.score - b.score);
    result.creativityBarrier.primaryBarrierType = barriers[0].type;
  }

  // ---- 综合总分 ----
  result.totalScore = Math.round(
    result.breakdown.leadership +
    result.breakdown.personality +
    result.breakdown.creativityBarrier
  );

  // ---- 等级评定 ----
  if (result.totalScore >= 90) {
    result.grade = '卓越型';
    result.gradeDescription = '领导力、人格素质与创造力俱佳';
  } else if (result.totalScore >= 75) {
    result.grade = '进取型';
    result.gradeDescription = '具备良好的发展潜力';
  } else if (result.totalScore >= 60) {
    result.grade = '成长型';
    result.gradeDescription = '有明确的可提升空间';
  } else {
    result.grade = '待发展型';
    result.gradeDescription = '需系统性的能力建设';
  }

  return result;
}

module.exports = {
  calculateLZUComprehensiveScore,
  rawToStandard,
  standardToLevel,
  barrierLevel,
};
