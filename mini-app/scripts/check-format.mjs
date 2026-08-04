/**
 * Lightweight acceptance helper for trip display formatters (no Jest/Taro).
 * Run: node scripts/check-format.mjs
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formatPath = path.join(__dirname, '../src/utils/format.ts');

// Prefer native TS strip when available (Node 22+)
let format;
try {
  format = await import(pathToFileURL(formatPath).href);
} catch {
  console.error('Failed to load format.ts — use Node with --experimental-strip-types');
  process.exit(1);
}

const { formatPricePerPerson, formatTripStatus, formatDepartTime } = format;
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK:', msg);
  }
}

assert(formatPricePerPerson(1500) === '约 ¥15.00 / 人', 'price 1500 cents');
assert(formatPricePerPerson(0) === null, 'price 0 hidden');
assert(formatPricePerPerson(null) === null, 'price null hidden');
assert(formatTripStatus('MATCHING') === '匹配中', 'status zh');
assert(formatTripStatus('UNKNOWN_X') === 'UNKNOWN_X', 'status passthrough');
assert(typeof formatDepartTime('2026-07-28T08:30:00.000Z') === 'string', 'depart time string');
assert(formatDepartTime(null) === '时间待定', 'depart empty');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\ncheck-format: all passed');
