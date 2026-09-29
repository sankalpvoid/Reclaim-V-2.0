import { describe, expect, it } from 'vitest';

import {
  postBodySchema,
  replyBodySchema,
  selectCommunityCircle,
  smokeFreeDaysFromQuitDate,
  type CommunityCircle,
} from './communityModel';

const circles: CommunityCircle[] = [
  { id: 'a', name: 'First 72 Hours', journeyMode: 'quit', minSmokeFreeDays: 0, maxSmokeFreeDays: 2, description: null },
  { id: 'b', name: 'First Week', journeyMode: 'quit', minSmokeFreeDays: 3, maxSmokeFreeDays: 6, description: null },
  { id: 'c', name: 'First Month', journeyMode: 'quit', minSmokeFreeDays: 7, maxSmokeFreeDays: 29, description: null },
  { id: 'd', name: '30 Days & Beyond', journeyMode: 'quit', minSmokeFreeDays: 30, maxSmokeFreeDays: null, description: null },
];

describe('community model', () => {
  it('selects the correct stage circle', () => {
    expect(selectCommunityCircle(circles, 2)?.id).toBe('a');
    expect(selectCommunityCircle(circles, 3)?.id).toBe('b');
    expect(selectCommunityCircle(circles, 12)?.id).toBe('c');
    expect(selectCommunityCircle(circles, 90)?.id).toBe('d');
  });

  it('clamps a future quit date to zero smoke-free days', () => {
    expect(
      smokeFreeDaysFromQuitDate('2026-09-20T00:00:00.000Z', new Date('2026-09-16T00:00:00.000Z')),
    ).toBe(0);
  });

  it('mirrors database post and reply limits', () => {
    expect(postBodySchema.parse('  small win  ')).toBe('small win');
    expect(replyBodySchema.safeParse(' ').success).toBe(false);
    expect(postBodySchema.safeParse('x'.repeat(1001)).success).toBe(false);
    expect(replyBodySchema.safeParse('x'.repeat(501)).success).toBe(false);
  });
});
