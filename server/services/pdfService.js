/**
 * PDF报告生成服务
 * 使用Puppeteer渲染报告HTML模板并导出为PDF
 *
 * 安装依赖：cd server && npm install puppeteer
 * 如服务器内存紧张（<2GB），可改用：
 *   npm install @sparticuz/chromium puppeteer-core
 */

const BRAND_COLORS = {
  primary: '#1E3A5F',
  gold: '#F4C550',
  text: '#1A1A2E',
  gray: '#6B7280',
  lightBg: '#F9FAFB',
  white: '#FFFFFF',
}

/**
 * 构建报告HTML模板
 */
function buildReportHTML(reportData) {
  const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData

  // 辅助：生成SVG仪表盘
  function buildGaugeSVG(score) {
    const cx = 100, cy = 90, r = 70
    const startAngle = -140, endAngle = 140
    const pct = Math.max(0, Math.min(1, (score - 65) / 20))
    const currentAngle = startAngle + (endAngle - startAngle) * pct
    const rad = (deg) => deg * Math.PI / 180
    const color = score >= 80 ? '#10B981' : score >= 75 ? '#6366F1' : score >= 70 ? '#F59E0B' : '#EF4444'

    const x1 = cx + r * Math.cos(rad(startAngle)), y1 = cy + r * Math.sin(rad(startAngle))
    const xe = cx + r * Math.cos(rad(currentAngle)), ye = cy + r * Math.sin(rad(currentAngle))

    return `<svg width="200" height="180" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(rad(endAngle))} ${cy + r * Math.sin(rad(endAngle))}"
            fill="none" stroke="#E5E7EB" stroke-width="14" stroke-linecap="round"/>
      <path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${xe} ${ye}"
            fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="28" font-weight="800" fill="${color}">${score}</text>
      <text x="${cx - 70}" y="${cy + 55}" text-anchor="middle" font-size="11" fill="#9CA3AF">65</text>
      <text x="${cx + 70}" y="${cy + 55}" text-anchor="middle" font-size="11" fill="#9CA3AF">85</text>
    </svg>`
  }

  // 辅助：生成SVG雷达图
  function buildRadarSVG(dimensions) {
    const cx = 120, cy = 120, maxR = 90, levels = 5
    const numAxes = dimensions.length
    const angleStep = (2 * Math.PI) / numAxes

    function getPoint(index, radius) {
      const angle = angleStep * index - Math.PI / 2
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
    }

    let rings = '', axes = '', dataPoly = '', labels = ''
    for (let l = 1; l <= levels; l++) {
      const r = (maxR / levels) * l
      const pts = dimensions.map((_, i) => getPoint(i, r)).map(p => `${p.x},${p.y}`).join(' ')
      rings += `<polygon points="${pts}" fill="none" stroke="#E5E7EB" stroke-width="${l === levels ? 1.5 : 0.5}"/>`
    }

    dimensions.forEach((d, i) => {
      const ep = getPoint(i, maxR)
      axes += `<line x1="${cx}" y1="${cy}" x2="${ep.x}" y2="${ep.y}" stroke="#E5E7EB" stroke-width="0.5"/>`
      const ratio = d.value / d.maxValue
      const dp = getPoint(i, maxR * ratio)
      dataPoly += `${i === 0 ? '' : ' '}${dp.x},${dp.y}`
      const lp = getPoint(i, maxR + 20)
      labels += `<text x="${lp.x}" y="${lp.y + 3}" text-anchor="middle" font-size="10" fill="#374151">${d.label}</text>`
    })

    return `<svg width="260" height="260" xmlns="http://www.w3.org/2000/svg">
      ${rings}
      ${axes}
      <polygon points="${dataPoly}" fill="#6366F1" fill-opacity="0.15" stroke="#6366F1" stroke-width="2"/>
      ${labels}
    </svg>`
  }

  // 构建核心优势HTML
  let advantagesHTML = ''
  if (data.coreAdvantages && data.coreAdvantages.length > 0) {
    advantagesHTML = data.coreAdvantages.map(a => `
      <div class="advantage-card">
        <div class="advantage-header">
          <span class="advantage-title">${a.title}</span>
          <span class="advantage-score">${a.score}分</span>
        </div>
        <p class="advantage-desc">${a.description}</p>
      </div>
    `).join('')
  }

  // 构建大五人格解读
  let big5HTML = ''
  if (data.personalityAnalysis && data.personalityAnalysis.big5) {
    const b5 = data.personalityAnalysis.big5
    const dims = [
      { label: '开放性', value: b5.openness, maxValue: 100 },
      { label: '尽责性', value: b5.conscientiousness, maxValue: 100 },
      { label: '外倾性', value: b5.extraversion, maxValue: 100 },
      { label: '宜人性', value: b5.agreeableness, maxValue: 100 },
      { label: '神经质', value: b5.neuroticism, maxValue: 100 },
    ]
    const radarSVG = buildRadarSVG(dims)

    const interpHTML = (data.personalityAnalysis.big5Interpretation || []).map(item => `
      <tr><td class="dim-name">${item.dimension}</td><td class="dim-score">${item.score}</td><td>${item.interpretation}</td></tr>
    `).join('')

    big5HTML = `
      <div class="section">
        <h2>人格特质分析（大五人格）</h2>
        <div class="chart-center">${radarSVG}</div>
        <table>
          <thead><tr><th>维度</th><th>得分</th><th>解读</th></tr></thead>
          <tbody>${interpHTML}</tbody>
        </table>
      </div>`
  }

  // 构建领导风格
  let leadershipHTML = ''
  if (data.leadershipAnalysis) {
    const stylesRows = (data.leadershipAnalysis.styles || []).map(s => `
      <tr><td>${s.name}</td><td>${s.score}分</td><td>${s.percentage}%</td></tr>
    `).join('')
    leadershipHTML = `
      <div class="section">
        <h2>领导力风格分析</h2>
        <table><thead><tr><th>风格</th><th>得分</th><th>占比</th></tr></thead><tbody>${stylesRows}</tbody></table>
        <p>${data.leadershipAnalysis.interpretation || ''}</p>
      </div>`
  }

  // 构建气质类型
  let temperamentHTML = ''
  if (data.temperamentAnalysis) {
    const typesRows = (data.temperamentAnalysis.types || []).map(t => `
      <tr><td>${t.name}</td><td>${t.score}分</td></tr>
    `).join('')
    temperamentHTML = `
      <div class="section">
        <h2>气质类型分析</h2>
        <p class="highlight">主导气质：${data.temperamentAnalysis.dominant || ''}</p>
        <table><thead><tr><th>类型</th><th>得分</th></tr></thead><tbody>${typesRows}</tbody></table>
        <p>${data.temperamentAnalysis.interpretation || ''}</p>
      </div>`
  }

  // 构建MBTI
  let mbtiHTML = ''
  if (data.mbtiAnalysis) {
    mbtiHTML = `
      <div class="section">
        <h2>MBTI性格类型</h2>
        <div class="mbti-badge">${data.mbtiAnalysis.type || ''}</div>
        <p>${data.mbtiAnalysis.interpretation || ''}</p>
      </div>`
  }

  // 构建16PF
  let sixteenPFHTML = ''
  if (data.sixteenPFAnalysis) {
    const traitRows = (data.sixteenPFAnalysis.derivedTraits || []).map(t => `
      <tr><td>${t.name}</td><td>${t.score}</td><td>${t.level}</td><td>${t.description}</td></tr>
    `).join('')
    sixteenPFHTML = `
      <div class="section">
        <h2>16PF深度分析</h2>
        <h3>二元性格特征</h3>
        <table><thead><tr><th>特征</th><th>得分</th><th>等级</th><th>描述</th></tr></thead><tbody>${traitRows}</tbody></table>
        <p>${data.sixteenPFAnalysis.interpretation || ''}</p>
      </div>`
  }

  // 构建霍兰德
  let hollandHTML = ''
  if (data.hollandAnalysis) {
    const h = data.hollandAnalysis
    hollandHTML = `
      <div class="section">
        <h2>霍兰德职业兴趣</h2>
        <p class="highlight">主导类型：${h.dominantType || ''}</p>
        <table><thead><tr><th>R</th><th>I</th><th>A</th><th>S</th><th>E</th><th>C</th></tr></thead>
        <tbody><tr><td>${h.scores?.R || 0}</td><td>${h.scores?.I || 0}</td><td>${h.scores?.A || 0}</td><td>${h.scores?.S || 0}</td><td>${h.scores?.E || 0}</td><td>${h.scores?.C || 0}</td></tr></tbody></table>
        <p>${h.interpretation || ''}</p>
      </div>`
  }

  // 构建创造力
  let creativityHTML = ''
  if (data.creativityAnalysis) {
    const c = data.creativityAnalysis
    creativityHTML = `
      <div class="section">
        <h2>创造力分析</h2>
        <p class="highlight">得分：${c.totalScore}/${c.maxScore}</p>
        <p>障碍：${(c.barriers || []).join(', ')}</p>
        <p>${c.interpretation || ''}</p>
      </div>`
  }

  // 构建职业建议
  let careerHTML = ''
  if (data.careerSuggestions && data.careerSuggestions.length > 0) {
    careerHTML = data.careerSuggestions.map(s => `
      <div class="career-card"><h4>${s.direction}</h4><p>${s.reason}</p></div>
    `).join('')
  }

  // 构建能力提升建议
  let improvementsHTML = ''
  if (data.improvementSuggestions && data.improvementSuggestions.length > 0) {
    improvementsHTML = data.improvementSuggestions.map(i => `<li>${i}</li>`).join('')
  }

  // 团队角色
  let teamRoleHTML = ''
  if (data.teamRole) {
    teamRoleHTML = `
      <div class="team-role">
        <span class="role-badge">${data.teamRole.primary}</span>
        <span class="role-badge secondary">${data.teamRole.secondary}</span>
        <p>${data.teamRole.description || ''}</p>
      </div>`
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>人才综合测评报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif; color: #1A1A2E; font-size: 13px; line-height: 1.7; }
    .page { padding: 30px 40px; max-width: 750px; margin: 0 auto; }
    .cover { text-align: center; background: linear-gradient(135deg, #1E3A5F, #2D5A8E); color: white; border-radius: 16px; padding: 50px 30px; margin-bottom: 30px; }
    .cover h1 { font-size: 24px; margin-bottom: 12px; }
    .cover p { font-size: 13px; opacity: 0.8; margin-bottom: 4px; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section h2 { font-size: 17px; color: #1E3A5F; border-bottom: 2px solid #F4C550; padding-bottom: 6px; margin-bottom: 14px; }
    .section h3 { font-size: 14px; color: #374151; margin: 10px 0 8px; }
    .highlight { background: #EEF2FF; border-radius: 8px; padding: 10px 14px; font-weight: 600; color: #1E3A5F; margin: 8px 0; }
    .chart-center { display: flex; justify-content: center; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
    th, td { padding: 8px 10px; border: 1px solid #E5E7EB; text-align: left; }
    th { background: #F9FAFB; font-weight: 600; color: #374151; }
    .dim-name { font-weight: 600; color: #1E3A5F; }
    .dim-score { font-weight: 700; color: #6366F1; text-align: center; }
    .advantage-card { background: #EEF2FF; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; border: 1px solid #E0E7FF; }
    .advantage-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .advantage-title { font-weight: 700; color: #1E3A5F; }
    .advantage-score { font-size: 12px; font-weight: 700; color: #6366F1; background: white; padding: 2px 10px; border-radius: 12px; }
    .advantage-desc { font-size: 12px; color: #6B7280; }
    .mbti-badge { display: inline-block; font-size: 32px; font-weight: 800; color: #6366F1; background: #EEF2FF; padding: 12px 28px; border-radius: 14px; margin: 10px 0; }
    .career-card { background: #F9FAFB; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; border-left: 3px solid #F4C550; }
    .career-card h4 { font-size: 13px; color: #1E3A5F; margin-bottom: 4px; }
    .career-card p { font-size: 12px; color: #6B7280; }
    .team-role { text-align: center; background: #EEF2FF; border-radius: 12px; padding: 16px; margin: 8px 0; }
    .role-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: #6366F1; color: white; font-weight: 700; font-size: 13px; margin: 0 6px; }
    .role-badge.secondary { background: #A5B4FC; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .footer { text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 30px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="page">
    <!-- 封面 -->
    <div class="cover">
      <h1>人才综合测评报告</h1>
      <p>${data.userName || ''} | ${data.reportDate || ''}</p>
      <p>报告编号：${data.reportId || ''}</p>
    </div>

    <!-- 综合得分 -->
    <div class="section">
      <h2>综合评估概览</h2>
      <div class="chart-center">${buildGaugeSVG(data.comprehensiveScore || 75)}</div>
      <p>${data.coreEvaluation || ''}</p>
    </div>

    <!-- 核心优势 -->
    ${advantagesHTML ? `<div class="section"><h2>核心优势</h2>${advantagesHTML}</div>` : ''}

    ${big5HTML}
    ${leadershipHTML}
    ${temperamentHTML}
    ${mbtiHTML}
    ${sixteenPFHTML}
    ${creativityHTML}
    ${hollandHTML}

    <!-- 发展建议 -->
    ${(careerHTML || improvementsHTML || teamRoleHTML) ? `
    <div class="section">
      <h2>发展潜力与建议</h2>
      ${careerHTML ? `<h3>适合的职业方向</h3>${careerHTML}` : ''}
      ${improvementsHTML ? `<h3>能力提升建议</h3><ul>${improvementsHTML}</ul>` : ''}
      ${teamRoleHTML ? `<h3>团队角色定位</h3>${teamRoleHTML}` : ''}
    </div>` : ''}

    <!-- 总结 -->
    ${data.summary ? `
    <div class="section">
      <h2>总结与展望</h2>
      <p>${data.summary}</p>
    </div>` : ''}

    <div class="footer">
      <p>本报告由「潜能星图」AI测评系统生成 | CONFIDENTIAL</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * 生成PDF报告
 * @param {Object|string} reportData - 报告数据（可以是JSON对象或字符串）
 * @returns {Promise<Buffer>} PDF文件的Buffer
 */
async function generateReportPDF(reportData) {
  // 尝试加载puppeteer，如果未安装则降级为轻量HTML输出
  let puppeteer
  try {
    puppeteer = require('puppeteer')
  } catch {
    console.warn('Puppeteer not installed. Falling back to HTML output.')
    // 返回HTML作为降级方案
    const html = buildReportHTML(reportData)
    return Buffer.from(html, 'utf-8')
  }

  let browser = null
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',  // 减少内存使用
      ],
    })

    const page = await browser.newPage()

    const html = buildReportHTML(reportData)
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
      preferCSSPageSize: true,
    })

    return Buffer.from(pdfBuffer)
  } catch (err) {
    console.error('PDF generation error:', err.message)
    // 降级：返回HTML
    const html = buildReportHTML(reportData)
    return Buffer.from(html, 'utf-8')
  } finally {
    if (browser) {
      try { await browser.close() } catch { /* ignore */ }
    }
  }
}

module.exports = { generateReportPDF, buildReportHTML }
