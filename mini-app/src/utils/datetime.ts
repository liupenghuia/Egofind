/** Date/time helpers for publish forms (local wall clock). */

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function todayDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function timeStr(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Default window: start = now+1h, end = start+1h */
export function defaultTimeWindow() {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    startDate: todayDateStr(start),
    startTime: timeStr(start),
    endDate: todayDateStr(end),
    endTime: timeStr(end),
  };
}

export function combineLocalIso(dateStr: string, timeStrVal: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStrVal.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

export function formatLocalLabel(dateStr: string, timeStrVal: string) {
  return `${dateStr} ${timeStrVal}`;
}
