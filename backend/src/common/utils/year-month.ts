/**
 * 自然月字符串，固定 Asia/Shanghai，避免 UTC 跨日偏差。
 * @returns e.g. "2026-07"
 */
export function currentYearMonthShanghai(date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  });
  // en-CA → YYYY-MM-DD or YYYY-MM depending on engine; take first 7
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  if (y && m) return `${y}-${m}`;
  // fallback
  const s = date.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  return s.slice(0, 7);
}

/** 下月 1 日提示文案用 */
export function nextMonthFirstLabelShanghai(date = new Date()): string {
  const ym = currentYearMonthShanghai(date);
  const [y, m] = ym.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}年${nm}月1日`;
}
