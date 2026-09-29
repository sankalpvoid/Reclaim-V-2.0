import { describe, expect, it } from 'vitest';

import {
  analyticsPlatform,
  analyticsScreenFromPath,
  clientErrorOperationSchema,
} from './analyticsModel';

describe('analytics model', () => {
  it('maps known app routes to a fixed screen vocabulary', () => {
    expect(analyticsScreenFromPath('/')).toBe('today');
    expect(analyticsScreenFromPath('/insights')).toBe('insights');
    expect(analyticsScreenFromPath('/(app)/community')).toBe('community');
    expect(analyticsScreenFromPath('/notifications/')).toBe('notifications');
    expect(analyticsScreenFromPath('/(app)/journey')).toBe('journey');
  });

  it('does not export unknown route text', () => {
    expect(analyticsScreenFromPath('/article/private-user-value')).toBeNull();
    expect(analyticsScreenFromPath('/unexpected?token=secret')).toBeNull();
  });

  it('keeps operational error names on a fixed allowlist', () => {
    expect(clientErrorOperationSchema.parse('notification_response')).toBe('notification_response');
    expect(clientErrorOperationSchema.safeParse('notification_payload_with_private_data').success).toBe(false);
  });

  it('normalizes platform values to an allowlist', () => {
    expect(analyticsPlatform('ios')).toBe('ios');
    expect(analyticsPlatform('android')).toBe('android');
    expect(analyticsPlatform('windows')).toBe('unknown');
  });
});
