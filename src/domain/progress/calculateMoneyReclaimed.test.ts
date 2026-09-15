import { describe, expect, it } from 'vitest';

import { calculateMoneyReclaimed } from './calculateMoneyReclaimed';

describe('calculateMoneyReclaimed', () => {
  it('calculates reclaimed money from cigarettes avoided', () => {
    expect(
      calculateMoneyReclaimed({
        cigarettesAvoided: 40,
        cigarettesPerPack: 20,
        packPrice: 400,
      }),
    ).toBe(800);
  });

  it('returns zero for invalid or non-positive input', () => {
    expect(
      calculateMoneyReclaimed({
        cigarettesAvoided: 0,
        cigarettesPerPack: 20,
        packPrice: 400,
      }),
    ).toBe(0);
  });
});
