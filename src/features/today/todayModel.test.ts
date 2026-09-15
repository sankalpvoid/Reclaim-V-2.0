import { describe, expect, it } from 'vitest';

import type { Profile } from '../profile/profile';
import {
  buildQuitTodaySummary,
  buildSmokingTodaySummary,
  formatAvoidedCigarettes,
  formatSmokeFreeDuration,
} from './todayModel';

const profile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  quit_date: '2026-09-14T12:00:00.000Z',
  cigarettes_per_day: 20,
  price_per_cigarette: 15,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
  price_per_pack: 300,
  cigarettes_per_pack: 20,
  minutes_per_cigarette: 11,
  currency_symbol: '₹',
  country: 'IN',
  attempt_number: 1,
  best_streak_seconds: 0,
  journey_mode: 'quit',
  daily_target: null,
  display_name: 'Test',
  onboarding_completed: true,
};

describe('Today model', () => {
  it('formats a smoke-free duration without overstating partial days', () => {
    expect(formatSmokeFreeDuration(90 * 60_000)).toBe('1h 30m');
    expect(formatSmokeFreeDuration(26 * 60 * 60_000)).toBe('1d 2h');
  });

  it('keeps very early cigarettes-avoided progress visible', () => {
    expect(formatAvoidedCigarettes(0)).toBe('0');
    expect(formatAvoidedCigarettes(0.22)).toBe('0.2');
    expect(formatAvoidedCigarettes(20.8)).toBe('20');
  });

  it('builds quit-mode labels from the shared progress domain', () => {
    const summary = buildQuitTodaySummary(profile, new Date('2026-09-15T12:00:00.000Z'));
    expect(summary).not.toBeNull();
    expect(summary?.durationLabel).toBe('1d 0h');
    expect(summary?.avoidedLabel).toBe('20');
    expect(summary?.moneyLabel).toBe('₹300');
    expect(summary?.timeLabel).toBe('3h 40m');
  });

  it('builds reduce-mode target progress from actual logs', () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    const today = new Date(2026, 8, 15, 8, 0, 0);
    const yesterday = new Date(2026, 8, 14, 8, 0, 0);
    const summary = buildSmokingTodaySummary(
      { ...profile, journey_mode: 'reduce', daily_target: 8 },
      [
        { smokedAt: yesterday, cigarettes: 3 },
        { smokedAt: today, cigarettes: 5 },
      ],
      8,
      now,
    );

    expect(summary.todayCount).toBe(5);
    expect(summary.targetProgress).toMatchObject({ remaining: 3, overBy: 0 });
    expect(summary.knownDays).toBe(2);
  });
});
