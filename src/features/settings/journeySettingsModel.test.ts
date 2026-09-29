import { describe, expect, it } from 'vitest';

import type { Profile } from '@/features/profile/profile';
import { buildJourneyTransition } from './journeySettingsModel';

const profile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  quit_date: '2026-09-01T12:00:00.000Z',
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

describe('journey settings model', () => {
  it('starts a quit journey from the chosen date', () => {
    const date = new Date('2026-09-15T10:00:00.000Z');
    expect(
      buildJourneyTransition(profile, 'quit', date, new Date('2026-09-16T12:00:00.000Z')),
    ).toEqual({
      journeyMode: 'quit',
      quitDate: date.toISOString(),
      dailyTarget: null,
    });
  });

  it('creates a fresh gentle target for Reduce', () => {
    expect(
      buildJourneyTransition(
        profile,
        'reduce',
        new Date('2026-09-15T10:00:00.000Z'),
        new Date('2026-09-16T12:00:00.000Z'),
      ),
    ).toMatchObject({
      journeyMode: 'reduce',
      quitDate: null,
      dailyTarget: 18,
    });
  });

  it('clears active quit and reduction state for Track', () => {
    expect(
      buildJourneyTransition(
        profile,
        'track',
        new Date('2026-09-15T10:00:00.000Z'),
        new Date('2026-09-16T12:00:00.000Z'),
      ),
    ).toEqual({
      journeyMode: 'track',
      quitDate: null,
      dailyTarget: null,
    });
  });

  it('rejects a future quit time', () => {
    expect(() =>
      buildJourneyTransition(
        profile,
        'quit',
        new Date('2026-09-17T12:00:00.000Z'),
        new Date('2026-09-16T12:00:00.000Z'),
      ),
    ).toThrow('future');
  });
});
