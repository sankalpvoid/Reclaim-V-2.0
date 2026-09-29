import { describe, expect, it } from 'vitest';

import {
  analyticsPlatform,
  analyticsScreenFromPath,
  clientErrorOperationSchema,
  communityEngagementSchema,
  forYouActionSchema,
} from './analyticsModel';

describe('analytics model', () => {
  it('maps known app routes to a fixed screen vocabulary', () => {
    expect(analyticsScreenFromPath('/')).toBe('today');
    expect(analyticsScreenFromPath('/insights')).toBe('insights');
    expect(analyticsScreenFromPath('/(app)/community')).toBe('community');
    expect(analyticsScreenFromPath('/notifications/')).toBe('notifications');
    expect(analyticsScreenFromPath('/(app)/journey')).toBe('journey');
    expect(analyticsScreenFromPath('/(app)/privacy')).toBe('privacy');
  });

  it('does not export unknown route text', () => {
    expect(analyticsScreenFromPath('/article/private-user-value')).toBeNull();
    expect(analyticsScreenFromPath('/unexpected?token=secret')).toBeNull();
  });

  it('keeps operational error names on a fixed allowlist', () => {
    expect(clientErrorOperationSchema.parse('notification_response')).toBe('notification_response');
    expect(clientErrorOperationSchema.safeParse('notification_payload_with_private_data').success).toBe(false);
  });

  it('keeps product engagement properties on fixed allowlists', () => {
    expect(forYouActionSchema.parse('support')).toBe('support');
    expect(forYouActionSchema.safeParse('private free text').success).toBe(false);
    expect(communityEngagementSchema.parse('cheer')).toBe('cheer');
    expect(communityEngagementSchema.safeParse('post-123').success).toBe(false);
  });

  it('normalizes platform values to an allowlist', () => {
    expect(analyticsPlatform('ios')).toBe('ios');
    expect(analyticsPlatform('android')).toBe('android');
    expect(analyticsPlatform('windows')).toBe('unknown');
  });
});
