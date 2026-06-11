/**
 * 兰大综合报告 — 图表生成服务
 * 所有图表样式写死，只接受数据参数
 * 输出纯SVG字符串，直接内嵌HTML模版
 *
 * 配色标准化：
 *   主色 #1E4663  辅色 #2C5F8A
 *   优势 #10B981  中等 #F59E0B  发展区 #EF4444
 *   创造力 #8B5CF6
 */

const COLORS = {
  primary: '#1E4663',
  accent: '#2C5F8A',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  grid: '#e2e8f0',
  muted: '#94a3b8',
  label: '#475569',
};

/**
 * 领导风格四维雷达图（S1-S4，百分比标准化）
 * 匹配报告模版兰大最终.html 的雷达图样式
 */
function renderLeadershipRadar(s1, s2, s3, s4) {
  const labels = ['指令型 (S1)', '教练型 (S2)', '支持型 (S3)', '授权型 (S4)'];
  const rawScores = [s1, s2, s3, s4];
  const maxScores = [7, 12, 12, 12];
  const values = rawScores.map((v, i) => (v / maxScores[i]) * 100); // 百分比
  const cx = 200, cy = 190, radius = 130;
  // 四个方向：上、右、下、左（Canvas 雷达图默认角度）
  const angles = [-90, 0, 90, 180].map(d => d * Math.PI / 180);

  // 背景网格（25%, 50%, 75%, 100%）
  let gridLines = '';
  for (let level = 0.25; level <= 1; level += 0.25) {
    const points = angles.map(a => {
      const r = radius * level;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    gridLines += `<polygon points="${points}" fill="none" stroke="${COLORS.grid}" stroke-width="1"/>\n`;
  }

  // 轴线
  let axisLines = '';
  angles.forEach(a => {
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${(cx + radius * Math.cos(a)).toFixed(1)}" y2="${(cy + radius * Math.sin(a)).toFixed(1)}" stroke="${COLORS.grid}" stroke-width="1"/>\n`;
  });

  // 数据多边形
  const dataPoints = angles.map((a, i) => {
    const r = radius * (Math.max(values[i], 2) / 100); // 最小2%保证可见
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  // 数据点 + 分数标签
  let dots = '';
  const rawLabels = [`${s1}/7`, `${s2}/12`, `${s3}/12`, `${s4}/12`];
  angles.forEach((a, i) => {
    const r = radius * (Math.max(values[i], 2) / 100);
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    // 数据点
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#eab308" stroke="#1e4663" stroke-width="2"/>\n`;
    // 分数标签（稍微外移）
    const lr = r + 16;
    const lx = (cx + lr * Math.cos(a)).toFixed(1);
    const ly = (cy + lr * Math.sin(a)).toFixed(1);
    dots += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#1e4663">${rawLabels[i]}</text>\n`;
  });

  // 轴标签
  let labelText = '';
  angles.forEach((a, i) => {
    const r = radius + 36;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    const anchor = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
    labelText += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11" fill="${COLORS.label}" font-weight="600">${labels[i]}</text>\n`;
  });

  // 标准差
  const mean = values.reduce((a, b) => a + b) / values.length;
  const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 390" width="100%" style="max-width:400px;">
  <defs>
    <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${COLORS.accent}" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="400" height="390" fill="#fff"/>
  ${gridLines}
  ${axisLines}
  <polygon points="${dataPoints}" fill="url(#radarGrad)" stroke="${COLORS.accent}" stroke-width="2.5"/>
  ${dots}
  ${labelText}
  <text x="${cx}" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="${COLORS.label}">领导风格雷达图</text>
  <text x="${cx}" y="38" text-anchor="middle" font-size="9" fill="${COLORS.muted}">情境适应性标准差=${std} · ${std < 1.5 ? '强' : std < 3.0 ? '一般' : '需提升'} · 原始分 S1=${s1}/7 S2=${s2}/12 S3=${s3}/12 S4=${s4}/12</text>
</svg>`;
}

/**
 * 领导风格柱状图
 */
function renderLeadershipBar(s1, s2, s3, s4) {
  const labels = ['S1 指令型', 'S2 教练型', 'S3 支持型', 'S4 授权型'];
  const values = [s1, s2, s3, s4];
  const maxVal = Math.max(...values, 1);
  const barColors = ['#5f8aa8', '#5f8aa8', '#5f8aa8', '#5f8aa8']; // 参考模版统一配色
  const barW = 48, gap = 30, startX = 70, baseY = 200, chartH = 160;

  let bars = '';
  values.forEach((v, i) => {
    const h = (v / maxVal) * chartH;
    const x = startX + i * (barW + gap);
    const y = baseY - h;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${barColors[i]}" opacity="0.85"/>\n`;
    bars += `<text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${barColors[i]}">${v}</text>\n`;
    bars += `<text x="${x + barW / 2}" y="${baseY + 18}" text-anchor="middle" font-size="9" fill="${COLORS.muted}">${labels[i]}</text>\n`;
  });

  // Y轴线
  for (let i = 0; i <= 4; i++) {
    const y = baseY - (i / 4) * chartH;
    bars += `<line x1="40" y1="${y}" x2="360" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>\n`;
    bars += `<text x="36" y="${y + 4}" text-anchor="end" font-size="8" fill="${COLORS.muted}">${Math.round(maxVal * i / 4)}</text>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%">
  <rect width="400" height="240" fill="#fff"/>
  ${bars}
  <text x="200" y="18" text-anchor="middle" font-size="11" fill="${COLORS.label}" font-weight="600">领导风格强度分布</text>
</svg>`;
}

/**
 * 横向条形图（用于障碍分析、人格特质等）
 */
function renderHorizontalBar(labels, values, maxValues, colors) {
  const barH = 30, gap = 18, startY = 40, labelW = 120, barMaxW = 220;
  const n = labels.length;
  const totalH = startY + n * (barH + gap) + 10;

  let bars = '';
  labels.forEach((label, i) => {
    const y = startY + i * (barH + gap);
    const pct = values[i] / maxValues[i];
    const w = Math.max(pct * barMaxW, 2); // min 2px for visibility
    const color = colors?.[i] || COLORS.accent;
    const displayPct = Math.round(pct * 100);

    bars += `<text x="10" y="${y + barH / 2 + 4}" text-anchor="start" font-size="10" fill="${COLORS.label}" font-weight="500">${label}</text>\n`;
    // 背景条
    bars += `<rect x="${labelW}" y="${y}" width="${barMaxW}" height="${barH}" rx="7" fill="#f1f5f9"/>\n`;
    // 50% 参考线
    bars += `<line x1="${labelW + barMaxW * 0.5}" y1="${y - 2}" x2="${labelW + barMaxW * 0.5}" y2="${y + barH + 2}" stroke="${COLORS.muted}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>\n`;
    // 数据条
    bars += `<rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="7" fill="${color}" opacity="0.85"/>\n`;
    // 值标签（百分比）
    const labelInside = w > 60;
    if (labelInside) {
      bars += `<text x="${labelW + w - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="10" font-weight="700" fill="#fff">${values[i]}/${maxValues[i]} (${displayPct}%)</text>\n`;
    } else {
      bars += `<text x="${labelW + w + 8}" y="${y + barH / 2 + 4}" font-size="10" font-weight="600" fill="${color}">${values[i]}/${maxValues[i]} (${displayPct}%)</text>\n`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${totalH}" width="100%">
  <rect width="400" height="${totalH}" fill="#fff"/>
  <text x="200" y="22" text-anchor="middle" font-size="11" fill="${COLORS.muted}">虚线为 50% 参考线</text>
  ${bars}
</svg>`;
}

/**
 * 总分环图（用于得分概览区域）
 * @param {number} percentage - 0-100 的百分比值
 * @param {string} label - 可选标签
 */
/**
 * 综合等级仪表盘（半圆仪表盘，匹配报告模版兰大最终.html设计）
 * @param {number} score - 综合得分 0-100
 * @param {string} label - 标签
 * @param {string} grade - 等级（卓越型/进取型/成长型/待发展型）
 */
function renderScoreGauge(score, label, grade) {
  const cx = 200, cy = 180, r = 150;
  const startAngle = -Math.PI;  // 左端
  const endAngle = 0;           // 右端
  const sw = 18;                // 弧线粗细

  function angleForScore(s) {
    const t = Math.min(1, Math.max(0, s / 100));
    return startAngle + t * (endAngle - startAngle);
  }

  // 四段色区
  const segments = [
    { start: 0, end: 59, color: '#9ca3af', tag: '待发展型' },
    { start: 60, end: 74, color: '#60a5fa', tag: '成长型' },
    { start: 75, end: 89, color: '#eab308', tag: '进取型' },
    { start: 90, end: 100, color: '#10b981', tag: '卓越型' },
  ];

  // 生成弧段path
  let segmentPaths = '';
  for (const seg of segments) {
    const a1 = startAngle + (seg.start / 100) * (endAngle - startAngle);
    const a2 = startAngle + (seg.end / 100) * (endAngle - startAngle);
    const x1 = (cx + r * Math.cos(a1)).toFixed(2);
    const y1 = (cy + r * Math.sin(a1)).toFixed(2);
    const x2 = (cx + r * Math.cos(a2)).toFixed(2);
    const y2 = (cy + r * Math.sin(a2)).toFixed(2);
    segmentPaths += `<path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}" fill="none" stroke="${seg.color}" stroke-width="${sw}" stroke-linecap="butt"/>\n`;
  }

  // 刻度线（每10分）和标签（每20分）
  let ticks = '';
  for (let i = 0; i <= 100; i += 10) {
    const angle = angleForScore(i);
    const innerR = r - 12;
    const outerR = r + 4;
    const x1 = (cx + innerR * Math.cos(angle)).toFixed(1);
    const y1 = (cy + innerR * Math.sin(angle)).toFixed(1);
    const x2 = (cx + outerR * Math.cos(angle)).toFixed(1);
    const y2 = (cy + outerR * Math.sin(angle)).toFixed(1);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e4663" stroke-width="1.5"/>\n`;
    if (i % 20 === 0) {
      const lx = (cx + (r + 12) * Math.cos(angle)).toFixed(1);
      const ly = (cy + (r + 12) * Math.sin(angle)).toFixed(1);
      ticks += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="bold" fill="#1e4663" font-family="'Segoe UI', Roboto, sans-serif">${i}</text>\n`;
    }
  }

  // 指针（从圆心指向分数对应角度）
  const pointerAngle = angleForScore(score);
  const pointerLen = r - 20;
  const px = (cx + pointerLen * Math.cos(pointerAngle)).toFixed(1);
  const py = (cy + pointerLen * Math.sin(pointerAngle)).toFixed(1);

  // 当前分数对应等级的颜色
  const currentGrade = grade || '';
  const gradeColor = currentGrade === '卓越型' ? '#10b981' : currentGrade === '进取型' ? '#eab308' : currentGrade === '成长型' ? '#60a5fa' : '#9ca3af';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%">
  <rect width="400" height="240" fill="#fff"/>
  ${segmentPaths}
  ${ticks}
  <!-- 指针三角形 -->
  <polygon points="${cx-5},${cy-5} ${cx+5},${cy-5} ${px},${py}" fill="#c2410c"/>
  <!-- 圆心外圈 -->
  <circle cx="${cx}" cy="${cy}" r="6" fill="#c2410c"/>
  <!-- 圆心内点 -->
  <circle cx="${cx}" cy="${cy}" r="3" fill="#fff"/>
  <!-- 分数数字 -->
  <text x="${cx}" y="${cy - 25}" text-anchor="middle" font-size="28" font-weight="bold" fill="#1e4663" font-family="'Segoe UI', Roboto, sans-serif">${score.toFixed(1)}</text>
  <!-- 标签 -->
  <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="12" fill="#5f6f82" font-family="'Segoe UI', Roboto, sans-serif">${label || '综合得分'}</text>
  <!-- 等级标签 -->
  <text x="${cx}" y="${cy + 35}" text-anchor="middle" font-size="14" font-weight="bold" fill="${gradeColor}" font-family="'Segoe UI', Roboto, sans-serif">${currentGrade}</text>
</svg>`;
}

module.exports = {
  renderLeadershipRadar,
  renderLeadershipBar,
  renderHorizontalBar,
  renderScoreGauge,
};
