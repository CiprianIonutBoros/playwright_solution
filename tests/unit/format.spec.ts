import { test, expect } from '@playwright/test';
import { formatUsd } from '../../src/shared/helpers/format';
import { isIsoTimestamp } from '../../src/shared/data/formats';

for (const [cents, expected] of [
  [0, '$0.00'], [1, '$0.01'], [10, '$0.10'], [1890, '$18.90'],
  [5600, '$56.00'], [123456, '$1234.56'], [-125, '$-1.25'],
] as const) {
  test(`formatUsd formats ${cents} cents as ${expected}`, () => {
    expect(formatUsd(cents)).toBe(expected);
  });
}

for (const value of ['2026-10-29T06:00:00.000Z', '2024-02-29T23:59:59.999Z']) {
  test(`isIsoTimestamp accepts canonical UTC timestamp ${value}`, () => {
    expect(isIsoTimestamp(value)).toBe(true);
  });
}

for (const value of [
  '', 'not a date', '2026-10-29', '2026-10-29T06:00:00Z',
  '2026-10-29T08:00:00.000+02:00', '2026-02-30T06:00:00.000Z',
]) {
  test(`isIsoTimestamp rejects noncanonical value ${JSON.stringify(value)}`, () => {
    expect(isIsoTimestamp(value)).toBe(false);
  });
}
