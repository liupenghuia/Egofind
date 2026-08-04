/**
 * P0 state-machine unit checks (no DB).
 * Run after build: node scripts/check-trip-lifecycle.mjs
 */
import {
  evaluateCancelMatch,
  evaluateCancelPublish,
  evaluateSeatDeduction,
  evaluateSeatRestore,
} from '../dist/common/utils/trip-lifecycle.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- cancel publish ---
assert(
  evaluateCancelPublish('MATCHING', 0).allowed === true,
  'matching no matches can cancel',
);
assert(
  evaluateCancelPublish('PUBLISHED', 0).allowed === true,
  'published can cancel',
);
const blocked = evaluateCancelPublish('MATCHING', 1);
assert(blocked.allowed === false, 'matching with active match blocked');
assert(
  String(blocked.message).includes('确认同行'),
  `message: ${blocked.message}`,
);
assert(
  evaluateCancelPublish('CONFIRMED', 0).allowed === false,
  'confirmed entity blocked',
);
assert(
  evaluateCancelPublish('CANCELLED', 0).allowed === false,
  'cancelled blocked',
);
assert(
  evaluateCancelPublish('COMPLETED', 2).allowed === false,
  'completed blocked',
);

// --- seats ---
const ok = evaluateSeatDeduction(3, 1);
assert(ok.ok && ok.seatsLeft === 2 && ok.tripStatus === 'MATCHING', 'deduct 1 of 3');
const full = evaluateSeatDeduction(2, 2);
assert(full.ok && full.seatsLeft === 0 && full.tripStatus === 'CONFIRMED', 'full');
const fail = evaluateSeatDeduction(1, 2);
assert(fail.ok === false, 'oversell rejected');
assert(evaluateSeatDeduction(2, 0).ok === false, 'zero seats needed');

// --- cancel match ---
assert(evaluateCancelMatch('CONFIRMED').allowed === true, 'confirmed can cancel');
assert(evaluateCancelMatch('COMPLETED').allowed === false, 'completed no cancel');
assert(evaluateCancelMatch('CANCELLED').allowed === false, 'already cancelled');
const rest = evaluateSeatRestore(0, 3, 1);
assert(rest.seatsLeft === 1 && rest.tripStatus === 'MATCHING', 'restore seats');
const restFull = evaluateSeatRestore(0, 2, 0);
assert(restFull.tripStatus === 'CONFIRMED', 'still full');

console.log('trip-lifecycle checks OK');
