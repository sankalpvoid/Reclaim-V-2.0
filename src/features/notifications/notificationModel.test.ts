import { describe, expect, it } from 'vitest';

import {
  defaultNotificationPreferences,
  formatReminderTime,
  hasAnyReminderEnabled,
  parseReminderKind,
} from './notificationModel';

describe('notificationModel', () => {
  it('keeps every reminder off by default', () => {
    const preferences = defaultNotificationPreferences('aa247316-da02-4369-ae73-e8e1e79d8816');
    expect(preferences.dailyCheckinEnabled).toBe(false);
    expect(preferences.weeklyReflectionEnabled).toBe(false);
    expect(hasAnyReminderEnabled(preferences)).toBe(false);
  });

  it('formats reminder times without depending on device locale', () => {
    expect(formatReminderTime(0, 5)).toBe('12:05 AM');
    expect(formatReminderTime(12, 0)).toBe('12:00 PM');
    expect(formatReminderTime(21, 30)).toBe('9:30 PM');
  });

  it('accepts only known reminder kinds from notification payloads', () => {
    expect(parseReminderKind('daily-checkin')).toBe('daily-checkin');
    expect(parseReminderKind('weekly-reflection')).toBe('weekly-reflection');
    expect(parseReminderKind('other')).toBeNull();
    expect(parseReminderKind(undefined)).toBeNull();
  });

  it('reports when at least one reminder is enabled', () => {
    const preferences = {
      ...defaultNotificationPreferences('aa247316-da02-4369-ae73-e8e1e79d8816'),
      dailyCheckinEnabled: true,
    };
    expect(hasAnyReminderEnabled(preferences)).toBe(true);
  });
});
