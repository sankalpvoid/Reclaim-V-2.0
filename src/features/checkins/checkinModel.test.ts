import { describe, expect, it } from 'vitest';

import {
  buildMoodHistory,
  dailyCheckinClientId,
  type Checkin,
} from './checkinModel';

function row(input: Partial<Checkin> & Pick<Checkin, 'mood' | 'createdAt'>): Checkin {
  return {
    id: input.id ?? crypto.randomUUID(),
    clientId: input.clientId ?? crypto.randomUUID(),
    note: input.note ?? null,
    mood: input.mood,
    createdAt: input.createdAt,
  };
}

describe('check-in model', () => {
  it('creates a stable UUID-shaped client id for a local calendar day', () => {
    expect(dailyCheckinClientId(new Date(2026, 8, 15, 20, 0, 0))).toBe(
      '00000000-0000-4000-8000-202609150000',
    );
  });

  it('uses the latest check-in when more than one event exists on the same day', () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    const summary = buildMoodHistory(
      [
        row({ mood: 'okay', createdAt: new Date(2026, 8, 15, 8, 0, 0).toISOString() }),
        row({ mood: 'great', createdAt: new Date(2026, 8, 15, 10, 0, 0).toISOString() }),
      ],
      7,
      now,
    );

    expect(summary.loggedDays).toBe(1);
    expect(summary.days.at(-1)?.mood).toBe('great');
    expect(summary.counts.great).toBe(1);
    expect(summary.counts.okay).toBe(0);
  });

  it('keeps missing days unknown instead of inventing a mood', () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    const summary = buildMoodHistory(
      [row({ mood: 'struggling', createdAt: new Date(2026, 8, 14, 9, 0, 0).toISOString() })],
      3,
      now,
    );

    expect(summary.loggedDays).toBe(1);
    expect(summary.days.map((day) => day.mood)).toEqual([null, 'struggling', null]);
    expect(summary.mostCommonMood).toBe('struggling');
  });
});
