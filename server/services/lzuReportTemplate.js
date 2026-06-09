/**
 * 兰大综合报告 — 固定HTML模版
 *
 * 模块顺序、表格结构、CSS样式全部写死。
 * 唯一可变的是：
 *   1. 系统计算的精准分数（scores）
 *   2. AI生成的文字解析（aiText）
 *   3. SVG图表（charts — 由 lzuChartService 生成）
 *
 * 此模版严禁AI修改任何结构与样式。
 * 风格参照：2026.6.9参考版本.html
 */

/**
 * 组装完整HTML报告
 * @param {Object} params
 * @param {Object} params.scores - 系统精准计分结果（LZUComprehensiveResult）
 * @param {Object} params.aiText - AI生成的文字解析
 * @param {Object} params.charts - SVG图表字符串
 * @param {string} params.userName - 测评对象姓名
 * @param {number} params.sessionId - 会话ID
 */
function buildReportHTML({ scores, aiText, charts, userName, sessionId }) {
  const now = new Date();
  const reportId = `LZU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sessionId).padStart(3, '0')}`;
  const reportDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const breakdown = scores.breakdown;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>人才测评报告：${userName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #fff;
    font-family: 'SimSun', '宋体', 'DengXian', '等线', 'Segoe UI', 'Microsoft YaHei', serif;
    color: #1e2f3e;
    padding: 40px 48px;
  }
  .formal-report {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    padding: 40px 48px;
    border: 1px solid #e2edf2;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: #1e4663;
    text-align: center;
  }
  h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 1.8rem 0 0.8rem 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #e9edf2;
    color: #1e4663;
  }
  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 1.4rem 0 0.6rem 0;
    color: #2c5a7a;
  }
  .info-section { margin: 16px 0 24px 0; }
  .info-line {
    font-size: 0.85rem;
    margin-bottom: 6px;
    color: #2c3e50;
  }
  .badge {
    display: inline-block;
    background: #eef2f8;
    padding: 2px 10px;
    font-size: 0.7rem;
    font-weight: 500;
    color: #2c5f8a;
  }
  .score-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin: 16px 0;
    align-items: baseline;
  }
  .score-block {
    background: #f8fafc;
    padding: 8px 16px;
    border: 1px solid #e2edf2;
    text-align: center;
    min-width: 110px;
  }
  .score-number-lg {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1e4663;
    line-height: 1;
  }
  .score-label {
    font-size: 0.7rem;
    color: #5f6f82;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.8rem;
    background: #ffffff;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 8px 12px;
    vertical-align: top;
    text-align: left;
  }
  th {
    background: #f6f8fa;
    font-weight: 700;
    color: #1e3a5f;
    text-align: center;
  }
  .insight-box {
    background: #f8fafc;
    padding: 12px 16px;
    margin: 12px 0;
    font-size: 0.82rem;
    line-height: 1.6;
    color: #2c3e50;
  }
  .note-meta {
    background: #f9f9fb;
    padding: 8px 14px;
    border: 1px solid #e2e8f0;
    margin: 12px 0;
    font-size: 0.78rem;
  }
  .graph-card {
    margin: 16px 0;
    padding: 16px;
    border: 1px solid #e2edf2;
    background: #ffffff;
    text-align: center;
  }
  .graph-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #2c5a7a;
    margin-bottom: 10px;
    text-align: center;
  }
  .small-meta {
    font-size: 0.7rem;
    color: #5f6f82;
    margin-top: 6px;
    text-align: center;
  }
  .grade-badge {
    display: inline-block;
    padding: 4px 16px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
    text-align: center;
    margin-top: 8px;
  }
  .grade-excellent { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .grade-enterprising { background: linear-gradient(135deg, #3b82f6, #4f46e5); }
  .grade-growing { background: linear-gradient(135deg, #10b981, #059669); }
  .grade-developing { background: linear-gradient(135deg, #6b7280, #4b5563); }
  footer {
    margin-top: 32px;
    padding-top: 16px;
    text-align: center;
    font-size: 0.7rem;
    color: #6b7b8f;
    border-top: 1px solid #e2edf2;
  }
</style>
</head>
<body>
<div class="formal-report">

  <!-- ===== 1. 报告头部 ===== -->
  <h1>人才测评报告：${userName} 研究生职业发展评估</h1>
  <div class="info-section">
    <div class="info-line">
      <span class="badge">报告编号：${reportId}</span> &nbsp;&nbsp;
      <span class="badge">测评对象：${userName}</span>
    </div>
    <div class="info-line">测评日期：${reportDate}</div>
    <div class="info-line" style="margin-top:12px; font-weight:500;">
      本次评估使用领导风格量表（LASI）、16PF人格测验（精选版）和创造力障碍测试三工具组合，按预设权重计算综合得分。计分权重为总分100 = 领导风格(30) + 人格特质(40) + 创造力(30)。
    </div>
  </div>

  <!-- ===== 2. 综合得分概览 ===== -->
  <div class="score-row">
    <div class="score-block">
      <div class="score-number-lg">${scores.totalScore}</div>
      <div class="score-label">综合胜任力指数</div>
    </div>
    <div class="score-block">
      <div class="score-number-lg">${breakdown.leadership}<span style="font-size:0.8rem;">/30</span></div>
      <div class="score-label">领导风格 (${Math.round(breakdown.leadership / 30 * 100)}%)</div>
    </div>
    <div class="score-block">
      <div class="score-number-lg">${breakdown.personality}<span style="font-size:0.8rem;">/40</span></div>
      <div class="score-label">人格特质 (${Math.round(breakdown.personality / 40 * 100)}%)</div>
    </div>
    <div class="score-block">
      <div class="score-number-lg">${breakdown.creativityBarrier}<span style="font-size:0.8rem;">/30</span></div>
      <div class="score-label">创造力 · ${Math.round(breakdown.creativityBarrier / 30 * 100)}%</div>
    </div>
  </div>
  <div class="grade-badge ${getGradeClass(scores.grade)}">${scores.grade} · ${scores.gradeDescription}</div>

  <!-- ===== 3. 总体画像 ===== -->
  <h2>一、总体画像</h2>
  <table>
    <tbody>
      <tr><th width="22%">突出优势</th><td>${aiText.profile_advantages || '根据测评数据自动生成'}</td></tr>
      <tr><th>优先发展项</th><td>${aiText.profile_developments || '根据测评数据自动生成'}</td></tr>
      <tr><th>领导风格</th><td>${l.dominantStyle}为主，情境适应性${scores.adaptabilityLevel}（指数: ${scores.adaptabilityIndex}）</td></tr>
      <tr><th>目标定位</th><td>从"个人执行"到"团队引领"；从"单一技能"到"多维管理能力"；从"被动适应"到"主动塑造职业路径"</td></tr>
    </tbody>
  </table>

  <!-- ===== 4. 领导风格模块 ===== -->
  <h2>二、领导风格评分（满分 30 分）</h2>
  <h3>各风格得分</h3>
  <table>
    <thead><tr><th>风格类型</th><th>原始得分</th><th>满分</th><th>行为特征</th></tr></thead>
    <tbody>
      <tr><td>S1 指令型</td><td>${l.s1}</td><td>7</td><td>明确指导、标准流程、密切监督</td></tr>
      <tr><td>S2 教练型</td><td>${l.s2}</td><td>12</td><td>解释决策、双向沟通、关注成长</td></tr>
      <tr><td>S3 支持型</td><td>${l.s3}</td><td>12</td><td>倾听鼓励、参与决策、营造氛围</td></tr>
      <tr><td>S4 授权型</td><td>${l.s4}</td><td>12</td><td>充分信任、结果导向、授予自主权</td></tr>
    </tbody>
  </table>
  <p style="font-size:0.8rem; margin:8px 0;"><strong>主导风格：${l.dominantStyle}</strong> | 情境适应性指数：${scores.adaptabilityIndex}（${scores.adaptabilityLevel}）</p>

  <div class="graph-card">
    <div class="graph-title">领导风格四维雷达图</div>
    ${charts.leadershipRadar}
    <div class="small-meta">各风格得分越均衡，情境适应能力越强。标准差=${scores.adaptabilityIndex}</div>
  </div>

  <div class="graph-card">
    <div class="graph-title">领导风格强度分布</div>
    ${charts.leadershipBar}
  </div>

  <h3>领导风格解读</h3>
  <div class="insight-box">${aiText.leadershipInterpretation || '暂无解读'}</div>

  <!-- ===== 5. 人格特质模块 ===== -->
  <h2>三、人格特质评分（满分 40 分）</h2>
  <h3>各维度得分</h3>
  <table>
    <thead><tr><th>维度</th><th>原始分(0-10)</th><th>标准分</th><th>等级</th><th>权重</th></tr></thead>
    <tbody>
      <tr><td>创造力潜质</td><td>${p.creativityPotential.raw}</td><td>${p.creativityPotential.standard}</td><td>${p.creativityPotential.level}</td><td>40%</td></tr>
      <tr><td>心理健康</td><td>${p.mentalHealth.raw}</td><td>${p.mentalHealth.standard}</td><td>${p.mentalHealth.level}</td><td>30%</td></tr>
      <tr><td>管理潜能</td><td>${p.managementPotential.raw}</td><td>${p.managementPotential.standard}</td><td>${p.managementPotential.level}</td><td>30%</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">人格特质三维横向对比</div>
    ${charts.personalityBar}
  </div>

  <h3>人格特质解读</h3>
  <div class="insight-box">${aiText.personalityInterpretation || '暂无解读'}</div>

  <!-- ===== 6. 创造力障碍模块 ===== -->
  <h2>四、创造力障碍分析（满分 30 分）</h2>
  <p style="font-size:0.75rem; color:#5f6f82; margin-bottom:8px;">注意：得分越高表示障碍越少，创造力发挥越顺畅</p>
  <table>
    <thead><tr><th>障碍类型</th><th>得分</th><th>满分</th><th>障碍等级</th><th>解读</th></tr></thead>
    <tbody>
      <tr>
        <td>心理障碍</td>
        <td>${b.psychological.score}</td><td>${b.psychological.max}</td>
        <td style="color:${b.psychological.level === '低障碍' ? '#10b981' : b.psychological.level === '中障碍' ? '#f59e0b' : '#ef4444'}; font-weight:700;">${b.psychological.level}</td>
        <td>怕失败、不敢尝试、自我怀疑等心理因素</td>
      </tr>
      <tr>
        <td>认知障碍</td>
        <td>${b.cognitive.score}</td><td>${b.cognitive.max}</td>
        <td style="color:${b.cognitive.level === '低障碍' ? '#10b981' : b.cognitive.level === '中障碍' ? '#f59e0b' : '#ef4444'}; font-weight:700;">${b.cognitive.level}</td>
        <td>思维定势、缺乏灵感、不会联想等认知因素</td>
      </tr>
      <tr>
        <td>环境与资源障碍</td>
        <td>${b.environmental.score}</td><td>${b.environmental.max}</td>
        <td style="color:${b.environmental.level === '低障碍' ? '#10b981' : b.environmental.level === '中障碍' ? '#f59e0b' : '#ef4444'}; font-weight:700;">${b.environmental.level}</td>
        <td>资源不足、环境不支持、时间不够等外部因素</td>
      </tr>
    </tbody>
  </table>
  <p style="font-size:0.8rem; margin:8px 0;"><strong>主要障碍类型：${b.primaryBarrierType}</strong></p>

  <div class="graph-card">
    <div class="graph-title">创造力障碍横向对比</div>
    ${charts.barrierBar}
  </div>

  <h3>创造力障碍解读</h3>
  <div class="insight-box">${aiText.barrierInterpretation || '暂无解读'}</div>

  ${aiText.barrierSuggestions ? `
  <h3>突破建议</h3>
  <div class="insight-box">${aiText.barrierSuggestions}</div>
  ` : ''}

  <!-- ===== 7. 综合评分汇总 ===== -->
  <h2>五、综合评分汇总</h2>
  <table>
    <thead><tr><th>测评模块</th><th>加权得分</th><th>满分</th><th>占比</th></tr></thead>
    <tbody>
      <tr><td>领导风格（LASI）</td><td>${breakdown.leadership}</td><td>30</td><td>30%</td></tr>
      <tr><td>人格特质（16PF精选版）</td><td>${breakdown.personality}</td><td>40</td><td>40%</td></tr>
      <tr><td>创造力障碍</td><td>${breakdown.creativityBarrier}</td><td>30</td><td>30%</td></tr>
      <tr><td><strong>综合总分</strong></td><td colspan="2"><strong>100</strong></td><td><strong>${scores.totalScore}</strong></td></tr>
    </tbody>
  </table>

  <h3>综合诊断</h3>
  <div class="insight-box">
    <strong>总分 ${scores.totalScore} 分 · 等级：${scores.grade}</strong><br>
    ${aiText.comprehensiveDiagnosis || '暂无综合诊断'}
  </div>
  <p style="font-size:0.85rem;"><strong>分级判定：${getGradeRangeText(scores.grade)}</strong> → ${scores.totalScore}分，位于「${scores.grade}」区间。${scores.gradeDescription}</p>

  <!-- ===== 8. 提升计划 ===== -->
  <h2>六、能力提升计划</h2>
  ${aiText.improvementPlan ? `
  <div class="insight-box">${aiText.improvementPlan}</div>
  ` : '<p style="color:#94a3b8;">暂无提升计划</p>'}

  <!-- ===== 9. 职业发展建议 ===== -->
  <h2>七、职业发展建议</h2>
  ${aiText.careerSuggestions ? `
  <div class="insight-box">${aiText.careerSuggestions}</div>
  ` : '<p style="color:#94a3b8;">暂无职业建议</p>'}

  <!-- ===== 10. 整体综合结论 ===== -->
  <h2>八、整体综合结论</h2>
  <h3>核心评价</h3>
  <div class="insight-box">${aiText.coreEvaluation || '暂无核心评价'}</div>

  ${aiText.coreAdvantages ? `
  <h3>核心优势</h3>
  <div class="insight-box">${aiText.coreAdvantages}</div>
  ` : ''}

  <h3>总结与展望</h3>
  <div class="insight-box">${aiText.summary || '暂无总结'}</div>

  <!-- ===== 11. 页脚 ===== -->
  <footer>
    本报告由系统精准计分结合AI智能分析生成。图表样式、报告结构与模块顺序为统一标准化模版。报告内容仅供参考，建议结合实际情况综合判断。<br>
    测评工具：领导风格量表（LASI）｜ 16PF人格测验（精选版）｜ 创造力障碍测试<br>
    报告生成时间：${reportDate}
  </footer>

</div>
</body>
</html>`;
}

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
    case '卓越型': return '≥90 卓越型';
    case '进取型': return '75–89 进取型';
    case '成长型': return '60–74 成长型';
    default: return '<60 待发展型';
  }
}

module.exports = { buildReportHTML };
