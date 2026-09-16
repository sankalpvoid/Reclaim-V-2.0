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
