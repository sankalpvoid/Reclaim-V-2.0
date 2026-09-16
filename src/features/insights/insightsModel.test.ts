import { describe, expect, it } from 'vitest';

import { buildInsights } from './insightsModel';

describe('buildInsights', () => {
  it('does not invent patterns from too little data', () => {
    const insights = buildInsights(
      [{ smoked_at: '2026-09-15T18:00:00Z', event_type: 'craving' }],
      [{ mood: 'great', created_at: '2026-09-15T12:00:00Z' }],
      new Date('2026-09-16T12:00:00Z'),
    );

    expect(insights).toEqual([]);
  });

  it('surfaces a repeated craving time window', () => {
    const insights = buildInsights(
      [
        { smoked_at: '2026-09-13T18:00:00', event_type: 'craving' },
        { smoked_at: '2026-09-14T19:00:00', event_type: 'craving' },
        { smoked_at: '2026-09-15T20:00:00', event_type: 'craving' },
        { smoked_at: '2026-09-15T10:00:00', event_type: 'craving' },
      ],
      [],
      new Date('2026-09-16T12:00:00Z'),
    );

    expect(insights.some((insight) => insight.id === 'craving-time')).toBe(true);
  });

  it('uses repeated tool feedback before recommending a coping tool', () => {
    const insights = buildInsights(
      [
        { smoked_at: '2026-09-13T18:00:00Z', event_type: 'craving', toolkit: 'timer', tool_feedback: 'yes' },
        { smoked_at: '2026-09-14T18:00:00Z', event_type: 'craving', toolkit: 'timer', tool_feedback: 'a_little' },
        { smoked_at: '2026-09-15T18:00:00Z', event_type: 'craving', toolkit: 'breathe', tool_feedback: 'not_really' },
      ],
      [],
      new Date('2026-09-16T12:00:00Z'),
    );

    expect(insights.find((insight) => insight.id === 'tool-effectiveness')?.title).toContain('Ride the wave');
  });

  it('compares the last seven days with the previous seven days', () => {
    const event = (iso: string) => ({ smoked_at: iso, event_type: 'smoked' });
    const insights = buildInsights(
      [
        event('2026-09-03T12:00:00Z'),
        event('2026-09-04T12:00:00Z'),
        event('2026-09-05T12:00:00Z'),
        event('2026-09-06T12:00:00Z'),
        event('2026-09-13T12:00:00Z'),
        event('2026-09-15T12:00:00Z'),
      ],
      [],
      new Date('2026-09-16T12:00:00Z'),
    );

    expect(insights.some((insight) => insight.id === 'smoking-trend')).toBe(true);
  });

  it('uses cigarette quantities rather than event row counts', () => {
    const insights = buildInsights(
      [
        { smoked_at: '2026-09-03T12:00:00Z', event_type: 'smoked', cigarettes: 2 },
        { smoked_at: '2026-09-04T12:00:00Z', event_type: 'smoked', cigarettes: 3 },
        { smoked_at: '2026-09-14T12:00:00Z', event_type: 'smoked', cigarettes: 2 },
      ],
      [],
      new Date('2026-09-16T12:00:00Z'),
    );

    expect(insights.find((insight) => insight.id === 'smoking-trend')?.evidence).toContain('5 → 2');
  });
});
