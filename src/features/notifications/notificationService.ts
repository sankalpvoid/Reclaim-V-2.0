import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { z } from 'zod';

import { supabase } from '@/core/supabase/client';
import {
  defaultNotificationPreferences,
  hasAnyReminderEnabled,
  notificationPreferencesSchema,
  type NotificationPreferences,
} from './notificationModel';

const notificationPreferenceRowSchema = z.object({
  user_id: z.string().uuid(),
  daily_checkin_enabled: z.boolean(),
  daily_checkin_hour: z.coerce.number().int(),
  daily_checkin_minute: z.coerce.number().int(),
  weekly_reflection_enabled: z.boolean(),
  weekly_reflection_weekday: z.coerce.number().int(),
  weekly_reflection_hour: z.coerce.number().int(),
  weekly_reflection_minute: z.coerce.number().int(),
});

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';
export type ReminderKind = 'daily-checkin' | 'weekly-reflection';

export const notificationKeys = {
  preferences: (userId: string) => ['notifications', 'preferences', userId] as const,
};

function fromRow(row: z.infer<typeof notificationPreferenceRowSchema>): NotificationPreferences {
  return notificationPreferencesSchema.parse({
    userId: row.user_id,
    dailyCheckinEnabled: row.daily_checkin_enabled,
    dailyCheckinHour: row.daily_checkin_hour,
    dailyCheckinMinute: row.daily_checkin_minute,
    weeklyReflectionEnabled: row.weekly_reflection_enabled,
    weeklyReflectionWeekday: row.weekly_reflection_weekday,
    weeklyReflectionHour: row.weekly_reflection_hour,
    weeklyReflectionMinute: row.weekly_reflection_minute,
  });
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'user_id, daily_checkin_enabled, daily_checkin_hour, daily_checkin_minute, weekly_reflection_enabled, weekly_reflection_weekday, weekly_reflection_hour, weekly_reflection_minute',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(notificationPreferenceRowSchema.parse(data)) : defaultNotificationPreferences(userId);
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const parsed = notificationPreferencesSchema.parse(preferences);
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: parsed.userId,
        daily_checkin_enabled: parsed.dailyCheckinEnabled,
        daily_checkin_hour: parsed.dailyCheckinHour,
        daily_checkin_minute: parsed.dailyCheckinMinute,
        weekly_reflection_enabled: parsed.weeklyReflectionEnabled,
        weekly_reflection_weekday: parsed.weeklyReflectionWeekday,
        weekly_reflection_hour: parsed.weeklyReflectionHour,
        weekly_reflection_minute: parsed.weeklyReflectionMinute,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select(
      'user_id, daily_checkin_enabled, daily_checkin_hour, daily_checkin_minute, weekly_reflection_enabled, weekly_reflection_weekday, weekly_reflection_hour, weekly_reflection_minute',
    )
    .single();

  if (error) throw error;
  return fromRow(notificationPreferenceRowSchema.parse(data));
}

export function configureNotificationPresentation(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') return 'unsupported';
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status === 'granted') return 'granted';
  if (permission.status === 'denied') return 'denied';
  return 'undetermined';
}

async function ensureNotificationPermission(requestPermission: boolean): Promise<NotificationPermissionState> {
  let status = await getNotificationPermissionState();
  if (status === 'unsupported' || status === 'granted' || !requestPermission) return status;

  const requested = await Notifications.requestPermissionsAsync();
  status = requested.status === 'granted' ? 'granted' : requested.status === 'denied' ? 'denied' : 'undetermined';
  return status;
}

async function cancelReminderSchedules(kind: ReminderKind): Promise<void> {
  if (Platform.OS === 'web') return;
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const matching = requests.filter(
    (request) => request.content.data?.reclaimReminder === kind,
  );
  await Promise.all(
    matching.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

export async function cancelAllReclaimReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all([
    cancelReminderSchedules('daily-checkin'),
    cancelReminderSchedules('weekly-reflection'),
  ]);
}

async function scheduleDailyCheckin(preferences: NotificationPreferences): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How are you today?',
      body: 'A short check-in gives Reclaim one more useful signal. No score, no judgment.',
      data: { reclaimReminder: 'daily-checkin' satisfies ReminderKind },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: preferences.dailyCheckinHour,
      minute: preferences.dailyCheckinMinute,
    },
  });
}

async function scheduleWeeklyReflection(preferences: NotificationPreferences): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your week has a pattern.',
      body: 'Take a minute to review what changed across your recent Reclaim data.',
      data: { reclaimReminder: 'weekly-reflection' satisfies ReminderKind },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: preferences.weeklyReflectionWeekday,
      hour: preferences.weeklyReflectionHour,
      minute: preferences.weeklyReflectionMinute,
    },
  });
}

export async function syncLocalReminders(
  preferences: NotificationPreferences,
  options: { requestPermission?: boolean } = {},
): Promise<{ permission: NotificationPermissionState; scheduled: number }> {
  const parsed = notificationPreferencesSchema.parse(preferences);
  if (Platform.OS === 'web') return { permission: 'unsupported', scheduled: 0 };

  await Promise.all([
    cancelReminderSchedules('daily-checkin'),
    cancelReminderSchedules('weekly-reflection'),
  ]);

  if (!hasAnyReminderEnabled(parsed)) {
    return { permission: await getNotificationPermissionState(), scheduled: 0 };
  }

  const permission = await ensureNotificationPermission(options.requestPermission === true);
  if (permission !== 'granted') return { permission, scheduled: 0 };

  let scheduled = 0;
  if (parsed.dailyCheckinEnabled) {
    await scheduleDailyCheckin(parsed);
    scheduled += 1;
  }
  if (parsed.weeklyReflectionEnabled) {
    await scheduleWeeklyReflection(parsed);
    scheduled += 1;
  }

  return { permission, scheduled };
}

export async function scheduleTestNotification(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') return 'unsupported';
  const permission = await ensureNotificationPermission(true);
  if (permission !== 'granted') return permission;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reclaim reminders are ready.',
      body: 'This is a local test notification. Your reminder preferences stay under your control.',
      data: { reclaimReminder: 'daily-checkin' satisfies ReminderKind, test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
  return permission;
}

export function addReminderResponseListener(
  listener: (kind: ReminderKind) => void,
): Notifications.EventSubscription | null {
  if (Platform.OS === 'web') return null;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const kind = response.notification.request.content.data?.reclaimReminder;
    if (kind === 'daily-checkin' || kind === 'weekly-reflection') listener(kind);
  });
}
