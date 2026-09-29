import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { buildInsights } from '@/features/insights/insightsModel';
import { getInsightSourceData, insightKeys } from '@/features/insights/insightsService';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
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
            <View style={styles.emptyActions}>
              <Button label="Log a check-in" onPress={() => router.push('/(app)/check-in')} />
              <Button label="Open craving support" onPress={() => router.push('/(app)/craving')} />
            </View>
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
                <Button
                  label={insight.action.label}
                  onPress={() => {
                    if (insight.action.route === '/(app)/craving' && insight.action.tool) {
                      router.push({
                        pathname: '/(app)/craving',
                        params: { tool: insight.action.tool },
                      });
                      return;
                    }
                    router.push(insight.action.route);
                  }}
                />
              </Card>
            ))}
          </View>
        )}

        <Card style={styles.methodCard}>
          <AppText variant="caption" tone="secondary">HOW THIS WORKS</AppText>
          <AppText tone="secondary">
            Patterns are calculated only from your recent Reclaim logs. When the evidence is too thin, Reclaim stays quiet instead of filling in the gaps.
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
    gap: spacing.md,
  },
  emptyActions: {
    gap: spacing.sm,
  },
  methodCard: {
    gap: spacing.sm,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
