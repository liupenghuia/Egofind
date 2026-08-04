/** 管理端中文枚举 / 状态色 — 与 UI Spec U3.4 对齐 */

export const VISIBILITY_ZH: Record<string, string> = {
  PUBLIC: '公开',
  HIDDEN: '隐藏',
};

export const TRIP_STATUS_ZH: Record<string, string> = {
  OPEN: '进行中',
  ACTIVE: '进行中',
  PUBLISHED: '已发布',
  CANCELLED: '已取消',
  CANCELED: '已取消',
  COMPLETED: '已完成',
  EXPIRED: '已过期',
  MATCHED: '已匹配',
  CONFIRMED: '已确认',
  CLOSED: '已关闭',
};

export const VERIFY_STATUS_ZH: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  REVIEWING: '审核中',
};

export const REPORT_STATUS_ZH: Record<string, string> = {
  OPEN: '待处理',
  REVIEWING: '处理中',
  CLOSED: '已关闭',
};

export const TARGET_TYPE_ZH: Record<string, string> = {
  driver_trip: '车找人',
  DRIVER_TRIP: '车找人',
  passenger_request: '人找车',
  PASSENGER_REQUEST: '人找车',
  user: '用户',
  USER: '用户',
  match_order: '匹配单',
  MATCH_ORDER: '匹配单',
};

export function zhLabel(map: Record<string, string>, code?: string | null) {
  if (code == null || code === '') return '-';
  return map[code] || map[String(code).toUpperCase()] || code;
}

export function statusTagColor(status?: string): string {
  const s = (status || '').toUpperCase();
  if (s === 'OPEN' || s === 'PENDING' || s === 'ACTIVE' || s === 'PUBLISHED') {
    return 'orange';
  }
  if (s === 'REVIEWING' || s === 'MATCHED' || s === 'CONFIRMED') return 'blue';
  if (s === 'APPROVED' || s === 'COMPLETED') return 'green';
  if (s === 'REJECTED' || s === 'CANCELLED' || s === 'CANCELED') return 'red';
  if (s === 'CLOSED' || s === 'EXPIRED') return 'default';
  return 'default';
}
