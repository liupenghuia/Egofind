/**
 * Lightweight geo unit checks (no Jest required).
 * Run: node scripts/check-geo.mjs  (from backend/, after build) or via tsx
 */
import {
  directionCosine,
  haversineKm,
  sameRegion,
  timeOverlapRatio,
} from '../dist/common/utils/geo.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(sameRegion('130128', '130128', 'county') === true, 'county same');
assert(sameRegion('130128', '130129', 'county') === false, 'county diff');
assert(sameRegion('130128', '130129', 'city') === true, 'city same prefix');

const d = haversineKm(38.184, 115.201, 38.185, 115.205);
assert(d > 0 && d < 5, `haversine ${d}`);

const ratio = timeOverlapRatio(
  new Date('2026-01-01T10:00:00Z'),
  new Date('2026-01-01T12:00:00Z'),
  new Date('2026-01-01T11:00:00Z'),
  new Date('2026-01-01T13:00:00Z'),
);
assert(Math.abs(ratio - 0.5) < 0.01, `overlap ${ratio}`);

const cos = directionCosine(0, 0, 1, 1, 0, 0, 2, 2);
assert(Math.abs(cos - 1) < 1e-6, `cos ${cos}`);

console.log('geo checks OK');
