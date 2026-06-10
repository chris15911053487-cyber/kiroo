/**
 * 兰大综合报告 — 固定HTML模版
 *
 * ⚠️ 严格约束：此模版的CSS、模块顺序、表格结构、图表样式全部锁定。
 * 仅 {scores}、{aiText}、{charts} 为动态数据。
 * 排版、字体、字号、颜色、间距、圆角均不可变。
 * 参考模版：docs/report-system/02-报告模版/报告模版初版.html
 */

function buildReportHTML({ scores, aiText, charts, userName, sessionId }) {
  const now = new Date();
  const reportId = `LZU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sessionId).padStart(3, '0')}`;
  const reportDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const breakdown = scores.breakdown;

  // CSS水平条形图数据
  const personalityBarHtml = `
    <div class="bar-item"><span class="bar-label">创造力潜质</span><div class="bar-bg"><div class="bar-fill" style="width:${p.creativityPotential.raw * 10}%;">${p.creativityPotential.raw}</div></div></div>
    <div class="bar-item"><span class="bar-label">心理健康</span><div class="bar-bg"><div class="bar-fill" style="width:${p.mentalHealth.raw * 10}%;">${p.mentalHealth.raw}</div></div></div>
    <div class="bar-item"><span class="bar-label">管理潜能</span><div class="bar-bg"><div class="bar-fill" style="width:${p.managementPotential.raw * 10}%;">${p.managementPotential.raw}</div></div></div>`;

  const barrierBarHtml = `
    <div class="bar-item"><span class="bar-label">心理障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${(b.psychological.score / b.psychological.max * 100).toFixed(0)}%; background:#2c5f8a;">${b.psychological.score}/${b.psychological.max}</div></div></div>
    <div class="bar-item"><span class="bar-label">认知障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${(b.cognitive.score / b.cognitive.max * 100).toFixed(0)}%; background:#2c5f8a;">${b.cognitive.score}/${b.cognitive.max}</div></div></div>
    <div class="bar-item"><span class="bar-label">环境与资源障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${(b.environmental.score / b.environmental.max * 100).toFixed(0)}%; background:#2c5f8a;">${b.environmental.score}/${b.environmental.max}</div></div></div>`;

  // 障碍程度emoji
  function barrierEmoji(level) { return level === '低障碍' ? '✅' : level === '中障碍' ? '⚠️' : '🔴'; }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
<title>职业发展测评报告：${userName}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #eef2f5; font-family: 'Segoe UI', 'Roboto', 'Georgia', 'Times New Roman', serif; padding: 48px 32px; color: #1e2f3e; }
  .formal-report { max-width: 1280px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05); padding: 40px 48px; border: 1px solid #e2edf2; }
  @media (max-width: 760px) { body { padding: 20px 12px; } .formal-report { padding: 24px 20px; } }
  h1 { font-size: 1.9rem; font-weight: 600; margin-bottom: 16px; color: #1e4663; border-left: 4px solid #eab308; padding-left: 20px; }
  h2 { font-size: 1.5rem; font-weight: 600; margin: 1.8rem 0 1rem 0; padding-bottom: 6px; border-bottom: 2px solid #e9edf2; color: #1e4663; }
  h3 { font-size: 1.2rem; font-weight: 600; margin: 1.4rem 0 0.8rem 0; color: #2c5a7a; }
  .info-section { margin: 20px 0 28px 0; }
  .info-line { font-size: 0.9rem; margin-bottom: 8px; color: #2c3e50; }
  .badge { display: inline-block; background: #eef2f8; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; color: #2c5f8a; }
  .score-row { display: flex; flex-wrap: nowrap; gap: 28px; margin: 20px 0 16px 0; align-items: baseline; overflow-x: auto; }
  .score-block { background: #f8fafc; border-radius: 24px; padding: 8px 18px; border: 1px solid #e2edf2; text-align: center; min-width: 130px; flex-shrink: 0; }
  .score-number-lg { font-size: 1.9rem; font-weight: 800; color: #1e4663; line-height: 1; }
  .score-label { font-size: 0.7rem; color: #5f6f82; }
  table { width: 100%; border-collapse: collapse; margin: 1.2rem 0; font-size: 0.85rem; background: #ffffff; border-radius: 8px; overflow: hidden; }
  th, td { border: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: top; text-align: left; }
  th { background: #f8fafd; font-weight: 600; color: #1e3a5f; }
  .insight-box { background: #f8fafc; padding: 14px 18px; margin: 16px 0; font-size: 0.9rem; line-height: 1.45; color: #2c3e50; border-radius: 8px; }
  .insight-box p { text-indent: 2em; margin-bottom: 0.6em; }
  .insight-box p:last-child { margin-bottom: 0; }
  .note-meta { background: #f9f9fb; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 0.85rem; }
  .progress-container { background: #e2e8f0; border-radius: 12px; height: 10px; width: 100%; margin: 12px 0; }
  .progress-fill { background: #2c5f8a; width: 0%; height: 10px; border-radius: 12px; }
  .graph-card { margin: 20px 0; padding: 16px; border: 1px solid #e2edf2; border-radius: 12px; background: #ffffff; }
  .graph-title { font-size: 0.85rem; font-weight: 600; color: #2c5a7a; margin-bottom: 12px; text-align: center; }
  .small-meta { font-size: 0.7rem; color: #5f6f82; margin-top: 8px; text-align: center; }
  .horizontal-bar-container { margin: 12px 0; }
  .bar-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 0.85rem; }
  .bar-label { width: 140px; font-weight: 500; }
  .bar-bg { flex: 1; background: #e2e8f0; border-radius: 10px; height: 24px; overflow: hidden; margin-left: 10px; }
  .bar-fill { background: #2c5f8a; height: 100%; width: 0%; border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 0.7rem; font-weight: 500; }
  footer { margin-top: 40px; padding-top: 20px; text-align: center; font-size: 0.75rem; color: #6b7b8f; border-top: 1px solid #e2edf2; }
  @media (max-width: 850px) {
    .score-row { gap: 16px; }
    .score-block { padding: 6px 12px; min-width: 110px; }
    .score-number-lg { font-size: 1.5rem; }
  }
  .action-table td:first-child { white-space: nowrap; }
  .action-table td, .action-table th { font-size: 0.85rem; }
  .card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #1e4663; border-left: 3px solid #eab308; padding-left: 12px; }
  .radar-canvas-wrapper { display: flex; justify-content: center; margin: 10px 0; }
  canvas#leadershipRadarChart { max-width: 400px; max-height: 400px; width: 100%; height: auto; }
</style>
</head>
<body>
<div class="formal-report">

  <!-- ===== 报告头部 ===== -->
  <h1>职业发展测评报告：${userName} 研究生综合评估</h1>
  <div class="info-section">
    <div class="info-line"><span class="badge">报告编号：${reportId}</span> &nbsp;&nbsp;<span class="badge">测评对象：${userName}</span></div>
    <div class="info-line">测评日期：${reportDate}</div>
    <div class="info-line" style="margin-top:16px; font-weight:500;">测评工具：LASI领导风格问卷 + 16PF精选版（创造力潜质/心理健康/管理潜能） + 创造力障碍测试，综合权重：领导风格30% | 16PF人格特质40% | 创造力障碍30%</div>
  </div>

  <!-- ===== 综合得分概览 ===== -->
  <div class="score-row">
    <div class="score-block"><div class="score-number-lg">${scores.totalScore}</div><div class="score-label">综合发展指数</div></div>
    <div class="score-block"><div class="score-number-lg">${breakdown.leadership}<span style="font-size:1rem;">/30</span></div><div class="score-label">领导风格</div></div>
    <div class="score-block"><div class="score-number-lg">${breakdown.personality}<span style="font-size:1rem;">/40</span></div><div class="score-label">16PF人格特质</div></div>
    <div class="score-block"><div class="score-number-lg">${breakdown.creativityBarrier}<span style="font-size:1rem;">/30</span></div><div class="score-label">创造力障碍</div></div>
  </div>

  <!-- ===== 一、总体画像 ===== -->
  <h2>一、总体画像</h2>
  <table>
    <tbody>
      <tr><th width="20%">突出优势</th><td>${aiText.profileAdvantages || '根据测评数据自动生成'}</td></tr>
      <tr><th>优先发展项</th><td>${aiText.profileDevelopments || '根据测评数据自动生成'}</td></tr>
      <tr><th>主导领导风格</th><td>${l.dominantStyle}为主，情境适应性${scores.adaptabilityLevel}（指数: ${scores.adaptabilityIndex}）</td></tr>
      <tr><th>目标定位关键差异</th><td>从"个人执行"到"团队引领"；从"单一技能"到"多维管理能力"；从"被动适应"到"主动塑造职业路径"</td></tr>
    </tbody>
  </table>

  <!-- ===== 二、领导风格分析 ===== -->
  <h2>二、领导风格分析</h2>
  <h3>风格强度得分与主导风格</h3>
  <table>
    <thead><tr><th>领导风格类型</th><th>得分</th><th>满分</th><th>强度水平</th><th>行为特征描述</th></tr></thead>
    <tbody>
      <tr><td>指令型 (S1)${l.s1 >= 5 ? ' ⭐' : ''}</td><td>${l.s1}</td><td>7</td><td>${l.s1 >= 5 ? '高' : l.s1 >= 3 ? '中等' : '偏低'}</td><td>结构化指导，适合新手或紧急任务</td></tr>
      <tr><td>教练型 (S2)${l.dominantStyle.includes('S2') ? ' ⭐ 主导风格' : ''}</td><td>${l.s2}</td><td>12</td><td>${l.s2 >= 8 ? '高' : l.s2 >= 5 ? '中等' : '偏低'}</td><td>高任务+高关系，既指导工作也注重成长</td></tr>
      <tr><td>支持型 (S3)${l.dominantStyle.includes('S3') ? ' ⭐ 辅助风格' : ''}</td><td>${l.s3}</td><td>12</td><td>${l.s3 >= 8 ? '较高' : l.s3 >= 5 ? '中等' : '偏低'}</td><td>高关系低任务，营造参与感与凝聚力</td></tr>
      <tr><td>授权型 (S4)</td><td>${l.s4}</td><td>12</td><td>${l.s4 >= 8 ? '高' : l.s4 >= 5 ? '中等' : '偏低'}</td><td>低任务低关系，对成熟团队充分放权</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">领导风格雷达图：相对强度百分比（满分标准化对比）</div>
    <div class="radar-canvas-wrapper">
      <canvas id="leadershipRadarChart" width="400" height="400" style="max-width:100%; height:auto;"></canvas>
    </div>
    <div class="small-meta">各风格维度基于满分换算为百分比：指令型(${l.s1}/${7}≈${Math.round(l.s1/7*100)}%)、教练型(${l.s2}/${12}≈${Math.round(l.s2/12*100)}%)、支持型(${l.s3}/${12}=${Math.round(l.s3/12*100)}%)、授权型(${l.s4}/${12}=${Math.round(l.s4/12*100)}%)；${l.dominantStyle}突出，情境适应性${scores.adaptabilityLevel}</div>
  </div>

  <div class="insight-box">
    <div class="card-title">领导风格综合结论</div>
    ${aiText.leadershipInterpretation ? `<p>${aiText.leadershipInterpretation.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>

  <!-- ===== 三、16PF人格测验 ===== -->
  <h2>三、16PF人格测验</h2>
  <h3>核心维度得分及评价</h3>
  <table>
    <thead><tr><th>16PF核心维度</th><th>得分(满分10)</th><th>标准分(1-10)</th><th>评价等级</th><th>子维度权重</th></tr></thead>
    <tbody>
      <tr><td>创造力潜质</td><td>${p.creativityPotential.raw}</td><td>${p.creativityPotential.standard}</td><td>${p.creativityPotential.level}</td><td>40%</td></tr>
      <tr><td>心理健康</td><td>${p.mentalHealth.raw}</td><td>${p.mentalHealth.standard}</td><td>${p.mentalHealth.level}</td><td>30%</td></tr>
      <tr><td>管理潜能</td><td>${p.managementPotential.raw}</td><td>${p.managementPotential.standard}</td><td>${p.managementPotential.level}</td><td>30%</td></tr>
      <tr><td><strong>16PF人格测验总分</strong></td><td colspan="4"><strong>${breakdown.personality} / 40</strong></td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">16PF核心维度得分（满分10）</div>
    <div class="horizontal-bar-container">
      ${personalityBarHtml}
    </div>
    <div class="small-meta">${p.managementPotential.level === '优秀' ? '管理潜能卓越' : ''}${p.creativityPotential.level === '优秀' || p.creativityPotential.level === '良好' ? '，创造力潜质突出' : ''}${p.mentalHealth.level === '优秀' || p.mentalHealth.level === '良好' ? '，心理健康稳定' : ''}</div>
  </div>

  <h3>维度解读与行为锚定</h3>
  <div class="insight-box">
    <div class="card-title">创造力潜质 (${p.creativityPotential.raw}/10 · ${p.creativityPotential.level})</div>
    ${aiText.personality_creativity ? `<p>${aiText.personality_creativity.replace(/\n/g, '</p><p>')}</p>` : (aiText.personalityInterpretation ? `<p>${aiText.personalityInterpretation}</p>` : '<p>暂无解读</p>')}
  </div>
  <div class="insight-box">
    <div class="card-title">心理健康 (${p.mentalHealth.raw}/10 · ${p.mentalHealth.level})</div>
    ${aiText.personality_mentalHealth ? `<p>${aiText.personality_mentalHealth.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">管理潜能 (${p.managementPotential.raw}/10 · ${p.managementPotential.level})</div>
    ${aiText.personality_managementPotential ? `<p>${aiText.personality_managementPotential.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>

  <div class="insight-box">
    <div class="card-title">16PF人格测验综合结论</div>
    ${aiText.personalityInterpretation ? `<p>${aiText.personalityInterpretation.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无综合结论</p>'}
  </div>

  <!-- ===== 四、创造力障碍测试 ===== -->
  <h2>四、创造力障碍测试</h2>
  <h3>障碍类型得分、程度及障碍抵抗水平</h3>
  <table>
    <thead><tr><th>障碍类型</th><th>得分（越高障碍越少）</th><th>满分</th><th>障碍程度</th><th>创造阻力解读</th></tr></thead>
    <tbody>
      <tr><td>心理障碍</td><td>${b.psychological.score}</td><td>${b.psychological.max}</td><td>${b.psychological.level} ${barrierEmoji(b.psychological.level)}</td><td>${b.psychological.level === '低障碍' ? '心理安全感强，敢于表达，较少自我设限' : b.psychological.level === '中障碍' ? '存在一定的自我怀疑或怕失败心理' : '心理阻碍明显，需重点突破'}</td></tr>
      <tr><td>认知障碍</td><td>${b.cognitive.score}</td><td>${b.cognitive.max}</td><td>${b.cognitive.level} ${barrierEmoji(b.cognitive.level)}</td><td>${b.cognitive.level === '低障碍' ? '思维灵活，能多角度思考' : b.cognitive.level === '中障碍' ? '倾向于快速评判方案，对不确定性耐受力一般' : '思维模式较为固化'}</td></tr>
      <tr><td>环境与资源障碍</td><td>${b.environmental.score}</td><td>${b.environmental.max}</td><td>${b.environmental.level} ${barrierEmoji(b.environmental.level)}</td><td>${b.environmental.level === '低障碍' ? '环境支持有力，资源充足' : b.environmental.level === '中障碍' ? '创新时间碎片化，外部支持资源待激活' : '环境制约较大，需主动寻求资源'}</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">创造力障碍横向对比（得分越高表示该维度障碍越小）</div>
    <div class="horizontal-bar-container">
      ${barrierBarHtml}
    </div>
    <div class="small-meta">${b.primaryBarrierType}是主要制约因素，需优先突破</div>
  </div>

  <h3>维度解读与行为锚定</h3>
  <div class="insight-box">
    <div class="card-title">心理障碍（${b.psychological.level} · 得分${b.psychological.score}/${b.psychological.max}）</div>
    ${aiText.barrier_psychological ? `<p>${aiText.barrier_psychological.replace(/\n/g, '</p><p>')}</p>` : (aiText.barrierInterpretation ? `<p>${aiText.barrierInterpretation}</p>` : '<p>暂无解读</p>')}
  </div>
  <div class="insight-box">
    <div class="card-title">认知障碍（${b.cognitive.level} · 得分${b.cognitive.score}/${b.cognitive.max}）</div>
    ${aiText.barrier_cognitive ? `<p>${aiText.barrier_cognitive.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">环境与资源障碍（${b.environmental.level} · 得分${b.environmental.score}/${b.environmental.max}）</div>
    ${aiText.barrier_environmental ? `<p>${aiText.barrier_environmental.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>

  <div class="insight-box">
    <div class="card-title">创造力障碍综合结论</div>
    ${aiText.barrierInterpretation ? `<p>${aiText.barrierInterpretation.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无综合结论</p>'}
  </div>

  ${aiText.barrierSuggestions ? `
  <div class="insight-box">
    <div class="card-title">突破建议</div>
    <p>${aiText.barrierSuggestions.replace(/\n/g, '</p><p>')}</p>
  </div>` : ''}

  <!-- ===== 五、综合评分汇总与等级判定 ===== -->
  <h2>五、综合评分汇总与等级判定</h2>
  <table>
    <thead><tr><th>测评模块</th><th>加权得分</th><th>满分</th><th>权重</th><th>实际贡献</th></tr></thead>
    <tbody>
      <tr><td>领导风格</td><td>${breakdown.leadership}</td><td>30</td><td>30%</td><td>${breakdown.leadership}</td></tr>
      <tr><td>16PF人格特质（16PF精选版）</td><td>${breakdown.personality}</td><td>40</td><td>40%</td><td>${breakdown.personality}</td></tr>
      <tr><td>创造力障碍抵抗</td><td>${breakdown.creativityBarrier}</td><td>30</td><td>30%</td><td>${breakdown.creativityBarrier}</td></tr>
      <tr><td><strong>综合总分</strong></td><td><strong>${scores.totalScore}</strong></td><td><strong>100</strong></td><td>—</td><td><strong>${scores.totalScore}</strong></td></tr>
    </tbody>
  </table>
  <div class="progress-container"><div class="progress-fill" style="width:${scores.totalScore}%;"></div></div>

  <div class="insight-box">
    <p><strong>综合诊断：${scores.totalScore}分 —— "${scores.grade}"等级（${getGradeRangeText(scores.grade)}分）</strong><br>${aiText.comprehensiveDiagnosis || '暂无综合诊断'}</p>
    <p>等级定义：卓越型(90-100) | 进取型(75-89) | 成长型(60-74) | 待发展型(60以下)。当前处于${scores.grade}，${scores.gradeDescription}。</p>
  </div>

  <!-- ===== 六、职业发展建议与行动计划 ===== -->
  <h2>六、职业发展建议与行动计划</h2>
  <h3>6.1 推荐职业方向匹配度</h3>
  ${aiText.careerSuggestions ? `
  <table>
    <thead><tr><th>推荐等级</th><th>职业方向</th><th>匹配理由</th></tr></thead>
    <tbody>${aiText.careerSuggestions.split('\n').filter(l => l.includes('|')).map(line => {
      const parts = line.split('|');
      return `<tr><td>${parts[0] || ''}</td><td>${parts[1] || ''}</td><td>${parts[2] || ''}</td></tr>`;
    }).join('')}</tbody>
  </table>` : '<p style="color:#94a3b8;">暂无职业建议</p>'}

  <h3>6.2 能力提升行动计划</h3>
  ${aiText.improvementPlan ? `
  <table class="action-table">
    <thead><tr><th>时间阶段</th><th>具体行动</th><th>成功标准</th></tr></thead>
    <tbody>${parseImprovementPlan(aiText.improvementPlan)}</tbody>
  </table>` : '<p style="color:#94a3b8;">暂无提升计划</p>'}

  <!-- ===== 七、复测与发展追踪建议 ===== -->
  <h2>七、整体综合结论</h2>
  <div class="insight-box">
    <div class="card-title">核心评价</div>
    <p>${aiText.coreEvaluation || '暂无核心评价'}</p>
  </div>
  ${aiText.coreAdvantages ? `
  <div class="insight-box">
    <div class="card-title">核心优势</div>
    <p>${aiText.coreAdvantages.replace(/\n/g, '</p><p>')}</p>
  </div>` : ''}
  <div class="insight-box">
    <div class="card-title">总结与展望</div>
    <p>${aiText.summary || '暂无总结'}</p>
  </div>

  <footer>
    本报告依据兰州大学管理学院职业发展测评系统生成（LASI + 16PF精选版 + 创造力障碍测试），权重与解读符合测评手册标准。结果用于职业规划参考，建议每6-12个月复测追踪发展成效。
  </footer>
</div>

<script>
(function(){
  var canvas = document.getElementById('leadershipRadarChart');
  if (canvas && window.Chart) {
    var rawScores = [${l.s1}, ${l.s2}, ${l.s3}, ${l.s4}];
    var maxScores = [7, 12, 12, 12];
    var percentScores = rawScores.map(function(v, i) { return (v / maxScores[i]) * 100; });
    new Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['指令型 (S1)', '教练型 (S2)', '支持型 (S3)', '授权型 (S4)'],
        datasets: [{
          label: '风格强度百分比 (%)',
          data: percentScores,
          backgroundColor: 'rgba(44, 95, 138, 0.2)',
          borderColor: '#2c5f8a',
          borderWidth: 2,
          pointBackgroundColor: '#eab308',
          pointBorderColor: '#1e4663',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20, callback: function(v) { return v + '%'; }, backdropColor: 'transparent' },
            grid: { color: '#e2e8f0' },
            angleLines: { color: '#e2e8f0' },
            pointLabels: { font: { size: 11, weight: '500' }, color: '#1e4663' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var i = ctx.dataIndex;
                return ['指令型 (S1)', '教练型 (S2)', '支持型 (S3)', '授权型 (S4)'][i] + ': ' + percentScores[i].toFixed(1) + '%  (原始分 ' + rawScores[i] + '/' + maxScores[i] + ')';
              }
            }
          },
          legend: { position: 'top', labels: { font: { size: 11 } } }
        }
      }
    });
  }
})();
</script>
</body>
</html>`;
}

// ======================= 辅助函数 =======================

function getGradeClass(grade) {
  switch (grade) {
    case '卓越型': return 'grade-excellent';
    case '进取型': return 'grade-enterprising';
    case '成长型': return 'grade-growing';
    default: return 'grade-developing';
  }
}

function getGradeRangeText(grade) {
  switch (grade) {
    case '卓越型': return '90-100';
    case '进取型': return '75-89';
    case '成长型': return '60-74';
    default: return '60以下';
  }
}

// 解析AI文本中短期/中期/长期为行动计划表行
function parseImprovementPlan(text) {
  const rows = [];
  const phases = [
    { key: '短期', label: '第1-3个月', match: /短期[（(]0?[～\-]?6个?月[)）]?/ },
    { key: '中期', label: '第4-6个月', match: /中期[（(]6个?月[～\-]?2年?[)）]?/ },
    { key: '长期', label: '第7-12个月', match: /长期[（(]2[～\-]?5年?[)）]?/ },
  ];
  // 简单处理：把整个文本按行分割，找阶段标记
  const lines = text.split('\n');
  let currentPhase = null;
  const actions = {};

  for (const line of lines) {
    for (const phase of phases) {
      if (phase.match.test(line)) { currentPhase = phase.key; actions[currentPhase] = []; break; }
    }
    const trimmed = line.replace(/^[-\s•·]+/, '').trim();
    if (currentPhase && trimmed && !phases.some(p => p.match.test(line))) {
      if (!actions[currentPhase]) actions[currentPhase] = [];
      actions[currentPhase].push(trimmed);
    }
  }

  for (const phase of phases) {
    const acts = actions[phase.key] || [];
    if (acts.length > 0 || phase.key === '短期') {
      rows.push(`<tr><td>${phase.label}</td><td>${acts.join('；') || '根据测评结果制定具体行动'}</td><td>待复测验证</td></tr>`);
    }
  }
  return rows.join('');
}

module.exports = { buildReportHTML };
