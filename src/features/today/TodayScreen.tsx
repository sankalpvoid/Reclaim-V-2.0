import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SmokingEvent } from '@/domain/smoking/smokingEvents';
import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import { buildProgressMoment } from '@/features/achievements/achievementModel';
import { useAuth } from '@/features/auth/AuthContext';
import { checkinKeys, getCheckins } from '@/features/checkins/checkinService';
import { cravingKeys, getCravingHistory } from '@/features/craving/cravingService';
import { getSavingsGoals, goalKeys } from '@/features/goals/goalService';
import {
  buildPersonalizedToday,
  buildQuitTodaySummary,
  buildSmokingTodaySummary,
  formatMoney,
} from '@/features/today/todayModel';
import {
  getReductionPlan,
  getSmokingEvents,
  logCigarette,
  todayKeys,
} from '@/features/today/todayService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

const journeyLabels = {
  quit: 'QUIT NOW',
  reduce: 'SMOKE LESS',
  track: 'UNDERSTAND MY SMOKING',
} as const;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <AppText variant="caption" tone="secondary">{label}</AppText>
      <AppText variant="title">{value}</AppText>
    </View>
  );
}

function QuickAction({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickAction}>
      <View style={styles.quickActionCopy}>
        <AppText variant="title">{label}</AppText>
        <AppText variant="caption" tone="secondary">{detail}</AppText>
      </View>
      <AppText variant="title" tone="secondary">›</AppText>
    </Pressable>
  );
}

function WeekStrip({ days }: { days: ReturnType<typeof buildSmokingTodaySummary>['recentDays'] }) {
  const max = Math.max(1, ...days.map((day) => day.cigarettes));

  return (
    <View style={styles.weekStrip}>
      {days.map((day) => {
        const height = day.known ? Math.max(8, Math.round((day.cigarettes / max) * 54)) : 4;
        const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(
          new Date(`${day.day}T12:00:00`),
        );

        return (
          <View key={day.day} style={styles.dayColumn}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height },
                  !day.known ? styles.barUnknown : null,
                ]}
              />
            </View>
            <AppText variant="caption" tone="secondary">{weekday}</AppText>
            <AppText variant="caption">{day.known ? String(day.cigarettes) : '—'}</AppText>
          </View>
        );
      })}
    </View>
  );
}

export function TodayScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const userId = user?.id ?? '';
  const mode = profile?.journey_mode ?? 'quit';
  const needsSmokingData = Boolean(userId) && mode !== 'quit';

  const smokingEventsQuery = useQuery({
    queryKey: todayKeys.smokingEvents(userId),
    queryFn: () => getSmokingEvents(userId),
    enabled: needsSmokingData,
  });

  const reductionPlanQuery = useQuery({
    queryKey: todayKeys.reductionPlan(userId),
    queryFn: () => getReductionPlan(userId),
    enabled: Boolean(userId) && mode === 'reduce',
  });

  const checkinsQuery = useQuery({
    queryKey: checkinKeys.history(userId),
    queryFn: () => getCheckins(userId),
    enabled: Boolean(userId),
  });

  const cravingsQuery = useQuery({
    queryKey: cravingKeys.history(userId),
    queryFn: () => getCravingHistory(userId),
    enabled: Boolean(userId),
  });

  const goalsQuery = useQuery({
    queryKey: goalKeys.list(userId),
    queryFn: () => getSavingsGoals(userId),
    enabled: Boolean(userId) && mode === 'quit',
  });

  const smokingEvents = useMemo<SmokingEvent[]>(
    () =>
      (smokingEventsQuery.data ?? []).map((row) => ({
        id: row.id,
        smokedAt: row.smoked_at,
        cigarettes: row.cigarettes,
      })),
    [smokingEventsQuery.data],
  );

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Your session is not ready yet.');
      await logCigarette(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todayKeys.smokingEvents(userId) });
      void trackAnalyticsEvent({
        eventName: 'cigarette_logged',
        userId,
        journeyMode: profile?.journey_mode ?? null,
      });
    },
  });

  if (!user || !profile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText tone="secondary">Preparing Today…</AppText>
        </View>
      </Screen>
    );
  }

  const quitSummary = mode === 'quit' ? buildQuitTodaySummary(profile, now) : null;
  const progressMoment = quitSummary
    ? buildProgressMoment({
        elapsedDays: quitSummary.elapsedDays,
        cigarettesAvoided: quitSummary.cigarettesAvoided,
        moneyReclaimed: quitSummary.moneyReclaimed,
        minutesReclaimed: quitSummary.minutesReclaimed,
        currencySymbol: profile.currency_symbol,
      })
    : null;
  const target =
    mode === 'reduce'
      ? reductionPlanQuery.data?.current_target ?? profile.daily_target ?? null
      : null;
  const smokingSummary =
    mode === 'quit' ? null : buildSmokingTodaySummary(profile, smokingEvents, target, now);
  const personalized = buildPersonalizedToday({
    mode,
    checkins: checkinsQuery.data ?? [],
    cravings: cravingsQuery.data ?? [],
    goals: goalsQuery.data ?? [],
    moneyReclaimed: quitSummary?.moneyReclaimed ?? 0,
    currencySymbol: profile.currency_symbol,
    now,
  });
  const personalizationLoading =
    checkinsQuery.isLoading || cravingsQuery.isLoading || (mode === 'quit' && goalsQuery.isLoading);
  const dataError =
    smokingEventsQuery.error ??
    reductionPlanQuery.error ??
    checkinsQuery.error ??
    cravingsQuery.error ??
    goalsQuery.error ??
    logMutation.error;

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="secondary">TODAY</AppText>
            <AppText variant="display">
              {profile.display_name ? `Namaste, ${profile.display_name}.` : 'Namaste.'}
            </AppText>
          </View>
          <View style={styles.pacePill}>
            <AppText variant="caption">{journeyLabels[mode]}</AppText>
          </View>
        </View>

        {mode === 'quit' && quitSummary ? (
          <>
            <Card style={styles.heroCard}>
              <AppText variant="caption" tone="secondary">SMOKE-FREE</AppText>
              <AppText style={styles.heroValue}>{quitSummary.durationLabel}</AppText>
              <AppText tone="secondary">One decision at a time. Your progress is already adding up.</AppText>
            </Card>

            <View style={styles.statsGrid}>
              <StatCard label="CIGARETTES AVOIDED" value={quitSummary.avoidedLabel} />
              <StatCard label="MONEY RECLAIMED" value={quitSummary.moneyLabel} />
              <StatCard label="TIME RECLAIMED" value={quitSummary.timeLabel} />
            </View>

            {progressMoment ? (
              <Card style={styles.momentCard}>
                <AppText variant="caption" tone="secondary">{progressMoment.eyebrow}</AppText>
                <AppText variant="title">{progressMoment.title}</AppText>
                <AppText tone="secondary">{progressMoment.body}</AppText>
                <AppText variant="caption" tone="secondary">{progressMoment.detail}</AppText>
              </Card>
            ) : null}
          </>
        ) : null}

        {mode !== 'quit' ? (
          <>
            {smokingEventsQuery.isLoading || (mode === 'reduce' && reductionPlanQuery.isLoading) ? (
              <Card><AppText tone="secondary">Loading your smoking history…</AppText></Card>
            ) : smokingSummary ? (
              <>
                <Card style={styles.heroCard}>
                  <AppText variant="caption" tone="secondary">
                    {mode === 'reduce' ? 'TODAY · YOUR TARGET' : 'TODAY · LOGGED'}
                  </AppText>
                  <AppText style={styles.heroValue}>
                    {mode === 'reduce' && smokingSummary.targetProgress
                      ? `${smokingSummary.todayCount} / ${smokingSummary.targetProgress.target}`
                      : String(smokingSummary.todayCount)}
                  </AppText>
                  <AppText tone="secondary">
                    {mode === 'reduce' && smokingSummary.targetProgress
                      ? smokingSummary.targetProgress.overBy > 0
                        ? `${smokingSummary.targetProgress.overBy} above today’s target. This does not reset your progress.`
                        : `${smokingSummary.targetProgress.remaining} remaining in today’s target.`
                      : 'Log what actually happens. Reclaim will learn from complete, honest data.'}
                  </AppText>
                  <Button
                    label={logMutation.isPending ? 'Logging…' : '+ Log a cigarette'}
                    disabled={logMutation.isPending}
                    onPress={() => logMutation.mutate()}
                  />
                </Card>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="SPENT TODAY"
                    value={formatMoney(profile.currency_symbol, smokingSummary.todaySpend)}
                  />
                  <StatCard label="LAST 7 DAYS" value={String(smokingSummary.sevenDayCount)} />
                  <StatCard
                    label="7-DAY SPEND"
                    value={formatMoney(profile.currency_symbol, smokingSummary.sevenDaySpend)}
                  />
                </View>

                <Card>
                  <View style={styles.sectionHeader}>
                    <View>
                      <AppText variant="caption" tone="secondary">YOUR LAST 7 DAYS</AppText>
                      <AppText variant="title">Pattern, not judgment.</AppText>
                    </View>
                    <AppText variant="caption" tone="secondary">
                      {smokingSummary.knownDays}/7 logged
                    </AppText>
                  </View>
                  <WeekStrip days={smokingSummary.recentDays} />
                  {smokingSummary.knownDays < 7 ? (
                    <AppText variant="caption" tone="secondary">
                      A dash means Reclaim has no smoking log for that day. Missing data is never counted as success.
                    </AppText>
                  ) : null}
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {personalizationLoading ? (
          <Card style={styles.focusCard}>
            <AppText variant="caption" tone="secondary">FOR YOU NOW</AppText>
            <AppText variant="title">Reading today’s context…</AppText>
            <AppText tone="secondary">
              Reclaim is checking today’s mood, cravings, and active goals before choosing what to surface.
            </AppText>
          </Card>
        ) : (
          <>
            <Card style={styles.focusCard}>
              <AppText variant="caption" tone="secondary">{personalized.focus.eyebrow}</AppText>
              <AppText variant="title">{personalized.focus.title}</AppText>
              <AppText tone="secondary">{personalized.focus.body}</AppText>
              <Button
                label={personalized.focus.ctaLabel}
                onPress={() => router.push(personalized.focus.route)}
              />
            </Card>

            <View style={styles.signalSection}>
              <AppText variant="caption" tone="secondary">TODAY AT A GLANCE</AppText>
              <View style={styles.statsGrid}>
                <StatCard label="MOOD" value={personalized.moodLabel} />
                <StatCard label="CRAVINGS LOGGED" value={String(personalized.cravingsToday)} />
                {personalized.goalSignal ? (
                  <StatCard
                    label="NEXT SAVINGS GOAL"
                    value={`${Math.round(personalized.goalSignal.progressPercent)}%`}
                  />
                ) : null}
              </View>
              {personalized.cravingsToday > 0 ? (
                <AppText variant="caption" tone="secondary">
                  {personalized.resistedToday} of today’s logged cravings were recorded as resisted.
                </AppText>
              ) : null}
            </View>
          </>
        )}

        <Card style={styles.exploreCard}>
          <AppText variant="caption" tone="secondary">EXPLORE</AppText>
          <QuickAction
            label="Craving support"
            detail="Short tools when an urge hits"
            onPress={() => router.push('/(app)/craving')}
          />
          {mode === 'quit' ? (
            <QuickAction
              label="Health recovery"
              detail="Source-backed milestones from your quit date"
              onPress={() => router.push('/(app)/health')}
            />
          ) : null}
          <QuickAction
            label="Insights"
            detail="Patterns only when your logs support them"
            onPress={() => router.push('/(app)/insights')}
          />
          {mode === 'quit' ? (
            <QuickAction
              label="Savings goals"
              detail="Turn reclaimed money into visible targets"
              onPress={() => router.push('/(app)/goals')}
            />
          ) : null}
        </Card>

        {dataError ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">
              {dataError instanceof Error ? dataError.message : 'Could not refresh Today.'}
            </AppText>
          </Card>
        ) : null}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    gap: spacing.md,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  pacePill: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  heroCard: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  heroValue: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '800',
    letterSpacing: -2,
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    minHeight: 90,
    paddingTop: spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  barTrack: {
    height: 58,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
  },
  barUnknown: {
    backgroundColor: colors.border,
  },
  momentCard: {
    gap: spacing.sm,
  },
  focusCard: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  signalSection: {
    gap: spacing.sm,
  },
  exploreCard: {
    gap: spacing.sm,
  },
  quickAction: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  quickActionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
