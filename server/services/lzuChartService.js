/**
 * 兰大综合报告 — 图表生成服务
 * 所有图表样式写死，只接受数据参数
 * 输出纯SVG字符串，直接内嵌HTML模版
 */

/**
 * 领导风格四维雷达图（S1-S4）
 */
function renderLeadershipRadar(s1, s2, s3, s4) {
  const maxVal = Math.max(s1, s2, s3, s4, 1);
  const labels = ['S1 指令型', 'S2 教练型', 'S3 支持型', 'S4 授权型'];
  const values = [s1, s2, s3, s4];
  const cx = 200, cy = 180, radius = 130;
  const angles = [0, 90, 180, 270].map(d => (d - 90) * Math.PI / 180);

  // 背景网格
  let gridLines = '';
  for (let level = 0.25; level <= 1; level += 0.25) {
    const points = angles.map(a => {
      const r = radius * level;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    gridLines += `<polygon points="${points}" fill="none" stroke="#e2e8f0" stroke-width="1"/>\n`;
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

  // 数据点圆点
  let dots = '';
  angles.forEach((a, i) => {
    const r = radius * (values[i] / maxVal);
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#2c5f8a" stroke="#fff" stroke-width="2"/>\n`;
  });

  // 标签
  let labelText = '';
  angles.forEach((a, i) => {
    const r = radius + 28;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    const anchor = i === 0 ? 'middle' : i === 2 ? 'middle' : i === 1 ? 'start' : 'end';
    labelText += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10" fill="#475569" font-weight="600">${labels[i]} ${values[i]}</text>\n`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 380" width="100%" height="auto">
  <rect width="400" height="380" fill="#fff"/>
  ${gridLines}
  ${axisLines}
  <polygon points="${dataPoints}" fill="rgba(44,95,138,0.15)" stroke="#2c5f8a" stroke-width="2"/>
  ${dots}
  ${labelText}
  <text x="${cx}" y="20" text-anchor="middle" font-size="11" fill="#64748b">领导风格四维轮廓（原始分）</text>
</svg>`;
}

/**
 * 领导风格柱状图
 */
function renderLeadershipBar(s1, s2, s3, s4) {
  const labels = ['S1 指令型', 'S2 教练型', 'S3 支持型', 'S4 授权型'];
  const values = [s1, s2, s3, s4];
  const maxVal = Math.max(...values, 1);
  const barW = 48, gap = 30, startX = 70, baseY = 200, chartH = 160;

  let bars = '';
  values.forEach((v, i) => {
    const h = (v / maxVal) * chartH;
    const x = startX + i * (barW + gap);
    const y = baseY - h;
    const color = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'][i];
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${color}" opacity="0.85"/>\n`;
    bars += `<text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${v}</text>\n`;
    bars += `<text x="${x + barW / 2}" y="${baseY + 18}" text-anchor="middle" font-size="9" fill="#64748b">${labels[i]}</text>\n`;
  });

  // Y轴线
  for (let i = 0; i <= 4; i++) {
    const y = baseY - (i / 4) * chartH;
    bars += `<line x1="40" y1="${y}" x2="360" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>\n`;
    bars += `<text x="36" y="${y + 4}" text-anchor="end" font-size="8" fill="#94a3b8">${Math.round(maxVal * i / 4)}</text>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="auto">
  <rect width="400" height="240" fill="#fff"/>
  ${bars}
  <text x="200" y="18" text-anchor="middle" font-size="11" fill="#64748b">领导风格强度分布</text>
</svg>`;
}

/**
 * 横向条形图（用于障碍分析等）
 */
function renderHorizontalBar(labels, values, maxValues, colors) {
  const barH = 28, gap = 16, startY = 40, labelW = 120, barMaxW = 220;
  const n = labels.length;
  const totalH = startY + n * (barH + gap) + 10;

  let bars = '';
  labels.forEach((label, i) => {
    const y = startY + i * (barH + gap);
    const pct = values[i] / maxValues[i];
    const w = pct * barMaxW;
    const color = colors?.[i] || '#2c5f8a';

    bars += `<text x="10" y="${y + barH / 2 + 4}" text-anchor="start" font-size="10" fill="#475569" font-weight="500">${label}</text>\n`;
    bars += `<rect x="${labelW}" y="${y}" width="${barMaxW}" height="${barH}" rx="6" fill="#f1f5f9"/>\n`;
    bars += `<rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="6" fill="${color}" opacity="0.8"/>\n`;
    bars += `<text x="${labelW + w + 8}" y="${y + barH / 2 + 4}" font-size="10" font-weight="600" fill="${color}">${values[i]}/${maxValues[i]}</text>\n`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${totalH}" width="100%" height="auto">
  <rect width="400" height="${totalH}" fill="#fff"/>
  ${bars}
</svg>`;
}

module.exports = {
  renderLeadershipRadar,
  renderLeadershipBar,
  renderHorizontalBar,
};
