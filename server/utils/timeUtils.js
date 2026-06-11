/**
 * 时间工具 — 统一处理 UTC 存储 → 中国时间显示
 *
 * 约定：
 *   - 数据库统一存 UTC（datetime('now') = UTC）
 *   - API 返回给前端时转为中国时间字符串
 *   - 前端直接显示，不做 new Date() 解析
 */

const CHINA_OFFSET = 8 * 60 * 60 * 1000; // UTC+8

/**
 * 将数据库 UTC 时间字符串转为中国时间 ISO 字符串
 * 输入： "2026-06-11 09:48:52" (UTC)
 * 输出： "2026-06-11T17:48:52.000+08:00" (中国时间)
 */
function toChinaISO(dbUtcStr) {
  if (!dbUtcStr) return '';
  // SQLite datetime 格式： "YYYY-MM-DD HH:MM:SS"
  const normalized = dbUtcStr.replace(' ', 'T');
  const utcDate = new Date(normalized + 'Z'); // 加 Z 确保按 UTC 解析
  if (isNaN(utcDate.getTime())) return dbUtcStr; // 解析失败返回原值
  return new Date(utcDate.getTime() + CHINA_OFFSET).toISOString().replace('Z', '+08:00');
}

/**
 * 将数据库 UTC 时间字符串转为中国时间显示字符串
 * 输入： "2026-06-11 09:48:52" (UTC)
 * 输出： "2026年6月11日 17:48" (中国时间)
 */
function toChinaDisplay(dbUtcStr) {
  if (!dbUtcStr) return '';
  const normalized = dbUtcStr.replace(' ', 'T');
  const utcDate = new Date(normalized + 'Z');
  if (isNaN(utcDate.getTime())) return dbUtcStr;
  const chinaDate = new Date(utcDate.getTime() + CHINA_OFFSET);
  const y = chinaDate.getUTCFullYear();
  const m = chinaDate.getUTCMonth() + 1;
  const d = chinaDate.getUTCDate();
  const hh = String(chinaDate.getUTCHours()).padStart(2, '0');
  const mm = String(chinaDate.getUTCMinutes()).padStart(2, '0');
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

/**
 * 将数据库 UTC 时间字符串转为短格式
 * 输入： "2026-06-11 09:48:52" (UTC)
 * 输出： "6月11日 17:48"
 */
function toChinaShort(dbUtcStr) {
  if (!dbUtcStr) return '';
  const normalized = dbUtcStr.replace(' ', 'T');
  const utcDate = new Date(normalized + 'Z');
  if (isNaN(utcDate.getTime())) return dbUtcStr;
  const chinaDate = new Date(utcDate.getTime() + CHINA_OFFSET);
  const m = chinaDate.getUTCMonth() + 1;
  const d = chinaDate.getUTCDate();
  const hh = String(chinaDate.getUTCHours()).padStart(2, '0');
  const mm = String(chinaDate.getUTCMinutes()).padStart(2, '0');
  return `${m}月${d}日 ${hh}:${mm}`;
}

/**
 * 获取当前中国时间字符串
 * 输出： "2026年6月11日 17:48"
 */
function nowChinaDisplay() {
  const now = new Date();
  const chinaDate = new Date(now.getTime() + CHINA_OFFSET);
  const y = chinaDate.getUTCFullYear();
  const m = chinaDate.getUTCMonth() + 1;
  const d = chinaDate.getUTCDate();
  const hh = String(chinaDate.getUTCHours()).padStart(2, '0');
  const mm = String(chinaDate.getUTCMinutes()).padStart(2, '0');
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

/**
 * 获取当前中国日期字符串（仅日期）
 * 输出： "2026年6月11日"
 */
function nowChinaDate() {
  const now = new Date();
  const chinaDate = new Date(now.getTime() + CHINA_OFFSET);
  const y = chinaDate.getUTCFullYear();
  const m = chinaDate.getUTCMonth() + 1;
  const d = chinaDate.getUTCDate();
  return `${y}年${m}月${d}日`;
}

module.exports = {
  toChinaISO,
  toChinaDisplay,
  toChinaShort,
  nowChinaDisplay,
  nowChinaDate,
};
