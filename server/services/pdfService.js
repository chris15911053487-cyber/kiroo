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
// ==================== MIDS-F2 报告 HTML 模板 ====================

function renderRichText(text) {
  if (!text) return ''
  return String(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function buildMidsF2ReportHTML(data) {
  const mids = data.midsF2Result || {}
  const co = data.comprehensiveOverview || {}
  const spf = co.spfConclusion || {}
  const dimInsights = data.dimensionInsights || []
  const dev = data.developmentSuggestions || {}
  const cpa = data.careerPathAnalysis || {}

  function gaugeSVG(score) {
    const cx = 100, cy = 90, r = 70, startAngle = -140, endAngle = 140
    const pct = Math.max(0, Math.min(1, (score - 20) / 80))
    const currentAngle = startAngle + (endAngle - startAngle) * pct
    const rad = (deg) => deg * Math.PI / 180
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : score >= 40 ? '#F59E0B' : '#EF4444'
    const x1 = cx + r * Math.cos(rad(startAngle)), y1 = cy + r * Math.sin(rad(startAngle))
    const xe = cx + r * Math.cos(rad(currentAngle)), ye = cy + r * Math.sin(rad(currentAngle))
    const bgLargeArc = endAngle - startAngle > 180 ? 1 : 0
    const valLargeArc = currentAngle - startAngle > 180 ? 1 : 0
    return `<svg width="200" height="180" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${bgLargeArc} 1 ${cx + r * Math.cos(rad(endAngle))} ${cy + r * Math.sin(rad(endAngle))}" fill="none" stroke="#E5E7EB" stroke-width="14" stroke-linecap="round"/>
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${valLargeArc} 1 ${xe} ${ye}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="28" font-weight="800" fill="${color}">${score}</text>
      <text x="${cx - 70}" y="${cy + 55}" text-anchor="middle" font-size="16" fill="#9CA3AF">20</text>
      <text x="${cx + 70}" y="${cy + 55}" text-anchor="middle" font-size="16" fill="#9CA3AF">100</text>
    </svg>`
  }

  function radarSVG(dims, color = '#6366F1') {
    const cx = 130, cy = 130, maxR = 100, levels = 5, numAxes = dims.length
    const angleStep = (2 * Math.PI) / numAxes
    function pt(i, r) { const a = angleStep * i - Math.PI / 2; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) } }
    let rings = '', axes = '', poly = '', labels = ''
    for (let l = 1; l <= levels; l++) {
      const r = (maxR / levels) * l
      rings += `<polygon points="${dims.map((_, i) => pt(i, r)).map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#E5E7EB" stroke-width="${l === levels ? 1.5 : 0.5}"/>`
    }
    dims.forEach((d, i) => {
      const ep = pt(i, maxR)
      axes += `<line x1="${cx}" y1="${cy}" x2="${ep.x}" y2="${ep.y}" stroke="#E5E7EB" stroke-width="0.5"/>`
      const dp = pt(i, maxR * Math.min(1, d.value / d.maxValue))
      poly += `${i === 0 ? '' : ' '}${dp.x},${dp.y}`
      const lp = pt(i, maxR + 22)
      labels += `<text x="${lp.x}" y="${lp.y + 3}" text-anchor="middle" font-size="16" fill="#374151">${d.label}</text>`
    })
    return `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg">
      ${rings}${axes}
      <polygon points="${poly}" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="2"/>
      ${labels}
    </svg>`
  }

  const DIM_NAMES = { strategic_breakthrough: '战略破局力', execution_disruption: '执行颠覆力', resource_integration: '资源整合力', adversity_quotient: '逆商与灰度', ethics_vision: '伦理与格局' }

  // 维度解读 — 新版优势视角结构，兼容旧版
  const dimIdxMap = { strategic_breakthrough: 1, execution_disruption: 2, resource_integration: 3, adversity_quotient: 4, ethics_vision: 5 }
  let dimsHTML = dimInsights.map(d => {
    const dimIdx = dimIdxMap[d.dimensionKey] || 0
    const dimName = d.dimensionName || DIM_NAMES[d.dimensionKey] || d.dimensionKey
    const hasNewFields = !!d.coreStrength

    // 条目得分表（全量 entryAnalysis）
    const entries = (d.entryAnalysis || []).map(e =>
      `<tr><td style="text-align:center">${e.sequence}</td><td>${e.text}</td><td style="text-align:center;font-weight:700">${e.score}</td><td style="font-size: 16px;color:#6B7280">${e.comment || ''}</td></tr>`
    ).join('')

    // 条目亮点（新版 entryHighlights）
    let highlightsHTML = ''
    if (hasNewFields && d.entryHighlights?.length) {
      highlightsHTML = `
        <div style="margin:10px 0">
          <p style="font-size: 16px;color:#6366F1;font-weight:600;margin-bottom:4px">✦ 条目亮点</p>
          ${d.entryHighlights.map(eh => `
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:3px;font-size: 16px">
              <span style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:4px;background:#D1FAE5;color:#047857;font-size: 16px;font-weight:700;flex-shrink:0">${eh.score}</span>
              <span style="color:#4B5563">${eh.text}</span>
            </div>
          `).join('')}
        </div>`
    }

    // 核心优势 + 成长空间（新版），或 analysis（旧版兼容）
    let bodyHTML = ''
    if (hasNewFields) {
      if (d.coreStrength) {
        bodyHTML += `<div style="background:#EEF2FF;border:1px solid #E0E7FF;border-radius:6px;padding:10px 14px;margin-bottom:8px"><p style="font-size: 16px;color:#4F46E5;font-weight:700;margin-bottom:2px">◈ 您独到的地方（别人没有的）</p><p>${renderRichText(d.coreStrength)}</p></div>`
      }
      if (d.growthSpace) {
        bodyHTML += `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;margin-bottom:8px"><p style="font-size: 16px;color:#D97706;font-weight:700;margin-bottom:2px">◈ 您的成长空间（木桶的短板在这里）</p><p>${renderRichText(d.growthSpace)}</p></div>`
      }
      if (d.careerInsight) {
        bodyHTML += `<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:10px 14px;margin-top:8px"><p style="font-size: 16px;color:#6B7280;font-weight:700;margin-bottom:2px">◈ 这个维度对您的真实含义</p><p style="font-size: 16px;color:#4B5563">${renderRichText(d.careerInsight)}</p></div>`
      }
    } else {
      // 旧版兼容
      bodyHTML += `<p>${renderRichText(d.analysis || d.interpretation || '')}</p>`
      if (d.impactOnSuccession || d.suggestion) {
        bodyHTML += `<p style="margin-top:8px;font-size: 16px;color:#4B5563"><strong>职业方向启示：</strong>${renderRichText(d.impactOnSuccession || d.suggestion)}</p>`
      }
    }

    return `<div class="section">
      <h2>3.${dimIdx} ${dimName} <span class="level-tag">${d.level || ''} · ${d.score}/5</span></h2>
      <div style="margin-bottom:6px"><span style="font-size: 16px;color:#6366F1;background:#EEF2FF;padding:2px 8px;border-radius:10px">${d.tier || ''}</span></div>
      ${bodyHTML}
      ${hasNewFields ? highlightsHTML : ''}
      ${entries ? `<table><thead><tr><th style="width:40px">#</th><th>条目</th><th style="width:40px">得分</th><th style="width:200px">解读</th></tr></thead><tbody>${entries}</tbody></table>` : ''}
    </div>`
  }).join('')

  // 四、木桶原理诊断
  const barrel = data.barrelPrinciple || {}
  let barrelHTML = ''
  if (barrel.longBoards?.length || barrel.shortBoards?.length) {
    barrelHTML = `<div class="section" style="page-break-before:always"><h2>四、木桶原理诊断 · 您的核心竞争力模型</h2>`

    if (barrel.longBoards?.length) {
      barrelHTML += `<h3 style="color:#059669">您的长板（核心竞争力）</h3>
      <table><thead><tr><th>长板</th><th style="width:60px;text-align:center">得分</th><th>核心优势描述</th></tr></thead><tbody>
      ${barrel.longBoards.map(lb => `<tr><td style="font-weight:700">${lb.name}</td><td style="text-align:center;font-weight:700;color:#059669">${(lb.score || 0).toFixed(1)}</td><td style="font-size: 16px;color:#6B7280">${lb.description || ''}</td></tr>`).join('')}
      </tbody></table>`
    }

    if (barrel.shortBoards?.length) {
      barrelHTML += `<h3 style="color:#D97706;margin-top:16px">您的短板（需定向补齐）</h3>
      <table><thead><tr><th>短板</th><th style="width:60px;text-align:center">得分</th><th>补板路径</th></tr></thead><tbody>
      ${barrel.shortBoards.map(sb => `<tr><td style="font-weight:700">${sb.name}</td><td style="text-align:center;font-weight:700;color:#DC2626">${(sb.score || 0).toFixed(1)}</td><td style="font-size: 16px;color:#6B7280">${sb.fixPath || ''}</td></tr>`).join('')}
      </tbody></table>`
    }

    if (barrel.coreCompetitiveness) {
      barrelHTML += `<div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:12px 16px;margin-top:12px;text-align:center"><p style="font-size: 16px;color:#6366F1;font-weight:600;margin-bottom:4px">您的核心竞争力一句话总结</p><p style="font-weight:700;color:#3730A3">${barrel.coreCompetitiveness}</p></div>`
    }

    barrelHTML += `</div>`
  }

  // 五、发展建议
  let devHTML = ''
  if (dev.integratedJudgment?.tierSummary) {
    devHTML += `<div class="section"><h2>5.1 层级综合分析</h2><p>${renderRichText(dev.integratedJudgment.tierSummary)}</p></div>`
  }
  if (dev.developmentDirection) {
    devHTML += `<div class="section"><h2>5.2 整体发展方向</h2><p>${renderRichText(dev.developmentDirection)}</p></div>`
  }
  if (dev.capabilityImprovements?.length) {
    devHTML += `<div class="section"><h2>5.3 能力提升建议</h2>` +
      dev.capabilityImprovements.map(ci =>
        `<div class="career-card"><h4>▌${ci.dimensionName} · ${ci.direction}</h4><p style="font-size: 16px;color:#6B7280">${renderRichText(ci.reason || '')}</p></div>`
      ).join('') + `</div>`
  }
  // 补充建议：培训 + 孵化器
  const supp = dev.supplementarySuggestions || {}
  if (supp.targetedTraining || supp.talentIncubator) {
    devHTML += `<div class="section"><h2>5.4 补充建议：职业培训与人才孵化</h2>`
    if (supp.targetedTraining) {
      devHTML += `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;padding:10px 14px;margin-bottom:8px"><p style="font-size: 16px;color:#2563EB;font-weight:700;margin-bottom:2px">① 针对性职业培训（精准补短板）</p><p style="font-size: 16px;color:#4B5563">${renderRichText(supp.targetedTraining)}</p></div>`
    }
    if (supp.talentIncubator) {
      devHTML += `<div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:6px;padding:10px 14px"><p style="font-size: 16px;color:#7C3AED;font-weight:700;margin-bottom:2px">② 人才定制孵化器（加速成长通道）</p><p style="font-size: 16px;color:#4B5563">${renderRichText(supp.talentIncubator)}</p></div>`
    }
    devHTML += `</div>`
  }
  if (dev.stakeholderAdvice) {
    devHTML += `<div class="section"><h2>5.5 利益相关者沟通建议</h2><p>${renderRichText(dev.stakeholderAdvice)}</p></div>`
  }

  // 职业发展核心潜能与路径建议
  let careerPathHTML = ''
  if (cpa.corePotentialDiagnosis) {
    const pathColorMap = {
      '立即继承家业': { bg: '#FEF2F2', border: '#FECACA', label: '低适配' },
      '自主创业（外部独立）': { bg: '#FFFBEB', border: '#FDE68A', label: '中低适配' },
      '选择性就业 / 外部机构历练': { bg: '#ECFDF5', border: '#A7F3D0', label: '当前最优解' },
    }

    careerPathHTML = `
    <div class="section" style="page-break-before:always">
      <h2>职业发展核心潜能与路径建议</h2>

      <div style="margin-bottom:16px">
        <h3>核心潜能诊断</h3>
        <div style="display:inline-block;background:#EEF2FF;color:#4338CA;font-weight:700;font-size: 16px;padding:6px 16px;border-radius:6px;margin:8px 0">${cpa.corePotentialDiagnosis || ''}</div>
        ${cpa.corePotentialDescription ? `<p>${renderRichText(cpa.corePotentialDescription)}</p>` : ''}
      </div>

      ${cpa.pathEvaluations?.length ? `
      <div style="margin-bottom:16px">
        <h3>三大路径适配度深度评估</h3>
        ${cpa.pathEvaluations.map(pe => {
          const colors = pathColorMap[pe.path] || { bg: '#F9FAFB', border: '#E5E7EB', label: '' }
          return `<div style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px 16px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <h4 style="font-size: 16px;color:#1A1A2E;margin:0">${pe.path}</h4>
              <div>
                ${colors.label ? `<span style="font-size: 16px;color:#6B7280;margin-right:6px">${colors.label}</span>` : ''}
                <span style="font-size: 16px;color:#F59E0B;font-weight:700;letter-spacing:2px">${pe.rating || ''}</span>
              </div>
            </div>
            <table style="margin:0;font-size: 16px">
              <tr><td style="width:60px;font-weight:600;color:#6B7280">适配依据</td><td>${pe.basis || ''}</td></tr>
              <tr><td style="width:60px;font-weight:600;color:#6B7280">风险提示</td><td style="color:#6B7280">${pe.risk || ''}</td></tr>
            </table>
          </div>`
        }).join('')}
      </div>` : ''}

      ${cpa.roadmap?.length ? `
      <div style="margin-bottom:16px">
        <h3>终极发展路线图（分阶段策略）</h3>
        <div style="position:relative;padding-left:24px">
          ${cpa.roadmap.map((phase, i) => `
            <div style="position:relative;border-left:2px solid #A5B4FC;padding:0 0 16px 20px;${i === cpa.roadmap.length - 1 ? 'border-left-color:transparent;' : ''}">
              <div style="position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:#6366F1;border:2px solid white"></div>
              <div style="margin-bottom:4px">
                <span style="font-size: 16px;font-weight:700;color:#4F46E5;background:#EEF2FF;padding:2px 8px;border-radius:4px">${phase.timeline || ''}</span>
                <span style="font-size: 16px;color:#9CA3AF;margin-left:6px">${phase.phase || ''}</span>
              </div>
              <h4 style="font-size: 16px;color:#1A1A2E;margin:0 0 4px">${phase.title || ''}</h4>
              <p style="font-size: 16px;color:#4B5563;margin:0 0 4px">${phase.goal || ''}</p>
              ${phase.recommendation ? `<p style="font-size: 16px;color:#6B7280;margin:0 0 4px"><strong>推荐去向：</strong>${phase.recommendation}</p>` : ''}
              ${phase.coreTasks?.length ? `<ul style="margin:0;padding-left:16px;font-size: 16px;color:#6B7280">${phase.coreTasks.map(t => `<li style="margin-bottom:2px">${t}</li>`).join('')}</ul>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${cpa.ultimateConclusion ? `
      <div style="text-align:center;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border:1px solid #A5B4FC;border-radius:10px;padding:16px 20px">
        <p style="font-size: 16px;color:#6366F1;font-weight:600;margin-bottom:4px">一句话终极结论</p>
        <p style="font-size:18px;font-weight:700;color:#3730A3;margin:0">${cpa.ultimateConclusion}</p>
      </div>` : ''}
    </div>`
  }

  // 雷达图数据
  const radarDims = ['strategic_breakthrough', 'execution_disruption', 'resource_integration', 'adversity_quotient', 'ethics_vision']
    .map(k => ({ label: DIM_NAMES[k] || k, value: (data.midsF2Scores || mids.dimensionAverages || {})[k] || 0, maxValue: 5 }))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>MIDS-F2 创新力测评报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #1A1A2E; font-size: 16px; line-height: 1.7; }
    .page { padding: 30px 40px; max-width: 750px; margin: 0 auto; }
    .cover { text-align: center; background: #1E3A5F; color: white; border-radius: 12px; padding: 45px 30px; margin-bottom: 30px; }
    .cover h1 { font-size: 24px; margin-bottom: 10px; font-weight: 700; }
    .cover p { font-size: 18px; opacity: 0.85; margin-bottom: 3px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section h2 { font-size: 20px; color: #1E3A5F; border-bottom: 2px solid #CBD5E1; padding-bottom: 6px; margin-bottom: 12px; }
    .section h3 { font-size: 18px; color: #374151; margin: 10px 0 6px; }
    .highlight { background: #F1F5F9; border-radius: 6px; padding: 10px 14px; font-weight: 600; color: #1E3A5F; margin: 8px 0; }
    .level-tag { font-size: 16px; font-weight: 400; color: #64748B; margin-left: 8px; }
    .chart-center { display: flex; justify-content: center; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 16px; }
    th, td { padding: 6px 10px; border: 1px solid #E5E7EB; text-align: left; }
    th { background: #F9FAFB; font-weight: 600; color: #374151; }
    .career-card { background: #F9FAFB; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; border-left: 3px solid #94A3B8; }
    .career-card h4 { font-size: 16px; color: #1E3A5F; margin-bottom: 4px; }
    .footer { text-align: center; font-size: 16px; color: #9CA3AF; margin-top: 30px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
    @page { size: A4; margin: 12mm; }
    @media print {
      html { font-size: 18px; }
      body { font-size: 16px; }
      .section { page-break-inside: avoid; }
      h2, h3 { break-after: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <h1>家族二代多维创新力量表（MIDS-F2）</h1>
      <p>${data.userName || '测评用户'}</p>
      ${(data.education || data.graduationIntention || data.major) ? `<p>${data.education ? '学历：' + data.education : ''}${data.education && data.graduationIntention ? ' &nbsp;|&nbsp; ' : ''}${data.graduationIntention ? '就职意向：' + data.graduationIntention : ''}${(data.education || data.graduationIntention) && data.major ? ' &nbsp;|&nbsp; ' : ''}${data.major ? '专业：' + data.major : ''}</p>` : ''}
      <p>报告编号：MIDS-F2-${data.reportId || ''} | 等级：${co.scoreLabel || ''} | 总分：${co.totalScore || data.comprehensiveScore || 0}/100</p>
    </div>

    ${data.frameworkExplanation ? `<div class="section"><h2>一、认识你自己</h2>${data.uniqueGene ? `<div style="display:inline-block;background:#EEF2FF;color:#4338CA;font-weight:700;font-size: 16px;padding:6px 16px;border-radius:8px;margin-bottom:12px">您的独特基因：${data.uniqueGene}</div>` : ''}<p>${data.frameworkExplanation}</p></div>` : ''}

    <div class="section">
      <h2>二、五维雷达图解读</h2>

      <div class="chart-center">${gaugeSVG(co.totalScore || data.comprehensiveScore || mids.totalScore || 0)}</div>
      <p style="text-align:center"><strong>等级：</strong>${co.scoreLabel || ''} | <strong>总分：</strong>${co.totalScore || data.comprehensiveScore || 0}/100</p>
      ${spf.decisionPath ? `<p style="text-align:center;margin-top:4px;font-size: 16px;font-weight:700;color:#64748B">${spf.decisionEmoji || ''} ${spf.decisionLabel || ''}</p>` : ''}

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />

      <h3>五维雷达图</h3>
      <div class="chart-center">${radarSVG(radarDims)}</div>

      ${data.dimensionOverview?.length ? `
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
      <h3>维度速查定位</h3>
      <table><thead><tr><th>维度</th><th style="width:60px;text-align:center">得分</th><th>定位</th></tr></thead><tbody>
      ${data.dimensionOverview.map(dim => `<tr><td style="font-weight:600">${dim.dimensionName}</td><td style="text-align:center;font-weight:700">${dim.score.toFixed(1)}</td><td style="font-size: 16px;color:#6B7280">${dim.position}</td></tr>`).join('')}
      </tbody></table>` : ''}

      ${co.overallAssessment ? `<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" /><p>${renderRichText(co.overallAssessment)}</p>` : ''}
    </div>

    <div class="section" style="page-break-before:always">
      <h2>三、维度深度解读</h2>
      ${dimsHTML}
    </div>

    ${barrelHTML}

    ${devHTML ? `<div class="section" style="page-break-before:always"><h2>五、发展建议（个性化版）</h2>${devHTML}</div>` : ''}

    ${data.summary ? `<div class="section"><h2>六、总结与展望</h2><p>${renderRichText(data.summary)}</p></div>` : ''}

    ${careerPathHTML}

    <div class="footer">
      <p>本报告由「潜能星图」测评系统生成 | CONFIDENTIAL</p>
    </div>
  </div>
</body>
</html>`
}

// ============ 原有 LZU / 通用报告模板 ============

function buildReportHTML(reportData) {
  const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData

  // MIDS-F2 报告：使用专用模板
  if (data.reportType === 'mids-f2' || data.midsF2Result) {
    return buildMidsF2ReportHTML(data)
  }

  // ============ 原有 LZU / 通用报告模板 ============

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
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${cx + r * Math.cos(rad(endAngle))} ${cy + r * Math.sin(rad(endAngle))}"
            fill="none" stroke="#E5E7EB" stroke-width="14" stroke-linecap="round"/>
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${currentAngle - startAngle > 180 ? 1 : 0} 1 ${xe} ${ye}"
            fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="28" font-weight="800" fill="${color}">${score}</text>
      <text x="${cx - 70}" y="${cy + 55}" text-anchor="middle" font-size="16" fill="#9CA3AF">65</text>
      <text x="${cx + 70}" y="${cy + 55}" text-anchor="middle" font-size="16" fill="#9CA3AF">85</text>
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
      labels += `<text x="${lp.x}" y="${lp.y + 3}" text-anchor="middle" font-size="16" fill="#374151">${d.label}</text>`
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
    body { font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif; color: #1A1A2E; font-size: 16px; line-height: 1.7; }
    .page { padding: 30px 40px; max-width: 750px; margin: 0 auto; }
    .cover { text-align: center; background: linear-gradient(135deg, #1E3A5F, #2D5A8E); color: white; border-radius: 16px; padding: 50px 30px; margin-bottom: 30px; }
    .cover h1 { font-size: 24px; margin-bottom: 12px; }
    .cover p { font-size: 16px; opacity: 0.8; margin-bottom: 4px; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section h2 { font-size: 17px; color: #1E3A5F; border-bottom: 2px solid #F4C550; padding-bottom: 6px; margin-bottom: 14px; }
    .section h3 { font-size: 16px; color: #374151; margin: 10px 0 8px; }
    .highlight { background: #EEF2FF; border-radius: 8px; padding: 10px 14px; font-weight: 600; color: #1E3A5F; margin: 8px 0; }
    .chart-center { display: flex; justify-content: center; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 16px; }
    th, td { padding: 8px 10px; border: 1px solid #E5E7EB; text-align: left; }
    th { background: #F9FAFB; font-weight: 600; color: #374151; }
    .dim-name { font-weight: 600; color: #1E3A5F; }
    .dim-score { font-weight: 700; color: #6366F1; text-align: center; }
    .advantage-card { background: #EEF2FF; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; border: 1px solid #E0E7FF; }
    .advantage-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .advantage-title { font-weight: 700; color: #1E3A5F; }
    .advantage-score { font-size: 16px; font-weight: 700; color: #6366F1; background: white; padding: 2px 10px; border-radius: 12px; }
    .advantage-desc { font-size: 16px; color: #6B7280; }
    .mbti-badge { display: inline-block; font-size: 32px; font-weight: 800; color: #6366F1; background: #EEF2FF; padding: 12px 28px; border-radius: 14px; margin: 10px 0; }
    .career-card { background: #F9FAFB; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; border-left: 3px solid #F4C550; }
    .career-card h4 { font-size: 16px; color: #1E3A5F; margin-bottom: 4px; }
    .career-card p { font-size: 16px; color: #6B7280; }
    .team-role { text-align: center; background: #EEF2FF; border-radius: 12px; padding: 16px; margin: 8px 0; }
    .role-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: #6366F1; color: white; font-weight: 700; font-size: 16px; margin: 0 6px; }
    .role-badge.secondary { background: #A5B4FC; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .footer { text-align: center; font-size: 16px; color: #9CA3AF; margin-top: 30px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
    @page { size: A4; margin: 12mm; }
    @media print {
      html { font-size: 18px; }
      body { font-size: 16px; }
      .section { page-break-inside: avoid; }
      h2, h3 { break-after: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    }
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
      <p>本报告由「潜能星图」测评系统生成 | CONFIDENTIAL</p>
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
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    const html = buildReportHTML(reportData)
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 })

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
