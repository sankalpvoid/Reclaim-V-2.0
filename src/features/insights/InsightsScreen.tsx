import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { buildInsights } from '@/features/insights/insightsModel';
import { getInsightSourceData, insightKeys } from '@/features/insights/insightsService';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

export function InsightsScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const sourceQuery = useQuery({
    queryKey: insightKeys.source(userId),
    queryFn: () => getInsightSourceData(userId),
    enabled: Boolean(userId),
  });

  const insights = useMemo(
    () => sourceQuery.data ? buildInsights(sourceQuery.data.events, sourceQuery.data.checkins) : [],
    [sourceQuery.data],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ Back</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">INSIGHTS</AppText>
          <AppText variant="display">What your data is showing.</AppText>
          <AppText tone="secondary">
            Reclaim only surfaces patterns when your own logs provide enough evidence. These are observations, not diagnoses or guarantees.
          </AppText>
        </View>

        {sourceQuery.isLoading ? (
          <Card><AppText tone="secondary">Looking for useful patterns…</AppText></Card>
        ) : sourceQuery.error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">
              {sourceQuery.error instanceof Error ? sourceQuery.error.message : 'Could not load insights.'}
            </AppText>
          </Card>
        ) : insights.length === 0 ? (
          <Card style={styles.emptyCard}>
            <AppText variant="title">Still learning your pattern.</AppText>
            <AppText tone="secondary">
              Keep logging cravings, smoking events, mood check-ins, and coping-tool feedback. Reclaim waits for repeated evidence instead of guessing from one or two entries.
            </AppText>
            <AppText variant="caption" tone="secondary">
              {sourceQuery.data?.events.length ?? 0} recent smoking/craving events · {sourceQuery.data?.checkins.length ?? 0} recent check-ins
            </AppText>
          </Card>
        ) : (
          <View style={styles.list}>
            {insights.map((insight) => (
              <Card key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <AppText variant="caption" tone="secondary">
                    {insight.confidence === 'established' ? 'REPEATED PATTERN' : 'EMERGING PATTERN'}
                  </AppText>
                  <AppText variant="title">{insight.title}</AppText>
                </View>
                <AppText tone="secondary">{insight.body}</AppText>
                <AppText variant="caption" tone="secondary">Based on: {insight.evidence}</AppText>
              </Card>
            ))}
          </View>
        )}

        <Card style={styles.methodCard}>
          <AppText variant="caption" tone="secondary">HOW THIS WORKS</AppText>
          <AppText tone="secondary">
            Phase 8 insights are deterministic and explainable. They are calculated from your recent Reclaim data; no language model is deciding what happened or inventing missing context.
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
  list: {
    gap: spacing.sm,
  },
  insightCard: {
    gap: spacing.sm,
  },
  insightHeader: {
    gap: spacing.xs,
  },
  emptyCard: {
    gap: spacing.sm,
  },
  methodCard: {
    gap: spacing.sm,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
