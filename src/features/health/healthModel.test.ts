import { describe, expect, it } from 'vitest';

import { buildHealthRecovery, formatRecoveryElapsed, type HealthMilestone } from './healthModel';

const milestones: HealthMilestone[] = [
  {
    id: 1,
    title: '20 minutes',
    description: 'First milestone',
    minutes_after_quitting: 20,
    source_name: 'Source',
    source_url: null,
  },
  {
    id: 2,
    title: '12 hours',
    description: 'Second milestone',
    minutes_after_quitting: 720,
    source_name: 'Source',
    source_url: null,
  },
  {
    id: 3,
    title: '24 hours',
    description: 'Third milestone',
    minutes_after_quitting: 1440,
    source_name: 'Source',
    source_url: null,
  },
];

describe('buildHealthRecovery', () => {
  it('marks reached milestones and calculates progress to the next one', () => {
    const quitDate = '2026-09-15T00:00:00.000Z';
    const now = new Date('2026-09-15T06:00:00.000Z');
    const recovery = buildHealthRecovery(quitDate, milestones, now);

    expect(recovery.reachedCount).toBe(1);
    expect(recovery.nextMilestone?.id).toBe(2);
    expect(recovery.intervalProgress).toBeCloseTo((360 - 20) / (720 - 20));
    expect(recovery.milestones.map((milestone) => milestone.reached)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('clamps future quit dates to zero elapsed progress', () => {
    const recovery = buildHealthRecovery(
      '2026-09-16T00:00:00.000Z',
      milestones,
      new Date('2026-09-15T00:00:00.000Z'),
    );

    expect(recovery.elapsedMinutes).toBe(0);
    expect(recovery.reachedCount).toBe(0);
    expect(recovery.intervalProgress).toBe(0);
  });

  it('reports completion after the final listed milestone', () => {
    const recovery = buildHealthRecovery(
      '2026-09-01T00:00:00.000Z',
      milestones,
      new Date('2026-09-20T00:00:00.000Z'),
    );

    expect(recovery.nextMilestone).toBeNull();
    expect(recovery.intervalProgress).toBe(1);
    expect(recovery.reachedCount).toBe(3);
  });
});

describe('formatRecoveryElapsed', () => {
  it('formats useful elapsed units without false precision', () => {
    expect(formatRecoveryElapsed(18)).toBe('18m');
    expect(formatRecoveryElapsed(180)).toBe('3h');
    expect(formatRecoveryElapsed(4_320)).toBe('3d');
    expect(formatRecoveryElapsed(129_600)).toBe('3mo');
  });
});
