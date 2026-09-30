import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import {
  buildHealthRecovery,
  formatRecoveryElapsed,
  type HealthMilestoneProgress,
} from '@/features/health/healthModel';
import { getHealthMilestones, healthKeys } from '@/features/health/healthService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

function MilestoneCard({ milestone }: { milestone: HealthMilestoneProgress }) {
  return (
    <Card tone={milestone.reached ? 'success' : 'default'} style={styles.milestoneCard}>
      <View style={styles.milestoneHeading}>
        <View style={[styles.statusDot, milestone.reached ? styles.statusDotReached : null]} />
        <View style={styles.milestoneCopy}>
          <AppText variant="micro" tone={milestone.reached ? 'success' : 'tertiary'}>
            {milestone.reached ? 'MILESTONE REACHED' : 'AHEAD'}
          </AppText>
          <AppText variant="title">{milestone.title}</AppText>
        </View>
      </View>
      <AppText tone="secondary">{milestone.description}</AppText>
      {milestone.source_name ? (
        <Pressable
          accessibilityRole={milestone.source_url ? 'link' : undefined}
          disabled={!milestone.source_url}
          onPress={() => {
            if (milestone.source_url) void Linking.openURL(milestone.source_url);
          }}
        >
          <AppText variant="caption" tone="secondary">
            Source: {milestone.source_name}{milestone.source_url ? ' ↗' : ''}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function HealthRecoveryScreen() {
  const { profile } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const milestonesQuery = useQuery({
    queryKey: healthKeys.milestones,
    queryFn: getHealthMilestones,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const recovery =
    profile?.quit_date && profile.journey_mode === 'quit' && milestonesQuery.data
      ? buildHealthRecovery(profile.quit_date, milestonesQuery.data, now)
      : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ Back</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="micro" tone="accent">HEALTH RECOVERY</AppText>
          <AppText variant="display">Recovery, over time.</AppText>
          <AppText tone="secondary">
            An evidence-informed timeline based on time since your quit date.
          </AppText>
        </View>

        {!profile?.quit_date || profile.journey_mode !== 'quit' ? (
          <Card style={styles.infoCard}>
            <AppText variant="title">No quit timeline is active.</AppText>
            <AppText tone="secondary">
              Reclaim only calculates this timeline when your current journey has a quit date. It does not infer smoke-free time from missing smoking logs.
            </AppText>
          </Card>
        ) : milestonesQuery.isLoading ? (
          <Card><AppText tone="secondary">Loading recovery milestones…</AppText></Card>
        ) : milestonesQuery.error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">
              {milestonesQuery.error instanceof Error
                ? milestonesQuery.error.message
                : 'Could not load recovery milestones.'}
            </AppText>
          </Card>
        ) : recovery ? (
          <>
            <Card tone="accent" style={styles.progressCard}>
              <AppText variant="micro" tone="accent">TIME SINCE QUIT DATE</AppText>
              <AppText style={styles.elapsedValue}>
                {formatRecoveryElapsed(recovery.elapsedMinutes)}
              </AppText>
              <AppText tone="secondary">
                {recovery.nextMilestone
                  ? `Progress toward ${recovery.nextMilestone.title}`
                  : 'All currently listed milestones have been reached.'}
              </AppText>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(recovery.intervalProgress * 100)}%` },
                  ]}
                />
              </View>
              <AppText variant="caption" tone="secondary">
                {recovery.reachedCount}/{recovery.milestones.length} listed milestones reached
              </AppText>
            </Card>

            <View style={styles.timeline}>
              {recovery.milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </View>
          </>
        ) : null}

        <Card tone="flat" style={styles.disclaimerCard}>
          <AppText variant="micro" tone="tertiary">ABOUT THESE ESTIMATES</AppText>
          <AppText tone="secondary">
            Recovery varies by person. These milestones are educational estimates from the cited sources, not medical measurements, diagnosis, or medical advice.
          </AppText>
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
  infoCard: {
    gap: spacing.sm,
  },
  progressCard: {
    gap: spacing.md,
  },
  elapsedValue: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '800',
    letterSpacing: -2,
    color: colors.accentLight,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  timeline: {
    gap: spacing.md,
  },
  milestoneCard: {
    gap: spacing.sm,
  },
  milestoneHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  milestoneCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    marginTop: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDotReached: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  disclaimerCard: {
    gap: spacing.sm,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
