/**
 * 兰大综合报告 — 纯Word (.docx) 构建器
 *
 * 使用 docx npm 包生成真正的 .docx 二进制文件。
 * 图表通过 @resvg/resvg-js 将SVG渲染为PNG后嵌入文档。
 * 模块顺序、表格结构、字体样式全部写死。
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, BorderStyle, AlignmentType, ImageRun,
  PageBreak, TableOfContents, ShadingType,
} = require('docx');
const { renderLeadershipRadar, renderLeadershipBar, renderHorizontalBar } = require('./lzuChartService');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ======================= 常量：字体与样式 =======================

const FONT = 'DengXian';        // 等线（Word默认中文字体）
const FONT_SERIF = 'SimSun';    // 宋体
const FONT_SIZE = 21;           // 10.5pt = 21 half-points
const FONT_SIZE_SM = 18;        // 9pt
const FONT_SIZE_H1 = 32;        // 16pt
const FONT_SIZE_H2 = 28;        // 14pt
const FONT_SIZE_H3 = 24;        // 12pt
const COLOR_DARK = '#1E3A5F';
const COLOR_BODY = '#2C3E50';
const COLOR_MUTED = '#5F6F82';
const COLOR_ACCENT = '#2C5F8A';

// ======================= 辅助函数 =======================

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 300, before: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 200, before: 400 },
  });
}

function heading3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { after: 150, before: 300 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: opts.size || FONT_SIZE, font: FONT, color: opts.color || COLOR_BODY, ...opts })],
    spacing: { after: 120, line: 276 }, // 1.2倍行距
  });
}

function boldPara(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: opts.size || FONT_SIZE, font: FONT, bold: true, color: opts.color || COLOR_DARK, ...opts })],
    spacing: { after: 120, line: 276 },
  });
}

function insightBox(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: FONT_SIZE, font: FONT, color: COLOR_BODY, italics: false })],
    spacing: { after: 200, before: 100, line: 300 },
    shading: { type: ShadingType.SOLID, color: 'F8FAFC', fill: 'F8FAFC' },
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: 'F6F8FA', fill: 'F6F8FA' },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, size: FONT_SIZE_SM, font: FONT, bold: true, color: COLOR_DARK })],
      })],
    })),
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      children: [new Paragraph({
        alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: String(cell), size: FONT_SIZE_SM, font: FONT, color: COLOR_BODY })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ======================= SVG → PNG =======================

async function svgToPngBuffer(svgString) {
  // 尝试 @resvg/resvg-js（WASM），失败则用 puppeteer 截图
  try {
    const { render } = require('@resvg/resvg-js');
    const pngBuffer = render(svgString, {
      font: { fontFiles: [], defaultFontFamily: 'DengXian' },
    });
    if (pngBuffer && pngBuffer.length > 100) return Buffer.from(pngBuffer);
    throw new Error('Empty render result');
  } catch (err1) {
    console.warn('[DOCX] resvg failed, trying puppeteer:', err1.message);
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(`<html><body style="margin:0;background:#fff;">${svgString}</body></html>`);
      const svgEl = await page.$('svg');
      if (svgEl) {
        const pngBuffer = await svgEl.screenshot({ type: 'png' });
        await browser.close();
        return pngBuffer;
      }
      await browser.close();
    } catch (err2) {
      console.warn('[DOCX] Puppeteer also failed:', err2.message);
    }
    return null;
  }
}

function chartImage(pngBuffer, width = 480, height = 360) {
  if (!pngBuffer) {
    return new Paragraph({
      children: [new TextRun({ text: '[图表生成失败]', size: FONT_SIZE_SM, color: COLOR_MUTED, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, before: 200 },
    children: [new ImageRun({
      data: pngBuffer,
      transformation: { width, height },
      type: 'png',
    })],
  });
}

function chartCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, size: 15, font: FONT, color: COLOR_MUTED, italics: true })],
  });
}

// ======================= 主构建函数 =======================

async function buildDocx({ scores, aiText, userName, sessionId }) {
  const now = new Date();
  const reportDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const reportId = `LZU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sessionId).padStart(3, '0')}`;

  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const bd = scores.breakdown;

  // ---- 生成图表PNG ----
  const radarSvg = renderLeadershipRadar(l.s1, l.s2, l.s3, l.s4);
  const barSvg = renderLeadershipBar(l.s1, l.s2, l.s3, l.s4);
  const personalityBarSvg = renderHorizontalBar(
    ['创造力潜质', '心理健康', '管理潜能'],
    [p.creativityPotential.raw, p.mentalHealth.raw, p.managementPotential.raw],
    [10, 10, 10],
    ['#8B5CF6', '#10B981', '#3B82F6']
  );
  const barrierBarSvg = renderHorizontalBar(
    ['心理障碍', '认知障碍', '环境与资源障碍'],
    [b.psychological.score, b.cognitive.score, b.environmental.score],
    [b.psychological.max, b.cognitive.max, b.environmental.max],
    ['#EF4444', '#F59E0B', '#3B82F6']
  );

  const [radarPng, barPng, personalityBarPng, barrierBarPng] = await Promise.all([
    svgToPngBuffer(radarSvg),
    svgToPngBuffer(barSvg),
    svgToPngBuffer(personalityBarSvg),
    svgToPngBuffer(barrierBarSvg),
  ]);

  // ---- 构建文档 ----
  const children = [];

  // ===== 封面标题 =====
  children.push(new Paragraph({ spacing: { before: 1200 } }));
  children.push(heading1(`人才测评报告`));
  children.push(heading1(`${userName} 研究生职业发展评估`));
  children.push(new Paragraph({ spacing: { after: 400 } }));
  children.push(para(`报告编号：${reportId}`, { alignment: AlignmentType.CENTER }));
  children.push(para(`测评对象：${userName}`, { alignment: AlignmentType.CENTER }));
  children.push(para(`测评日期：${reportDate}`, { alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ spacing: { after: 200 } }));
  children.push(para('本次评估使用领导风格量表（LASI）、16PF人格测验（精选版）和创造力障碍测试三工具组合，按预设权重计算综合得分。计分权重为总分100 = 领导风格(30) + 人格特质(40) + 创造力(30)。', { alignment: AlignmentType.CENTER }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===== 综合得分概览（不编号） =====
  children.push(heading2('综合得分概览'));
  children.push(makeTable(
    ['指标', '得分', '满分', '百分比'],
    [
      ['综合胜任力指数', String(scores.totalScore), '100', `${scores.totalScore}%`],
      ['领导风格', String(bd.leadership), '30', `${Math.round(bd.leadership / 30 * 100)}%`],
      ['人格特质', String(bd.personality), '40', `${Math.round(bd.personality / 40 * 100)}%`],
      ['创造力', String(bd.creativityBarrier), '30', `${Math.round(bd.creativityBarrier / 30 * 100)}%`],
    ],
    [25, 25, 25, 25]
  ));
  // 进度条（用文字和特殊字符模拟）
  const filledBars = Math.round(scores.totalScore / 10);
  const emptyBars = 10 - filledBars;
  children.push(boldPara(`综合得分进度：${'▓'.repeat(filledBars)}${'░'.repeat(emptyBars)} ${scores.totalScore}%`));
  children.push(boldPara(`${scores.grade} · ${scores.gradeDescription}`));

  // ===== 一、总体画像 =====
  children.push(heading2('一、总体画像'));
  children.push(makeTable(
    ['维度', '概况'],
    [
      ['突出优势', aiText.profileAdvantages || '根据测评数据自动生成'],
      ['优先发展项', aiText.profileDevelopments || '根据测评数据自动生成'],
      ['领导风格', `${l.dominantStyle}为主，情境适应性${scores.adaptabilityLevel}（指数: ${scores.adaptabilityIndex}）`],
      ['目标定位关键差异', '从"个人执行"到"团队引领"；从"单一技能"到"多维管理能力"'],
    ],
    [22, 78]
  ));

  // ===== 二、领导风格分析 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2('二、领导风格评分（满分 30 分）'));
  children.push(heading3('各风格得分'));
  children.push(makeTable(
    ['风格类型', '原始得分', '满分', '行为特征'],
    [
      ['S1 指令型', String(l.s1), '7', '明确指导、标准流程、密切监督'],
      ['S2 教练型', String(l.s2), '12', '解释决策、双向沟通、关注成长'],
      ['S3 支持型', String(l.s3), '12', '倾听鼓励、参与决策、营造氛围'],
      ['S4 授权型', String(l.s4), '12', '充分信任、结果导向、授予自主权'],
    ],
    [25, 20, 15, 40]
  ));
  children.push(boldPara(`主导风格：${l.dominantStyle}  |  情境适应性指数：${scores.adaptabilityIndex}（${scores.adaptabilityLevel}）`));

  // 雷达图
  children.push(chartCaption('图1：领导风格四维雷达图'));
  children.push(chartImage(radarPng, 400, 380));
  children.push(chartCaption('图2：领导风格强度分布'));
  children.push(chartImage(barPng, 400, 240));

  // 风格-场景匹配表
  children.push(heading3('风格-场景匹配分析'));
  children.push(makeTable(
    ['典型工作场景', '自然应对风格', '匹配度', '需要注意什么'],
    [
      ['新团队组建', l.s2 >= l.s1 ? 'S2教练型：指导+培养' : 'S1指令型：明确规范',
        l.s2 >= 8 ? '✅完美匹配' : l.s2 >= 5 ? '✅基本够用' : '⚠️储备不足',
        l.s2 >= 8 ? '不需调整' : l.s2 >= 5 ? '建议加强教练技巧' : '建议练习提问式领导'],
      ['危机处理', 'S1指令型：果断决策',
        l.s1 >= 5 ? '✅储备充足' : l.s1 >= 3 ? '✅基本够用' : '⚠️可加强',
        l.s1 >= 5 ? '不需调整' : '建议练习单边决策'],
      ['日常运营', l.s4 >= 8 ? 'S4授权型：信任+结果' : l.s3 >= 8 ? 'S3支持型：倾听+参与' : 'S2教练型：关注+反馈',
        l.s4 >= 8 || l.s3 >= 8 ? '✅完美匹配' : '✅基本够用',
        l.s4 >= 8 ? '不需调整' : '建议逐步授权'],
      ['团队激励', 'S3支持型：倾听+赋能',
        l.s3 >= 8 ? '✅高度匹配' : l.s3 >= 5 ? '✅基本够用' : '⚠️可发展',
        l.s3 >= 8 ? '隐藏优势，善加利用' : '建议增加一对一沟通'],
      ['战略转型', 'S2教练型：启发+共创',
        l.s2 >= 8 ? '✅高度匹配' : l.s2 >= 5 ? '⚠️可发展' : '⚠️储备不足',
        '补充结构性战略思考训练'],
    ],
    [22, 28, 18, 32]
  ));

  children.push(heading3('领导风格综合结论'));
  children.push(insightBox(aiText.leadershipInterpretation || '暂无解读'));

  // ===== 三、人格特质分析 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2('三、人格特质评分（满分 40 分）'));
  children.push(heading3('各维度得分'));
  children.push(makeTable(
    ['维度', '原始分(0-10)', '标准分', '等级', '权重'],
    [
      ['创造力潜质', String(p.creativityPotential.raw), String(p.creativityPotential.standard), p.creativityPotential.level, '40%'],
      ['心理健康', String(p.mentalHealth.raw), String(p.mentalHealth.standard), p.mentalHealth.level, '30%'],
      ['管理潜能', String(p.managementPotential.raw), String(p.managementPotential.standard), p.managementPotential.level, '30%'],
    ],
    [25, 20, 15, 15, 25]
  ));

  children.push(chartCaption('图3：人格特质三维横向对比'));
  children.push(chartImage(personalityBarPng, 400, 150));

  // 逐维度解读
  children.push(heading3('维度解读与行为锚定'));
  children.push(heading3('创造力潜质'));
  children.push(insightBox(aiText.personality_creativity || aiText.personalityInterpretation || '暂无解读'));
  children.push(heading3('心理健康'));
  children.push(insightBox(aiText.personality_mentalHealth || '暂无解读'));
  children.push(heading3('管理潜能'));
  children.push(insightBox(aiText.personality_managementPotential || '暂无解读'));

  if (aiText.personalityInterpretation) {
    children.push(heading3('人格特质综合结论'));
    children.push(insightBox(aiText.personalityInterpretation));
  }

  // 交叉验证表
  children.push(heading3('领导风格与人格特质交叉验证'));
  children.push(makeTable(
    ['领导风格维度', '对应人格特质', '得分一致性', '解读'],
    [
      ['S2教练型', `管理潜能 (${p.managementPotential.raw}/10)`,
        `${Math.abs(Math.round(l.s2/12*100) - Math.round(p.managementPotential.raw/10*100)) <= 15 ? '✅完全一致' : Math.abs(Math.round(l.s2/12*100) - Math.round(p.managementPotential.raw/10*100)) <= 30 ? '⚠️基本一致' : '🔴有差异'}`,
        l.s2/12*100 >= 66 && p.managementPotential.raw/10*100 >= 60 ? '培养意愿与能力双高—最确定的优势' : '关注管理能力系统提升'],
      ['S4授权型', `心理健康 (${p.mentalHealth.raw}/10)`,
        `${Math.abs(Math.round(l.s4/12*100) - Math.round(p.mentalHealth.raw/10*100)) <= 15 ? '✅完全一致' : Math.abs(Math.round(l.s4/12*100) - Math.round(p.mentalHealth.raw/10*100)) <= 30 ? '⚠️基本一致' : '🔴有差异'}`,
        l.s4/12*100 >= 66 && p.mentalHealth.raw/10*100 >= 60 ? '信任与情绪稳定双支撑—授权有根基' : '建议加强情绪管理与信任建设'],
      ['S1指令型', `创造力潜质 (${p.creativityPotential.raw}/10)`,
        `${Math.abs(Math.round(l.s1/7*100) - Math.round(p.creativityPotential.raw/10*100)) <= 15 ? '✅完全一致' : Math.abs(Math.round(l.s1/7*100) - Math.round(p.creativityPotential.raw/10*100)) <= 30 ? '⚠️基本一致' : '🔴有差异'}`,
        l.s1/7*100 <= 43 && p.creativityPotential.raw/10*100 < 60 ? '低指令与低创造力并存—需发展独立思考' : l.s1/7*100 >= 71 && p.creativityPotential.raw/10*100 >= 60 ? '执行力与创造力兼备—综合优势' : '探索与执行间找平衡'],
    ],
    [20, 22, 22, 36]
  ));

  // ===== 四、创造力障碍分析 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2('四、创造力障碍分析（满分 30 分）'));
  children.push(para('注意：得分越高表示障碍越少，创造力发挥越顺畅', { size: FONT_SIZE_SM, color: COLOR_MUTED }));

  children.push(makeTable(
    ['障碍类型', '得分', '满分', '障碍等级', '解读'],
    [
      ['心理障碍', String(b.psychological.score), String(b.psychological.max), b.psychological.level, '怕失败、不敢尝试、自我怀疑'],
      ['认知障碍', String(b.cognitive.score), String(b.cognitive.max), b.cognitive.level, '思维定势、缺乏灵感、不会联想'],
      ['环境与资源障碍', String(b.environmental.score), String(b.environmental.max), b.environmental.level, '资源不足、环境不支持、时间不够'],
    ],
    [18, 12, 12, 18, 40]
  ));
  children.push(boldPara(`主要障碍类型：${b.primaryBarrierType}`));

  children.push(chartCaption('图4：创造力障碍横向对比'));
  children.push(chartImage(barrierBarPng, 400, 150));

  children.push(heading3('障碍类型详细解读'));
  children.push(heading3('心理障碍'));
  children.push(insightBox(aiText.barrier_psychological || aiText.barrierInterpretation || '暂无解读'));
  children.push(heading3('认知障碍'));
  children.push(insightBox(aiText.barrier_cognitive || '暂无解读'));
  children.push(heading3('环境与资源障碍'));
  children.push(insightBox(aiText.barrier_environmental || '暂无解读'));

  if (aiText.barrierInterpretation) {
    children.push(heading3('创造力障碍综合结论'));
    children.push(insightBox(aiText.barrierInterpretation));
  }

  if (aiText.barrierSuggestions) {
    children.push(heading3('突破建议'));
    children.push(insightBox(aiText.barrierSuggestions));
  }

  // ===== 五、综合评分汇总 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2('五、综合评分汇总'));
  children.push(makeTable(
    ['测评模块', '加权得分', '满分', '占比'],
    [
      ['领导风格（LASI）', String(bd.leadership), '30', '30%'],
      ['人格特质（16PF精选版）', String(bd.personality), '40', '40%'],
      ['创造力障碍', String(bd.creativityBarrier), '30', '30%'],
      ['综合总分', String(scores.totalScore), '100', `${scores.grade}`],
    ],
    [35, 25, 20, 20]
  ));

  children.push(heading3('综合诊断'));
  children.push(insightBox(aiText.comprehensiveDiagnosis || `综合总分${scores.totalScore}/100，等级"${scores.grade}"。`));
  children.push(boldPara(`分级判定：${scores.totalScore}分 → 「${scores.grade}」区间。${scores.gradeDescription}`));

  // ===== 六、能力提升计划 =====
  children.push(heading2('六、能力提升计划'));
  if (aiText.improvementPlan) {
    children.push(insightBox(aiText.improvementPlan));
  }

  // ===== 七、职业发展建议 =====
  children.push(heading2('七、职业发展建议'));
  if (aiText.careerSuggestions) {
    children.push(insightBox(aiText.careerSuggestions));
  }

  // ===== 八、整体综合结论 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2('八、整体综合结论'));

  children.push(heading3('核心评价'));
  children.push(insightBox(aiText.coreEvaluation || '暂无核心评价'));

  if (aiText.coreAdvantages) {
    children.push(heading3('核心优势'));
    children.push(insightBox(aiText.coreAdvantages));
  }

  children.push(heading3('总结与展望'));
  children.push(insightBox(aiText.summary || '暂无总结'));

  // ===== 页脚 =====
  children.push(new Paragraph({ spacing: { before: 600 } }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2EDF2' } },
    children: [new TextRun({
      text: `本报告依据兰州大学管理学院职业发展测评系统生成（LASI + 16PF精选版 + 创造力障碍测试），权重与解读符合测评手册标准。结果用于职业规划参考，建议每6-12个月复测追踪发展成效。`,
      size: 15,
      font: FONT,
      color: COLOR_MUTED,
    })],
  }));

  // ---- 组装文档 ----
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 2.54cm
        },
      },
      children,
    }],
  });

  // ---- 输出文件 ----
  const buffer = await Packer.toBuffer(doc);
  const filename = `report_${sessionId}_${Date.now()}.docx`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  console.log(`[DOCX] Generated: ${filepath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  return { path: filepath, filename, buffer };
}

// ======================= 旧版兼容 =======================

async function buildDocxFromHTML(htmlContent, sessionId) {
  // 降级：直接用 puppeteer 把 HTML 转 PDF
  const puppeteer = require('puppeteer');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    const filename = `report_${sessionId}_${Date.now()}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
    fs.writeFileSync(filepath, pdfBuffer);

    console.log(`[DOCX] HTML→PDF fallback: ${filepath}`);
    return { path: filepath, filename, buffer: pdfBuffer };
  } catch (err) {
    console.error('[DOCX] Fallback error:', err.message);
    // 最终降级: 存HTML为.doc
    const filename = `report_${sessionId}_${Date.now()}.doc`;
    const filepath = path.join(REPORTS_DIR, filename);
    fs.writeFileSync(filepath, htmlContent, 'utf-8');
    return { path: filepath, filename, buffer: Buffer.from(htmlContent, 'utf-8') };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { buildDocx, buildDocxFromHTML };
