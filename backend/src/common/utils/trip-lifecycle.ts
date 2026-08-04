/**
 * Pure lifecycle helpers for cancel / seat deduction (P0 state-machine fixes).
 * Unit-tested without DB.
 */

const TERMINAL = new Set(['CANCELLED', 'COMPLETED', 'EXPIRED']);

/** Active match that blocks cancelling a publish. */
export const ACTIVE_MATCH_STATUSES = ['CONFIRMED', 'COMPLETED'] as const;

export type CancelPublishEval =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Whether a driver trip or passenger request may be cancelled as a "publish cancel".
 * Product default: any CONFIRMED/COMPLETED MatchOrder blocks cancel.
 */
export function evaluateCancelPublish(
  entityStatus: string,
  activeMatchCount: number,
): CancelPublishEval {
  if (TERMINAL.has(entityStatus)) {
    return { allowed: false, message: '当前状态不可取消' };
  }
  if (entityStatus === 'CONFIRMED') {
    return {
      allowed: false,
      message: '已确认同行，不可取消发布，请先完成行程',
    };
  }
  if (activeMatchCount > 0) {
    return {
      allowed: false,
      message: '已有确认同行，不可取消发布；请先完成已确认订单',
    };
  }
  if (entityStatus !== 'PUBLISHED' && entityStatus !== 'MATCHING') {
    return { allowed: false, message: '当前状态不可取消' };
  }
  return { allowed: true };
}

export type SeatDeductionEval =
  | { ok: true; seatsLeft: number; tripStatus: 'MATCHING' | 'CONFIRMED' }
  | { ok: false; message: string };

/** Compute seats after a successful confirm (no concurrency). */
export function evaluateSeatDeduction(
  seatsLeft: number,
  seatsNeeded: number,
): SeatDeductionEval {
  if (seatsNeeded <= 0) {
    return { ok: false, message: '所需座位数无效' };
  }
  if (seatsLeft < seatsNeeded) {
    return { ok: false, message: '余座不足' };
  }
  const next = seatsLeft - seatsNeeded;
  return {
    ok: true,
    seatsLeft: next,
    tripStatus: next === 0 ? 'CONFIRMED' : 'MATCHING',
  };
}

export type CancelMatchEval =
  | { allowed: true }
  | { allowed: false; message: string };

/** Whether a MatchOrder may be cancelled (single-party, CONFIRMED only). */
export function evaluateCancelMatch(matchStatus: string): CancelMatchEval {
  if (matchStatus === 'COMPLETED') {
    return { allowed: false, message: '行程已完成，无法取消' };
  }
  if (matchStatus === 'CANCELLED') {
    return { allowed: false, message: '该同行已取消' };
  }
  if (matchStatus !== 'CONFIRMED') {
    return { allowed: false, message: '当前状态不可取消同行' };
  }
  return { allowed: true };
}

/**
 * After restoring seats from a cancelled match:
 * seatsLeft is post-restore; seatsTotal for clamping.
 */
export function evaluateSeatRestore(
  seatsLeftBefore: number,
  seatsTotal: number,
  seatsToRestore: number,
): { seatsLeft: number; tripStatus: 'MATCHING' | 'CONFIRMED' } {
  const seatsLeft = Math.min(
    seatsTotal,
    Math.max(0, seatsLeftBefore + seatsToRestore),
  );
  return {
    seatsLeft,
    tripStatus: seatsLeft <= 0 ? 'CONFIRMED' : 'MATCHING',
  };
}
