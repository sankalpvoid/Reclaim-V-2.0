import { describe, expect, it } from 'vitest';

import { analyticsPlatform, analyticsScreenFromPath } from './analyticsModel';

describe('analytics model', () => {
  it('maps known app routes to a fixed screen vocabulary', () => {
    expect(analyticsScreenFromPath('/')).toBe('today');
    expect(analyticsScreenFromPath('/insights')).toBe('insights');
    expect(analyticsScreenFromPath('/(app)/community')).toBe('community');
    expect(analyticsScreenFromPath('/notifications/')).toBe('notifications');
  });

  it('does not export unknown route text', () => {
    expect(analyticsScreenFromPath('/article/private-user-value')).toBeNull();
    expect(analyticsScreenFromPath('/unexpected?token=secret')).toBeNull();
  });

  it('normalizes platform values to an allowlist', () => {
    expect(analyticsPlatform('ios')).toBe('ios');
    expect(analyticsPlatform('android')).toBe('android');
    expect(analyticsPlatform('windows')).toBe('unknown');
  });
});
