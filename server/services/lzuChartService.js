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
 * 领导风格四维雷达图（S1-S4）
 */
function renderLeadershipRadar(s1, s2, s3, s4) {
  const labels = ['S1 指令型', 'S2 教练型', 'S3 支持型', 'S4 授权型'];
  const values = [s1, s2, s3, s4];
  const maxVal = Math.max(...values, 1);
  const cx = 200, cy = 190, radius = 130;
  const angles = [0, 90, 180, 270].map(d => (d - 90) * Math.PI / 180);

  // 背景网格
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
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${(cx + radius * Math.cos(a)).toFixed(1)}" y2="${(cy + radius * Math.sin(a)).toFixed(1)}" stroke="#e0e8f0" stroke-width="1"/>\n`;
  });

  // 数据多边形
  const dataPoints = angles.map((a, i) => {
    const r = radius * (values[i] / maxVal);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  // 数据点圆点 + 数值标签
  let dots = '';
  angles.forEach((a, i) => {
    const r = radius * (values[i] / maxVal);
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    dots += `<circle cx="${x}" cy="${y}" r="5" fill="${COLORS.accent}" stroke="#fff" stroke-width="2"/>\n`;
    // 值标签（偏移到点外围）
    const lr = r + 14;
    const lx = (cx + lr * Math.cos(a)).toFixed(1);
    const ly = (cy + lr * Math.sin(a)).toFixed(1);
    dots += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="${COLORS.accent}">${values[i]}</text>\n`;
  });

  // 轴标签
  let labelText = '';
  angles.forEach((a, i) => {
    const r = radius + 34;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    const anchor = i === 0 ? 'middle' : i === 2 ? 'middle' : i === 1 ? 'start' : 'end';
    labelText += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10" fill="${COLORS.label}" font-weight="600">${labels[i]}</text>\n`;
  });

  // 适应性指数
  const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - values.reduce((a,b)=>a+b)/values.length, 2), 0) / values.length).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 390" width="100%" height="auto">
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
  <text x="${cx}" y="22" text-anchor="middle" font-size="12" font-weight="700" fill="${COLORS.label}">领导风格四维轮廓</text>
  <text x="${cx}" y="40" text-anchor="middle" font-size="9" fill="${COLORS.muted}">情境适应性标准差=${std} · ${std < 1.5 ? '强' : std < 3.0 ? '一般' : '需提升'}</text>
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="auto">
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${totalH}" width="100%" height="auto">
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
function renderScoreGauge(percentage, label) {
  const cx = 160, cy = 160, r = 100, sw = 18;
  const circumference = 2 * Math.PI * r;
  const fillLength = circumference * (Math.min(percentage, 100) / 100);
  const emptyLength = circumference - fillLength;

  // 根据百分比选择颜色
  const pctVal = Math.min(percentage, 100);
  const fillColor = pctVal >= 90 ? COLORS.warning : pctVal >= 75 ? COLORS.accent : pctVal >= 60 ? COLORS.success : COLORS.muted;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 280" width="320" height="280">
  <rect width="320" height="280" fill="#fff"/>
  <!-- 背景环 -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${sw}"/>
  <!-- 数据环 -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fillColor}"
    stroke-width="${sw}" stroke-linecap="round"
    stroke-dasharray="${fillLength} ${emptyLength}"
    stroke-dashoffset="${circumference * 0.25}"
    transform="rotate(-90 ${cx} ${cy})"/>
  <!-- 中心文字 -->
  <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="36" font-weight="800" fill="${COLORS.primary}">${percentage}</text>
  <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="12" fill="${COLORS.muted}">${label || '综合胜任力指数'}</text>
</svg>`;
}

module.exports = {
  renderLeadershipRadar,
  renderLeadershipBar,
  renderHorizontalBar,
  renderScoreGauge,
};
