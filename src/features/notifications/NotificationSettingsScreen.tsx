import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import {
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionState>('undetermined');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hydratedUserRef = useRef<string | null>(null);
  const userId = user?.id ?? '';

  const preferencesQuery = useQuery({
    queryKey: notificationKeys.preferences(userId),
    queryFn: () => getNotificationPreferences(userId),
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

  const error = preferencesQuery.error ?? saveMutation.error ?? testMutation.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ Back</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">REMINDERS</AppText>
          <AppText variant="display">Useful, not noisy.</AppText>
          <AppText tone="secondary">
            Reclaim reminders are optional and off by default. Times follow this device’s local clock.
          </AppText>
        </View>

        <Card style={styles.stack}>
          <AppText variant="caption" tone="secondary">DEVICE PERMISSION</AppText>
          <AppText variant="title">{permissionLabels[permission]}</AppText>
          <AppText tone="secondary">
            Permission is requested only when you enable a reminder or send a test.
          </AppText>
          {permission === 'denied' ? (
            <Button label="Open device settings" onPress={() => void Linking.openSettings()} />
          ) : null}
        </Card>

        {preferencesQuery.isLoading || !draft ? (
          <Card><AppText tone="secondary">Loading reminder preferences…</AppText></Card>
        ) : (
          <>
            <Card style={styles.stack}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <AppText variant="caption" tone="secondary">DAILY CHECK-IN</AppText>
                  <AppText variant="title">A small daily pause</AppText>
                </View>
                <Switch
                  accessibilityLabel="Daily check-in reminder"
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
              <AppText variant="caption" tone="secondary">TIME</AppText>
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
                  <AppText variant="caption" tone="secondary">WEEKLY REFLECTION</AppText>
                  <AppText variant="title">Look at the week, not one day</AppText>
                </View>
                <Switch
                  accessibilityLabel="Weekly reflection reminder"
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
              <AppText variant="caption" tone="secondary">DAY</AppText>
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

            <Card style={styles.stack}>
              <AppText variant="caption" tone="secondary">NATIVE TEST</AppText>
              <AppText variant="title">Check this device</AppText>
              <AppText tone="secondary">
                Schedule one local test notification for about three seconds from now. This does not change your reminder preferences.
              </AppText>
              <Button
                label={testMutation.isPending ? 'Scheduling…' : 'Send test notification'}
                disabled={testMutation.isPending}
                onPress={() => testMutation.mutate()}
              />
            </Card>
          </>
        )}

        {statusMessage ? <AppText tone="secondary">{statusMessage}</AppText> : null}
        {error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">{error instanceof Error ? error.message : 'Reminder settings could not be updated.'}</AppText>
          </Card>
        ) : null}

        <AppText variant="caption" tone="secondary">
          Phase 11 uses local notifications only. Remote push delivery is intentionally deferred until Reclaim has a development build and server-side delivery path.
        </AppText>
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
    borderColor: colors.textPrimary,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
