import { z } from 'zod';

export const notificationPreferencesSchema = z.object({
  userId: z.string().uuid(),
  dailyCheckinEnabled: z.boolean(),
  dailyCheckinHour: z.number().int().min(0).max(23),
  dailyCheckinMinute: z.number().int().min(0).max(59),
  weeklyReflectionEnabled: z.boolean(),
  weeklyReflectionWeekday: z.number().int().min(1).max(7),
  weeklyReflectionHour: z.number().int().min(0).max(23),
  weeklyReflectionMinute: z.number().int().min(0).max(59),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const reminderKindSchema = z.enum(['daily-checkin', 'weekly-reflection']);
export type ReminderKind = z.infer<typeof reminderKindSchema>;

export function parseReminderKind(value: unknown): ReminderKind | null {
  const parsed = reminderKindSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const weekdayLabels: Record<number, string> = {
  1: 'Sunday',
  2: 'Monday',
  3: 'Tuesday',
  4: 'Wednesday',
  5: 'Thursday',
  6: 'Friday',
  7: 'Saturday',
};

export function defaultNotificationPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    dailyCheckinEnabled: false,
    dailyCheckinHour: 20,
    dailyCheckinMinute: 0,
    weeklyReflectionEnabled: false,
    weeklyReflectionWeekday: 1,
    weeklyReflectionHour: 19,
    weeklyReflectionMinute: 0,
  };
}

export function formatReminderTime(hour: number, minute: number): string {
  const safeHour = Math.min(23, Math.max(0, Math.trunc(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.trunc(minute)));
  const suffix = safeHour >= 12 ? 'PM' : 'AM';
  const displayHour = safeHour % 12 || 12;
  return `${displayHour}:${String(safeMinute).padStart(2, '0')} ${suffix}`;
}

export function hasAnyReminderEnabled(preferences: NotificationPreferences): boolean {
  return preferences.dailyCheckinEnabled || preferences.weeklyReflectionEnabled;
}

export type ReminderJourneyMode = 'quit' | 'reduce' | 'track';

export type ReminderSuggestion = {
  id: 'daily-context' | 'craving-evening' | 'weekly-reflection';
  title: string;
  body: string;
  reason: string;
  ctaLabel: string;
  patch: Partial<NotificationPreferences>;
};

export function buildReminderSuggestion(input: {
  preferences: NotificationPreferences;
  journeyMode: ReminderJourneyMode;
  checkedInToday: boolean;
  recentCravings: number;
}): ReminderSuggestion | null {
  const { preferences, journeyMode, checkedInToday, recentCravings } = input;

  if (!preferences.dailyCheckinEnabled) {
    if (recentCravings > 0) {
      return {
        id: 'craving-evening',
        title: 'Add an evening support checkpoint',
        body: 'Recent craving logs make a gentle evening check-in more useful than a generic reminder.',
        reason: `${recentCravings} recent craving log${recentCravings === 1 ? '' : 's'} found`,
        ctaLabel: 'Use 6:00 PM daily check-in',
        patch: {
          dailyCheckinEnabled: true,
          dailyCheckinHour: 18,
          dailyCheckinMinute: 0,
        },
      };
    }

    return {
      id: 'daily-context',
      title: checkedInToday ? 'Keep daily context easy' : 'Add one daily context prompt',
      body:
        journeyMode === 'track'
          ? 'A late check-in helps Reclaim understand the day without asking you to change anything yet.'
          : 'A small daily check-in gives Reclaim context before cravings or progress are interpreted.',
      reason: checkedInToday ? 'You already checked in today' : 'No check-in logged today',
      ctaLabel: journeyMode === 'track' ? 'Use 9:30 PM daily check-in' : 'Use 8:00 PM daily check-in',
      patch: {
        dailyCheckinEnabled: true,
        dailyCheckinHour: journeyMode === 'track' ? 21 : 20,
        dailyCheckinMinute: journeyMode === 'track' ? 30 : 0,
      },
    };
  }

  if (!preferences.weeklyReflectionEnabled && journeyMode !== 'quit') {
    return {
      id: 'weekly-reflection',
      title: 'Review patterns once a week',
      body: 'Reduce and Track modes work better when weekly logs are reviewed as patterns, not judged one day at a time.',
      reason: `${journeyMode === 'reduce' ? 'Reduce' : 'Track'} mode is active`,
      ctaLabel: 'Use Sunday 7:00 PM reflection',
      patch: {
        weeklyReflectionEnabled: true,
        weeklyReflectionWeekday: 1,
        weeklyReflectionHour: 19,
        weeklyReflectionMinute: 0,
      },
    };
  }

  return null;
}

export function applyReminderSuggestion(
  preferences: NotificationPreferences,
  suggestion: ReminderSuggestion,
): NotificationPreferences {
  return {
    ...preferences,
    ...suggestion.patch,
  };
}
