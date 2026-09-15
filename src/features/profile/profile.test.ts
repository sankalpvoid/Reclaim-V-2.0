import { describe, expect, it } from 'vitest';

import { profileSchema } from './profile';

const validProfile = {
  id: '6f4070dd-40b5-40cf-9bd1-69bd0b695bb8',
  quit_date: null,
  cigarettes_per_day: 10,
  price_per_cigarette: 20,
  created_at: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
  price_per_pack: 400,
  cigarettes_per_pack: 20,
  minutes_per_cigarette: 11,
  currency_symbol: '₹',
  country: 'IN',
  attempt_number: 1,
  best_streak_seconds: 0,
  journey_mode: 'quit',
  daily_target: null,
  display_name: 'Test user',
  onboarding_completed: false,
};

describe('profileSchema', () => {
  it('accepts the current Reclaim profile contract', () => {
    expect(profileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it('rejects unknown journey modes', () => {
    expect(
      profileSchema.safeParse({ ...validProfile, journey_mode: 'pause' }).success,
    ).toBe(false);
  });
});
