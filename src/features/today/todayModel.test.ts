import { describe, expect, it } from 'vitest';

import type { Profile } from '../profile/profile';
import {
  buildPersonalizedToday,
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

  it('prioritizes a daily check-in when Today has no context yet', () => {
    const summary = buildPersonalizedToday({
      mode: 'quit',
      checkins: [],
      cravings: [],
      goals: [],
      moneyReclaimed: 300,
      currencySymbol: '₹',
      now: new Date(2026, 8, 15, 12, 0, 0),
    });

    expect(summary.focus.kind).toBe('checkin');
    expect(summary.moodLabel).toBe('Not checked in');
    expect(summary.cravingsToday).toBe(0);
  });

  it('prioritizes support after a recent craving', () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    const summary = buildPersonalizedToday({
      mode: 'quit',
      checkins: [
        {
          id: 'checkin-1',
          clientId: '00000000-0000-4000-8000-202609150000',
          mood: 'okay',
          note: null,
          createdAt: now.toISOString(),
        },
      ],
      cravings: [
        {
          id: 'craving-1',
          resisted: true,
          toolkit: 'water',
          tool_feedback: 'yes',
          duration_seconds: 60,
          created_at: new Date(now.getTime() - 30 * 60_000).toISOString(),
        },
      ],
      goals: [],
      moneyReclaimed: 300,
      currencySymbol: '₹',
      now,
    });

    expect(summary.focus.kind).toBe('support');
    expect(summary.cravingsToday).toBe(1);
    expect(summary.resistedToday).toBe(1);
  });

  it('surfaces the next savings goal after the user has checked in', () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    const summary = buildPersonalizedToday({
      mode: 'quit',
      checkins: [
        {
          id: 'checkin-1',
          clientId: '00000000-0000-4000-8000-202609150000',
          mood: 'great',
          note: null,
          createdAt: now.toISOString(),
        },
      ],
      cravings: [],
      goals: [
        {
          id: '00000000-0000-4000-8000-000000000010',
          user_id: profile.id,
          name: 'Headphones',
          target_amount: 1000,
          current_amount: 0,
          achieved: false,
          created_at: now.toISOString(),
        },
      ],
      moneyReclaimed: 300,
      currencySymbol: '₹',
      now,
    });

    expect(summary.focus.kind).toBe('goal');
    expect(summary.goalSignal?.progressPercent).toBe(30);
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
