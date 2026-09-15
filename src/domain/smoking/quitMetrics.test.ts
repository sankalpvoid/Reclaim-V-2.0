import { describe, expect, it } from 'vitest';

import { calculateQuitMetrics } from './quitMetrics';

describe('calculateQuitMetrics', () => {
  it('derives avoided cigarettes, money, and time from elapsed smoke-free time', () => {
    const result = calculateQuitMetrics(
      {
        quitDate: '2026-09-14T12:00:00.000Z',
        cigarettesPerDay: 20,
        pricePerPack: 300,
        cigarettesPerPack: 20,
        minutesPerCigarette: 11,
      },
      new Date('2026-09-15T12:00:00.000Z'),
    );

    expect(result.elapsedDays).toBe(1);
    expect(result.cigarettesAvoided).toBe(20);
    expect(result.moneyReclaimed).toBe(300);
    expect(result.minutesReclaimed).toBe(220);
  });

  it('never creates negative progress when the quit time is in the future', () => {
    const result = calculateQuitMetrics(
      {
        quitDate: '2026-09-16T12:00:00.000Z',
        cigarettesPerDay: 20,
        pricePerPack: 300,
        cigarettesPerPack: 20,
        minutesPerCigarette: 11,
      },
      new Date('2026-09-15T12:00:00.000Z'),
    );

    expect(result.elapsedMilliseconds).toBe(0);
    expect(result.cigarettesAvoided).toBe(0);
    expect(result.moneyReclaimed).toBe(0);
  });
});
