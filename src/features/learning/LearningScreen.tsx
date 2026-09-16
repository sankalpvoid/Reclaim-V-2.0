import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import {
  articlesForJourney,
  attachLearningProgress,
  learningCategoryLabels,
  journeyModeSchema,
} from './learningModel';
import {
  getLearningArticles,
  getLearningProgress,
  learningKeys,
  setLearningCompleted,
  setLearningSaved,
} from './learningService';

export function LearningScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);
  const userId = user?.id ?? '';

  const articlesQuery = useQuery({
    queryKey: learningKeys.articles,
    queryFn: getLearningArticles,
    enabled: Boolean(userId),
  });
  const progressQuery = useQuery({
    queryKey: learningKeys.progress(userId),
    queryFn: () => getLearningProgress(userId),
    enabled: Boolean(userId),
  });

  const articleStates = useMemo(() => {
    const parsedJourney = journeyModeSchema.safeParse(profile?.journey_mode);
    if (!parsedJourney.success) return [];
    const filtered = articlesForJourney(articlesQuery.data ?? [], parsedJourney.data);
    return attachLearningProgress(filtered, progressQuery.data ?? []);
  }, [articlesQuery.data, profile?.journey_mode, progressQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (input: { articleId: string; action: 'save' | 'complete'; next: boolean }) => {
      if (!userId) throw new Error('Your session is not ready yet.');
      if (input.action === 'save') await setLearningSaved(userId, input.articleId, input.next);
      else await setLearningCompleted(userId, input.articleId, input.next);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: learningKeys.progress(userId) });
    },
  });

  const completedCount = articleStates.filter((item) => item.completed).length;
  const savedCount = articleStates.filter((item) => item.saved).length;
  const error = articlesQuery.error ?? progressQuery.error ?? updateMutation.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">LEARNING</AppText>
          <AppText variant="display">Useful context, when you want it.</AppText>
          <AppText tone="secondary">
            Short explanations connected to the tools and data already inside Reclaim. No streaks for reading.
          </AppText>
        </View>

        <Card style={styles.summaryCard}>
          <AppText variant="caption" tone="secondary">YOUR LIBRARY</AppText>
          <AppText variant="title">{completedCount} completed · {savedCount} saved</AppText>
          <AppText tone="secondary">Articles shown here match your current journey.</AppText>
        </Card>

        {articlesQuery.isLoading || progressQuery.isLoading ? (
          <Card><AppText tone="secondary">Loading learning library…</AppText></Card>
        ) : null}

        {articleStates.map((article) => {
          const open = openArticleId === article.id;
          return (
            <Card key={article.id} style={styles.articleCard}>
              <View style={styles.articleMeta}>
                <AppText variant="caption" tone="secondary">
                  {learningCategoryLabels[article.category].toUpperCase()} · {article.estimatedMinutes} MIN
                </AppText>
                {article.completed ? <AppText variant="caption">COMPLETED</AppText> : null}
              </View>
              <AppText variant="title">{article.title}</AppText>
              <AppText tone="secondary">{article.summary}</AppText>

              {open ? (
                <View style={styles.reader}>
                  {article.body.split('\n\n').map((paragraph, index) => (
                    <AppText key={`${article.id}-${index}`}>{paragraph}</AppText>
                  ))}
                  {article.sourceName && article.sourceUrl ? (
                    <Pressable onPress={() => Linking.openURL(article.sourceUrl!)}>
                      <AppText tone="secondary">Source: {article.sourceName} ↗</AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.actions}>
                <Button
                  label={open ? 'Close' : 'Read'}
                  onPress={() => setOpenArticleId((value) => (value === article.id ? null : article.id))}
                />
                <Pressable
                  disabled={updateMutation.isPending}
                  onPress={() => updateMutation.mutate({ articleId: article.id, action: 'save', next: !article.saved })}
                  style={styles.textAction}
                >
                  <AppText tone="secondary">{article.saved ? 'Remove saved' : 'Save for later'}</AppText>
                </Pressable>
                <Pressable
                  disabled={updateMutation.isPending}
                  onPress={() => updateMutation.mutate({ articleId: article.id, action: 'complete', next: !article.completed })}
                  style={styles.textAction}
                >
                  <AppText tone="secondary">{article.completed ? 'Mark unread' : 'Mark complete'}</AppText>
                </Pressable>
              </View>
            </Card>
          );
        })}

        {error ? (
          <Card>
            <AppText tone="danger">
              {error instanceof Error ? error.message : 'Learning library could not load.'}
            </AppText>
          </Card>
        ) : null}
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
  heading: { gap: spacing.sm },
  summaryCard: { gap: spacing.sm },
  articleCard: { gap: spacing.md },
  articleMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  reader: { gap: spacing.md },
  actions: { gap: spacing.sm },
  textAction: { paddingVertical: spacing.xs, alignSelf: 'flex-start' },
});
