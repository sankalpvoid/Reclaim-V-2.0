import { describe, expect, it } from 'vitest';

import {
  applyWeeklyReview,
  buildWeeklyReview,
  calculateBaseline,
  calculateNextTarget,
  createInitialReductionPlan,
  getReductionProgress,
  summarizeToday,
} from './reduction';

describe('reduction journey rules', () => {
  it('uses the onboarding estimate until enough real days exist', () => {
    expect(calculateBaseline({ smokingLogs: [18, 16, 17], onboardingEstimate: 20 })).toBe(20);
    expect(calculateBaseline({ smokingLogs: [18, 16, 17, 15], onboardingEstimate: 20 })).toBe(17);
  });

  it('reduces by about ten percent with at least a one-cigarette drop', () => {
    expect(calculateNextTarget(20)).toBe(18);
    expect(calculateNextTarget(5)).toBe(4);
    expect(calculateNextTarget(1)).toBe(1);
  });

  it('never automatically moves the user from one cigarette to zero', () => {
    const review = buildWeeklyReview({ dailyCounts: [1, 1, 1, 1, 1], target: 1 });
    expect(review.action).toBe('offer_quit_transition');
    expect(review.nextTarget).toBe(1);
  });

  it('holds after one struggling review and only offers a gentler adjustment after two', () => {
    const first = buildWeeklyReview({ dailyCounts: [8, 9, 8, 10, 9], target: 6 });
    const second = buildWeeklyReview({
      dailyCounts: [8, 9, 8, 10, 9],
      target: 6,
      previousReviewStatus: 'struggling',
    });

    expect(first.action).toBe('hold');
    expect(first.nextTarget).toBe(6);
    expect(second.action).toBe('offer_adjustment');
    expect(second.nextTarget).toBe(7);
  });

  it('creates and advances a plan only when the review supports a reduction', () => {
    const initial = createInitialReductionPlan({ onboardingEstimate: 20 });
    const next = applyWeeklyReview(initial, [18, 18, 17, 18, 16, 18]);

    expect(initial.currentTarget).toBe(18);
    expect(next.currentTarget).toBe(16);
    expect(next.stage).toBe(2);
    expect(next.targetChanged).toBe(true);
  });

  it('summarizes current target progress without treating over-target as reset', () => {
    expect(summarizeToday({ smoked: 5, target: 8 })).toMatchObject({
      remaining: 3,
      overBy: 0,
      status: 'under',
    });
    expect(summarizeToday({ smoked: 10, target: 8 })).toMatchObject({
      remaining: 0,
      overBy: 2,
      status: 'over',
    });
  });

  it('reports reduction progress from the original baseline', () => {
    expect(getReductionProgress({ baseline: 20, currentTarget: 15 })).toEqual({
      baseline: 20,
      currentTarget: 15,
      cigarettesReduced: 5,
      percentReduced: 25,
      atMinimumAutomaticTarget: false,
    });
  });
});
