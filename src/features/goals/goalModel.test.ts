import { describe, expect, it } from 'vitest';

import { buildGoalProgress, calculateDailyAutomaticFunding, goalDraftSchema } from './goalModel';

describe('savings goal model', () => {
  it('derives progress from reclaimed money rather than stored current amount', () => {
    const progress = buildGoalProgress(1000, 400, 100);

    expect(progress.fundedAmount).toBe(400);
    expect(progress.progressPercent).toBe(40);
    expect(progress.remainingAmount).toBe(600);
    expect(progress.nextCheckpointPercent).toBe(50);
    expect(progress.amountToNextCheckpoint).toBe(100);
    expect(progress.estimatedDaysRemaining).toBe(6);
  });

  it('caps funding at the target once a goal is reached', () => {
    const progress = buildGoalProgress(1000, 1250, 100);

    expect(progress.fundedAmount).toBe(1000);
    expect(progress.progressPercent).toBe(100);
    expect(progress.remainingAmount).toBe(0);
    expect(progress.achieved).toBe(true);
    expect(progress.nextCheckpointPercent).toBeNull();
    expect(progress.estimatedDaysRemaining).toBe(0);
  });

  it('does not estimate an arrival date without a trustworthy daily funding rate', () => {
    const progress = buildGoalProgress(1000, 250, 0);
    expect(progress.estimatedDaysRemaining).toBeNull();
  });

  it('calculates the automatic daily quit funding baseline', () => {
    expect(calculateDailyAutomaticFunding(20, 300, 20)).toBe(300);
    expect(calculateDailyAutomaticFunding(20, 300, 0)).toBe(0);
  });

  it('rejects empty names and non-positive targets', () => {
    expect(goalDraftSchema.safeParse({ name: '   ', targetAmount: 500 }).success).toBe(false);
    expect(goalDraftSchema.safeParse({ name: 'Headphones', targetAmount: 0 }).success).toBe(false);
  });
});
