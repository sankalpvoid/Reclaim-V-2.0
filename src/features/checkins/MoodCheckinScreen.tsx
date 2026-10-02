import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  buildMoodHistory,
  dailyCheckinClientId,
  moodOptions,
  type Mood,
} from '@/features/checkins/checkinModel';
import { checkinKeys, getCheckins, saveDailyCheckin } from '@/features/checkins/checkinService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BackButton } from '@/ui/BackButton';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ErrorCard } from '@/ui/ErrorCard';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

const moodLabels: Record<Mood, string> = {
  great: 'Great',
  okay: 'Okay',
  struggling: 'Struggling',
  craving: 'Strong cravings',
};

export function MoodCheckinScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [period, setPeriod] = useState<7 | 30>(7);
  const [saved, setSaved] = useState(false);
  const hydratedCheckinIdRef = useRef<string | null>(null);

  const userId = user?.id ?? '';
  const historyQuery = useQuery({
    queryKey: checkinKeys.history(userId),
    queryFn: () => getCheckins(userId),
    enabled: Boolean(userId),
  });

  const todayClientId = dailyCheckinClientId();
  const todayCheckin = historyQuery.data?.find((checkin) => checkin.clientId === todayClientId);

  useEffect(() => {
    if (!todayCheckin || hydratedCheckinIdRef.current === todayCheckin.id) return;
    hydratedCheckinIdRef.current = todayCheckin.id;
    setSelectedMood(todayCheckin.mood);
    setNote(todayCheckin.note ?? '');
  }, [todayCheckin]);

  const summary = useMemo(
    () => buildMoodHistory(historyQuery.data ?? [], period),
    [historyQuery.data, period],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !selectedMood) throw new Error('Choose how you feel first.');
      return saveDailyCheckin({ userId, mood: selectedMood, note });
    },
    onSuccess: async (checkin) => {
      hydratedCheckinIdRef.current = checkin.id;
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: checkinKeys.history(userId) });
      void trackAnalyticsEvent({
        eventName: 'checkin_completed',
        userId,
        journeyMode: profile?.journey_mode ?? null,
      });
      if (checkin.mood === 'craving') router.push('/(app)/craving');
    },
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton label="Back" onPress={() => router.back()} />

        <View style={styles.heading}>
          <AppText variant="micro" tone="accent">DAILY CHECK-IN</AppText>
          <AppText variant="display">How are you today?</AppText>
          <AppText tone="secondary">
            One honest check-in is enough. You can update today’s answer later.
          </AppText>
        </View>

        <View style={styles.stack}>
          {moodOptions.map((option) => {
            const selected = selectedMood === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setSelectedMood(option.key);
                  setSaved(false);
                }}
              >
                <Card tone={selected ? 'accent' : 'default'} style={styles.moodCard}>
                  <AppText variant="title">{option.label}</AppText>
                  <AppText tone="secondary">{option.summary}</AppText>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <Input
          key={todayCheckin ? `checkin-note-${todayCheckin.id}` : 'checkin-note-new'}
          label="Optional note"
          defaultValue={todayCheckin?.note ?? ''}
          onChangeText={(value) => {
            setNote(value);
            setSaved(false);
          }}
          multiline
          maxLength={500}
          placeholder="Anything worth remembering about today?"
          style={styles.noteInput}
        />

        {saveMutation.error ? (
          <AppText tone="danger">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : 'Could not save your check-in.'}
          </AppText>
        ) : null}

        {saved ? <AppText tone="success">Today’s check-in is saved.</AppText> : null}

        <Button
          label={saveMutation.isPending ? 'Saving…' : todayCheckin ? 'Update today’s check-in' : 'Save check-in'}
          disabled={!selectedMood || saveMutation.isPending}
          onPress={() => saveMutation.mutate()}
        />

        <Card tone="raised" style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.headingCompact}>
              <AppText variant="micro" tone="tertiary">MOOD HISTORY</AppText>
              <AppText variant="title">Patterns, not scores.</AppText>
            </View>
            <View style={styles.periodRow}>
              {[7, 30].map((days) => (
                <Pressable
                  key={days}
                  onPress={() => setPeriod(days as 7 | 30)}
                  style={[styles.periodButton, period === days ? styles.periodButtonActive : null]}
                >
                  <AppText variant="caption">{days === 7 ? 'Week' : 'Month'}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {historyQuery.isLoading ? (
            <AppText tone="secondary">Loading check-ins…</AppText>
          ) : historyQuery.isError ? (
            <ErrorCard
              message="Your check-in history could not be loaded."
              isRetrying={historyQuery.isFetching}
              onRetry={() => void historyQuery.refetch()}
            />
          ) : (
            <>
              <AppText tone="secondary">
                {summary.loggedDays}/{period} days checked in
                {summary.mostCommonMood ? ` · Most often: ${moodLabels[summary.mostCommonMood]}` : ''}
              </AppText>

              <View style={styles.countGrid}>
                {moodOptions.map((option) => (
                  <View key={option.key} style={styles.countCell}>
                    <AppText variant="caption" tone="secondary">{moodLabels[option.key]}</AppText>
                    <AppText variant="title">{summary.counts[option.key]}</AppText>
                  </View>
                ))}
              </View>

              <View style={styles.recentRow}>
                {summary.days.slice(-7).map((day) => (
                  <View key={day.day} style={styles.dayCell}>
                    <AppText variant="caption" tone="secondary">
                      {new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(
                        new Date(`${day.day}T12:00:00`),
                      )}
                    </AppText>
                    <AppText variant="caption">{day.mood ? moodLabels[day.mood].slice(0, 1) : '—'}</AppText>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  heading: {
    gap: spacing.sm,
  },
  headingCompact: {
    gap: spacing.xs,
  },
  stack: {
    gap: spacing.sm,
  },
  moodCard: {
    gap: spacing.xs,
    minHeight: 86,
    justifyContent: 'center',
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  historyCard: {
    gap: spacing.md,
  },
  historyHeader: {
    gap: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  periodButtonActive: {
    borderColor: colors.accentMuted,
    backgroundColor: colors.accentSoft,
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countCell: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.backgroundRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
