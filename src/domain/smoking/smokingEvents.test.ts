import { describe, expect, it } from 'vitest';

import {
  buildRecentDailySeries,
  calculateSmokingSpend,
  countCigarettes,
  countCigarettesOnDay,
  dayKey,
} from './smokingEvents';

const events = [
  { smokedAt: '2026-09-14T08:00:00.000Z', cigarettes: 2 },
  { smokedAt: '2026-09-14T16:00:00.000Z', cigarettes: 1 },
  { smokedAt: '2026-09-15T08:00:00.000Z', cigarettes: 3 },
];

describe('smoking event domain', () => {
  it('counts explicit logged cigarettes only', () => {
    expect(countCigarettes(events)).toBe(6);
    expect(countCigarettesOnDay(events, dayKey('2026-09-14T12:00:00.000Z'))).toBe(3);
  });

  it('does not treat an unlogged day as a known smoke-free day', () => {
    const series = buildRecentDailySeries(events, 3, new Date('2026-09-15T12:00:00.000Z'));
    expect(series[0]?.known).toBe(false);
    expect(series[0]?.cigarettes).toBe(0);
    expect(series[1]?.known).toBe(true);
    expect(series[2]?.known).toBe(true);
  });

  it('calculates spend from actual cigarette count and pack economics', () => {
    expect(calculateSmokingSpend(4, 300, 20)).toBe(60);
    expect(calculateSmokingSpend(4, 300, 0)).toBe(0);
  });
});
