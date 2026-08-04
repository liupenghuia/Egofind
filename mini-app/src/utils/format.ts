/** Display helpers for trip summary / detail (UI Spec copy). */

export function formatDepartTime(iso?: string | null): string {
  if (!iso) return '时间待定';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '时间待定';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}月${day}日 ${hh}:${mm}`;
}

export function formatDepartRange(
  start?: string | null,
  end?: string | null,
): string {
  const startLabel = formatDepartTime(start);
  if (!end) return startLabel;
  const e = new Date(end);
  if (Number.isNaN(e.getTime())) return startLabel;
  const hh = String(e.getHours()).padStart(2, '0');
  const mm = String(e.getMinutes()).padStart(2, '0');
  return `${startLabel} 至 ${hh}:${mm}`;
}

/** priceCents → 「约 ¥x.xx / 人」；0/空不展示（调用方判断）。 */
export function formatPricePerPerson(priceCents?: number | null): string | null {
  if (priceCents == null || priceCents <= 0) return null;
  const yuan = (priceCents / 100).toFixed(2);
  return `约 ¥${yuan} / 人`;
}

const TRIP_STATUS_ZH: Record<string, string> = {
  PUBLISHED: '发布中',
  MATCHING: '匹配中',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  EXPIRED: '已过期',
};

export function formatTripStatus(status?: string | null): string {
  if (!status) return '-';
  return TRIP_STATUS_ZH[status] || status;
}

/** MatchOrder status (same labels as trip for CONFIRMED/COMPLETED/CANCELLED). */
export function formatMatchStatus(status?: string | null): string {
  return formatTripStatus(status);
}

/** 评价摘要：★ 4.8（12）或 暂无评价 */
export function formatRatingSummary(
  ratingAvg?: number | null,
  ratingCount?: number | null,
): string {
  const n = ratingCount ?? 0;
  if (!n || ratingAvg == null) return '暂无评价';
  return `★ ${Number(ratingAvg).toFixed(1)}（${n}）`;
}
