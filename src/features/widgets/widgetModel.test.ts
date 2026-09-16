import { describe, expect, it } from 'vitest';

import type { Profile } from '@/features/profile/profile';
import { buildReclaimWidgetSnapshot } from './widgetModel';

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

describe('Reclaim widget snapshot', () => {
  it('reuses quit metrics for a trustworthy glance', () => {
    expect(buildReclaimWidgetSnapshot(profile, new Date('2026-09-15T12:00:00.000Z'))).toEqual({
      mode: 'quit',
      eyebrow: 'SMOKE-FREE',
      primary: '1d 0h',
      secondary: '₹300 reclaimed',
    });
  });

  it('does not invent reduce-mode progress without smoking logs', () => {
    expect(buildReclaimWidgetSnapshot({ ...profile, journey_mode: 'reduce' })).toEqual({
      mode: 'reduce',
      eyebrow: 'SMOKE LESS',
      primary: 'Today matters',
      secondary: 'Open Reclaim to log honestly',
    });
  });

  it('does not invent track-mode progress without smoking logs', () => {
    expect(buildReclaimWidgetSnapshot({ ...profile, journey_mode: 'track' })).toEqual({
      mode: 'track',
      eyebrow: 'UNDERSTAND',
      primary: 'Notice the pattern',
      secondary: 'Open Reclaim to log honestly',
    });
  });
});
