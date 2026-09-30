import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { dailyCheckinClientId } from '@/features/checkins/checkinModel';
import { checkinKeys, getCheckins } from '@/features/checkins/checkinService';
import { cravingKeys, getCravingHistory } from '@/features/craving/cravingService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BackButton } from '@/ui/BackButton';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ErrorCard } from '@/ui/ErrorCard';
import { Screen } from '@/ui/Screen';
import {
  applyReminderSuggestion,
  buildReminderSuggestion,
  formatReminderTime,
  hasAnyReminderEnabled,
  weekdayLabels,
  type NotificationPreferences,
} from './notificationModel';
import {
  getNotificationPermissionState,
  getNotificationPreferences,
  notificationKeys,
  saveNotificationPreferences,
  scheduleTestNotification,
  syncLocalReminders,
  type NotificationPermissionState,
} from './notificationService';

const dailyTimePresets = [
  { hour: 18, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 },
] as const;

const weeklyDayPresets = [1, 2, 6] as const;
const weeklyTimePresets = [
  { hour: 18, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 20, minute: 0 },
] as const;

const permissionLabels: Record<NotificationPermissionState, string> = {
  granted: 'Allowed on this device',
  denied: 'Blocked in device settings',
  undetermined: 'Not requested yet',
  unsupported: 'Not available on web',
};

export function NotificationSettingsScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionState>('undetermined');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [referenceTime] = useState(() => Date.now());
  const hydratedUserRef = useRef<string | null>(null);
  const userId = user?.id ?? '';

  const preferencesQuery = useQuery({
    queryKey: notificationKeys.preferences(userId),
    queryFn: () => getNotificationPreferences(userId),
    enabled: Boolean(userId),
  });

  const checkinsQuery = useQuery({
    queryKey: checkinKeys.history(userId),
    queryFn: () => getCheckins(userId, 7),
    enabled: Boolean(userId),
  });

  const cravingsQuery = useQuery({
    queryKey: cravingKeys.history(userId),
    queryFn: () => getCravingHistory(userId),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    void getNotificationPermissionState().then(setPermission);
  }, []);

  useEffect(() => {
    const preferences = preferencesQuery.data;
    if (!preferences || hydratedUserRef.current === preferences.userId) return;
    hydratedUserRef.current = preferences.userId;
    setDraft(preferences);
    void syncLocalReminders(preferences, { requestPermission: false }).then((result) => {
      setPermission(result.permission);
    });
  }, [preferencesQuery.data]);

  const todayCheckin = checkinsQuery.data?.find(
    (checkin) => checkin.clientId === dailyCheckinClientId(),
  );

  const recentCravings = useMemo(() => {
    const since = referenceTime - 3 * 86_400_000;
    return (cravingsQuery.data ?? []).filter((craving) => {
      const createdAt = new Date(craving.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= since;
    }).length;
  }, [cravingsQuery.data, referenceTime]);

  const reminderSuggestion = useMemo(() => {
    if (!draft || !profile) return null;
    return buildReminderSuggestion({
      preferences: draft,
      journeyMode: profile.journey_mode,
      checkedInToday: Boolean(todayCheckin),
      recentCravings,
    });
  }, [draft, profile, recentCravings, todayCheckin]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error('Reminder settings are not ready yet.');
      const saved = await saveNotificationPreferences(draft);
      const syncResult = await syncLocalReminders(saved, {
        requestPermission: hasAnyReminderEnabled(saved),
      });
      return { saved, syncResult };
    },
    onSuccess: async ({ saved, syncResult }) => {
      setDraft(saved);
      setPermission(syncResult.permission);
      setStatusMessage(
        syncResult.permission === 'granted'
          ? syncResult.scheduled > 0
            ? `${syncResult.scheduled} local reminder${syncResult.scheduled === 1 ? '' : 's'} scheduled.`
            : 'All Reclaim reminders are off.'
          : hasAnyReminderEnabled(saved)
            ? 'Preferences saved, but this device has not allowed notifications.'
            : 'All Reclaim reminders are off.',
      );
      await queryClient.invalidateQueries({ queryKey: notificationKeys.preferences(userId) });
    },
  });

  const testMutation = useMutation({
    mutationFn: scheduleTestNotification,
    onSuccess: (nextPermission) => {
      setPermission(nextPermission);
      setStatusMessage(
        nextPermission === 'granted'
          ? 'Test scheduled. It should appear in about 3 seconds.'
          : 'This device did not allow the test notification.',
      );
    },
  });

  if (!user) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText tone="secondary">Preparing reminder settings…</AppText>
        </View>
      </Screen>
    );
  }

  const error = preferencesQuery.error ?? checkinsQuery.error ?? cravingsQuery.error ?? saveMutation.error ?? testMutation.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton label="Back" onPress={() => router.back()} />

        <View style={styles.heading}>
          <AppText variant="micro" tone="accent">REMINDERS</AppText>
          <AppText variant="display">Useful, not noisy.</AppText>
          <AppText tone="secondary">
            Reclaim reminders are optional and off by default. Times follow this device’s local clock.
          </AppText>
        </View>

        <Card tone="raised" style={styles.stack}>
          <AppText variant="micro" tone="tertiary">DEVICE PERMISSION</AppText>
          <AppText variant="title">{permissionLabels[permission]}</AppText>
          <AppText tone="secondary">
            Permission is requested only when you enable a reminder or send a test.
          </AppText>
          {permission === 'denied' ? (
            <Button label="Open device settings" onPress={() => void Linking.openSettings()} />
          ) : null}
        </Card>

        {draft && reminderSuggestion ? (
          <Card tone="accent" style={styles.stack}>
            <AppText variant="micro" tone="accent">RECOMMENDED SETUP</AppText>
            <AppText variant="title">{reminderSuggestion.title}</AppText>
            <AppText tone="secondary">{reminderSuggestion.body}</AppText>
            <AppText variant="caption" tone="secondary">Why: {reminderSuggestion.reason}</AppText>
            <Button
              label={reminderSuggestion.ctaLabel}
              onPress={() => {
                setDraft((current) =>
                  current ? applyReminderSuggestion(current, reminderSuggestion) : current,
                );
                setStatusMessage('Recommendation applied. Save reminder settings to schedule it.');
              }}
            />
          </Card>
        ) : null}

        {preferencesQuery.isLoading || !draft ? (
          <Card><AppText tone="secondary">Loading reminder preferences…</AppText></Card>
        ) : (
          <>
            <Card tone="raised" style={styles.stack}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <AppText variant="micro" tone="tertiary">DAILY CHECK-IN</AppText>
                  <AppText variant="title">A small daily pause</AppText>
                </View>
                <Switch
                  accessibilityLabel="Daily check-in reminder"
                  trackColor={{ false: colors.borderStrong, true: colors.accentMuted }}
                  thumbColor={draft.dailyCheckinEnabled ? colors.accentLight : colors.textSecondary}
                  value={draft.dailyCheckinEnabled}
                  onValueChange={(value) => {
                    setDraft((current) => current ? { ...current, dailyCheckinEnabled: value } : current);
                    setStatusMessage(null);
                  }}
                />
              </View>
              <AppText tone="secondary">
                A short prompt to record how the day feels. No streak pressure or penalty for skipping.
              </AppText>
              <AppText variant="micro" tone="tertiary">TIME</AppText>
              <View style={styles.choiceRow}>
                {dailyTimePresets.map((preset) => {
                  const selected = draft.dailyCheckinHour === preset.hour && draft.dailyCheckinMinute === preset.minute;
                  return (
                    <Choice
                      key={`${preset.hour}:${preset.minute}`}
                      label={formatReminderTime(preset.hour, preset.minute)}
                      selected={selected}
                      onPress={() => {
                        setDraft((current) => current ? {
                          ...current,
                          dailyCheckinHour: preset.hour,
                          dailyCheckinMinute: preset.minute,
                        } : current);
                        setStatusMessage(null);
                      }}
                    />
                  );
                })}
              </View>
            </Card>

            <Card style={styles.stack}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <AppText variant="micro" tone="tertiary">WEEKLY REFLECTION</AppText>
                  <AppText variant="title">Look at the week, not one day</AppText>
                </View>
                <Switch
                  accessibilityLabel="Weekly reflection reminder"
                  trackColor={{ false: colors.borderStrong, true: colors.accentMuted }}
                  thumbColor={draft.weeklyReflectionEnabled ? colors.accentLight : colors.textSecondary}
                  value={draft.weeklyReflectionEnabled}
                  onValueChange={(value) => {
                    setDraft((current) => current ? { ...current, weeklyReflectionEnabled: value } : current);
                    setStatusMessage(null);
                  }}
                />
              </View>
              <AppText tone="secondary">
                A weekly prompt to review patterns Reclaim can actually support with your logged data.
              </AppText>
              <AppText variant="micro" tone="tertiary">DAY</AppText>
              <View style={styles.choiceRow}>
                {weeklyDayPresets.map((weekday) => (
                  <Choice
                    key={weekday}
                    label={weekdayLabels[weekday] ?? String(weekday)}
                    selected={draft.weeklyReflectionWeekday === weekday}
                    onPress={() => {
                      setDraft((current) => current ? { ...current, weeklyReflectionWeekday: weekday } : current);
                      setStatusMessage(null);
                    }}
                  />
                ))}
              </View>
              <AppText variant="caption" tone="secondary">TIME</AppText>
              <View style={styles.choiceRow}>
                {weeklyTimePresets.map((preset) => {
                  const selected = draft.weeklyReflectionHour === preset.hour && draft.weeklyReflectionMinute === preset.minute;
                  return (
                    <Choice
                      key={`${preset.hour}:${preset.minute}`}
                      label={formatReminderTime(preset.hour, preset.minute)}
                      selected={selected}
                      onPress={() => {
                        setDraft((current) => current ? {
                          ...current,
                          weeklyReflectionHour: preset.hour,
                          weeklyReflectionMinute: preset.minute,
                        } : current);
                        setStatusMessage(null);
                      }}
                    />
                  );
                })}
              </View>
            </Card>

            <Button
              label={saveMutation.isPending ? 'Saving…' : 'Save reminder settings'}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            />

            <Card tone="flat" style={styles.stack}>
              <AppText variant="micro" tone="tertiary">TEST REMINDERS</AppText>
              <AppText variant="title">Check this device</AppText>
              <AppText tone="secondary">
                Send one test reminder in about three seconds. Your saved reminder schedule will not change.
              </AppText>
              <Button
                label={testMutation.isPending ? 'Scheduling…' : 'Send test notification'}
                disabled={testMutation.isPending}
                onPress={() => testMutation.mutate()}
              />
            </Card>
          </>
        )}

        {statusMessage ? (
          <AppText accessibilityLiveRegion="polite" tone="secondary">{statusMessage}</AppText>
        ) : null}
        {error ? (
          <ErrorCard
            message={error instanceof Error ? error.message : 'Reminder settings could not be updated.'}
            isRetrying={
              preferencesQuery.isFetching || checkinsQuery.isFetching || cravingsQuery.isFetching
            }
            onRetry={() => {
              saveMutation.reset();
              testMutation.reset();
              void Promise.all([
                preferencesQuery.refetch(),
                checkinsQuery.refetch(),
                cravingsQuery.refetch(),
              ]);
            }}
          />
        ) : null}

      </ScrollView>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected ? styles.choiceSelected : null]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  heading: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceSelected: {
    borderColor: colors.accentMuted,
    backgroundColor: colors.accentSoft,
  },
});
