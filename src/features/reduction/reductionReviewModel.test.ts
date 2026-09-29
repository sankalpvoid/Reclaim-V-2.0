import { describe, expect, it } from 'vitest';

import {
  buildReductionReviewState,
  reductionReviewSchedule,
  type ReductionReviewPlan,
} from './reductionReviewModel';

const plan: ReductionReviewPlan = {
  baseline: 20,
  current_target: 18,
  stage: 1,
  review_start: '2026-09-15',
  last_review_status: null,
  target_history: [{ from: '2026-09-15', target: 18 }],
  review_window_days: 7,
};

describe('reduction review model', () => {
  it('waits for a full review window', () => {
    expect(
      reductionReviewSchedule('2026-09-15', 7, new Date(2026, 8, 20, 12)),
    ).toEqual({ due: false, daysRemaining: 2 });

    expect(
      reductionReviewSchedule('2026-09-15', 7, new Date(2026, 8, 22, 12)),
    ).toEqual({ due: true, daysRemaining: 0 });
  });

  it('reviews completed days only and ignores unlogged days', () => {
    const now = new Date(2026, 8, 22, 10);
    const events = [
      { smokedAt: new Date(2026, 8, 15, 12), cigarettes: 17 },
      { smokedAt: new Date(2026, 8, 16, 12), cigarettes: 18 },
      { smokedAt: new Date(2026, 8, 18, 12), cigarettes: 17 },
      { smokedAt: new Date(2026, 8, 21, 12), cigarettes: 18 },
    ];

    const state = buildReductionReviewState({ plan, events, now });

    expect(state.due).toBe(true);
    expect(state.knownDays).toBe(4);
    expect(state.review?.status).toBe('stable');
    expect(state.review?.action).toBe('reduce');
    expect(state.review?.nextTarget).toBe(16);
  });

  it('asks for more real logs instead of treating missing days as zero', () => {
    const state = buildReductionReviewState({
      plan,
      events: [
        { smokedAt: new Date(2026, 8, 18, 12), cigarettes: 17 },
        { smokedAt: new Date(2026, 8, 21, 12), cigarettes: 18 },
      ],
      now: new Date(2026, 8, 22, 10),
    });

    expect(state.review?.status).toBe('collect_more_data');
    expect(state.review?.loggedDays).toBe(2);
  });
});
