import { describe, expect, it } from 'vitest';

import {
  applyReminderSuggestion,
  buildReminderSuggestion,
  defaultNotificationPreferences,
  formatReminderTime,
  hasAnyReminderEnabled,
  parseReminderKind,
} from './notificationModel';

const userId = 'aa247316-da02-4369-ae73-e8e1e79d8816';

describe('notificationModel', () => {
  it('keeps every reminder off by default', () => {
    const preferences = defaultNotificationPreferences(userId);
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
      ...defaultNotificationPreferences(userId),
      dailyCheckinEnabled: true,
    };
    expect(hasAnyReminderEnabled(preferences)).toBe(true);
  });

  it('suggests an evening daily check-in when recent cravings exist', () => {
    const suggestion = buildReminderSuggestion({
      preferences: defaultNotificationPreferences(userId),
      journeyMode: 'quit',
      checkedInToday: false,
      recentCravings: 2,
    });

    expect(suggestion).toMatchObject({
      id: 'craving-evening',
      patch: {
        dailyCheckinEnabled: true,
        dailyCheckinHour: 18,
        dailyCheckinMinute: 0,
      },
    });
  });

  it('uses a later daily check-in for Track mode when there are no craving logs', () => {
    const suggestion = buildReminderSuggestion({
      preferences: defaultNotificationPreferences(userId),
      journeyMode: 'track',
      checkedInToday: false,
      recentCravings: 0,
    });

    expect(suggestion).toMatchObject({
      id: 'daily-context',
      patch: {
        dailyCheckinEnabled: true,
        dailyCheckinHour: 21,
        dailyCheckinMinute: 30,
      },
    });
  });

  it('suggests weekly reflection for Reduce mode after daily reminders are already enabled', () => {
    const preferences = {
      ...defaultNotificationPreferences(userId),
      dailyCheckinEnabled: true,
    };
    const suggestion = buildReminderSuggestion({
      preferences,
      journeyMode: 'reduce',
      checkedInToday: true,
      recentCravings: 0,
    });

    expect(suggestion).toMatchObject({
      id: 'weekly-reflection',
      patch: {
        weeklyReflectionEnabled: true,
        weeklyReflectionWeekday: 1,
        weeklyReflectionHour: 19,
        weeklyReflectionMinute: 0,
      },
    });
  });

  it('applies a reminder suggestion without losing existing preferences', () => {
    const preferences = {
      ...defaultNotificationPreferences(userId),
      weeklyReflectionEnabled: true,
      weeklyReflectionWeekday: 6,
    };
    const suggestion = buildReminderSuggestion({
      preferences,
      journeyMode: 'quit',
      checkedInToday: false,
      recentCravings: 1,
    });

    expect(suggestion).not.toBeNull();
    const next = applyReminderSuggestion(preferences, suggestion!);
    expect(next.dailyCheckinEnabled).toBe(true);
    expect(next.weeklyReflectionEnabled).toBe(true);
    expect(next.weeklyReflectionWeekday).toBe(6);
  });
});
