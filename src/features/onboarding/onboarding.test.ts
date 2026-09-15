import { describe, expect, it } from 'vitest';

import { onboardingPlanSchema } from './onboardingSchemas';
import {
  calculateInitialReductionTarget,
  calculatePricePerCigarette,
} from './onboardingModel';

describe('onboarding plan', () => {
  it('preserves the V1 gentle reduction rule', () => {
    expect(calculateInitialReductionTarget(20)).toBe(18);
    expect(calculateInitialReductionTarget(6)).toBe(5);
    expect(calculateInitialReductionTarget(1)).toBe(1);
  });

  it('derives per-cigarette cost from pack inputs', () => {
    expect(calculatePricePerCigarette(300, 20)).toBe(15);
  });

  it('requires a quit date only for the quit-now journey', () => {
    const common = {
      displayName: 'Sankalp',
      country: 'IN',
      cigarettesPerDay: 10,
      pricePerPack: 300,
      cigarettesPerPack: 20,
    };

    expect(
      onboardingPlanSchema.safeParse({ ...common, journeyMode: 'quit', quitDate: null }).success,
    ).toBe(false);
    expect(
      onboardingPlanSchema.safeParse({ ...common, journeyMode: 'track', quitDate: null }).success,
    ).toBe(true);
  });
});
