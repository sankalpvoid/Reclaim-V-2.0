import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SmokingEvent } from '@/domain/smoking/smokingEvents';
import { useAuth } from '@/features/auth/AuthContext';
import { signOut } from '@/features/auth/authService';
import {
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
import { colors, radius, spacing, typography } from '@/theme/tokens';
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
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
  const target =
    mode === 'reduce'
      ? reductionPlanQuery.data?.current_target ?? profile.daily_target ?? null
      : null;
  const smokingSummary =
    mode === 'quit' ? null : buildSmokingTodaySummary(profile, smokingEvents, target, now);
  const dataError = smokingEventsQuery.error ?? reductionPlanQuery.error ?? logMutation.error;

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

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

            <Card style={styles.nextCard}>
              <AppText variant="caption" tone="secondary">AT YOUR PACE</AppText>
              <AppText variant="title">One small shift.</AppText>
              <AppText tone="secondary">
                Keep the next decision small. Craving support and personalized next steps migrate in the next product phase.
              </AppText>
            </Card>
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

        {dataError ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">
              {dataError instanceof Error ? dataError.message : 'Could not refresh Today.'}
            </AppText>
          </Card>
        ) : null}

        <View style={styles.footer}>
          {signOutError ? <AppText tone="danger">{signOutError}</AppText> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={() => void handleSignOut()}
            style={styles.signOutButton}
          >
            <AppText tone="secondary">{isSigningOut ? 'Signing out…' : 'Sign out'}</AppText>
          </Pressable>
        </View>
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
  nextCard: {
    gap: spacing.sm,
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
  errorCard: {
    borderColor: colors.danger,
  },
  footer: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  signOutButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
});
