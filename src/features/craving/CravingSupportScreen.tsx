import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  cravingTools,
  formatTimer,
  recommendCravingTool,
  type CravingFeedback,
  type CravingToolKey,
} from '@/features/craving/cravingModel';
import {
  cravingKeys,
  getCravingHistory,
  recordCraving,
  saveCravingFeedback,
} from '@/features/craving/cravingService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

type Stage = 'choose' | 'tool' | 'feedback';

const breatheSteps = ['INHALE', 'HOLD', 'EXHALE', 'HOLD'] as const;

export function CravingSupportScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>('choose');
  const [activeTool, setActiveTool] = useState<CravingToolKey | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [breathIndex, setBreathIndex] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  const userId = user?.id ?? '';
  const historyQuery = useQuery({
    queryKey: cravingKeys.history(userId),
    queryFn: () => getCravingHistory(userId),
    enabled: Boolean(userId),
  });

  const recommendedTool = useMemo(
    () => recommendCravingTool(historyQuery.data ?? []),
    [historyQuery.data],
  );

  const recordMutation = useMutation({
    mutationFn: recordCraving,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cravingKeys.history(userId) });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: saveCravingFeedback,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cravingKeys.history(userId) });
    },
  });

  useEffect(() => {
    if (stage !== 'tool' || activeTool !== 'timer') return;
    const interval = setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1_000);
    return () => clearInterval(interval);
  }, [activeTool, stage]);

  useEffect(() => {
    if (stage !== 'tool' || activeTool !== 'breathe') return;
    const interval = setInterval(() => {
      setBreathIndex((current) => (current + 1) % breatheSteps.length);
    }, 4_000);
    return () => clearInterval(interval);
  }, [activeTool, stage]);

  function startTool(tool: CravingToolKey) {
    void trackAnalyticsEvent({
      eventName: 'support_tool_started',
      tool,
      userId,
      journeyMode: profile?.journey_mode ?? null,
    });
    setActiveTool(tool);
    setStage('tool');
    setTimerSeconds(300);
    setBreathIndex(0);
    startedAtRef.current = Date.now();
  }

  async function finishTool() {
    if (!userId || !activeTool) return;
    const durationSeconds = startedAtRef.current
      ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1_000))
      : 0;
    const id = await recordMutation.mutateAsync({
      userId,
      resisted: true,
      toolkit: activeTool,
      durationSeconds,
    });
    void trackAnalyticsEvent({
      eventName: 'craving_logged',
      outcome: 'with_tool',
      userId,
      journeyMode: profile?.journey_mode ?? null,
    });
    void trackAnalyticsEvent({
      eventName: 'support_tool_completed',
      tool: activeTool,
      userId,
      journeyMode: profile?.journey_mode ?? null,
    });
    setEventId(id);
    setStage('feedback');
  }

  async function logWithoutExercise() {
    if (!userId) return;
    await recordMutation.mutateAsync({ userId, resisted: false, toolkit: null });
    void trackAnalyticsEvent({
      eventName: 'craving_logged',
      outcome: 'without_tool',
      userId,
      journeyMode: profile?.journey_mode ?? null,
    });
    router.replace('/(app)');
  }

  async function submitFeedback(feedback: CravingFeedback) {
    if (!userId || !eventId) return;
    await feedbackMutation.mutateAsync({ userId, eventId, feedback });
    void trackAnalyticsEvent({
      eventName: 'tool_feedback',
      feedback,
      userId,
      journeyMode: profile?.journey_mode ?? null,
    });
    router.replace('/(app)');
  }

  const error = historyQuery.error ?? recordMutation.error ?? feedbackMutation.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ Back</AppText>
        </Pressable>

        {stage === 'choose' ? (
          <>
            <View style={styles.heading}>
              <AppText variant="caption" tone="secondary">CRAVING SUPPORT</AppText>
              <AppText variant="display">One urge. One small step.</AppText>
              <AppText tone="secondary">
                Choose one action to create some space between the urge and what you do next.
              </AppText>
            </View>

            <View style={styles.stack}>
              {cravingTools
                .slice()
                .sort((a, b) => Number(b.key === recommendedTool) - Number(a.key === recommendedTool))
                .map((tool) => (
                  <Pressable key={tool.key} onPress={() => startTool(tool.key)}>
                    <Card style={styles.toolCard}>
                      {tool.key === recommendedTool ? (
                        <AppText variant="caption">WORKED FOR YOU BEFORE</AppText>
                      ) : null}
                      <View style={styles.toolHeader}>
                        <AppText variant="title">{tool.name}</AppText>
                        <AppText tone="secondary">{tool.durationLabel}</AppText>
                      </View>
                      <AppText tone="secondary">{tool.summary}</AppText>
                    </Card>
                  </Pressable>
                ))}
            </View>

            <Button
              label={recordMutation.isPending ? 'Logging…' : 'Log without exercise'}
              disabled={recordMutation.isPending}
              onPress={() => void logWithoutExercise()}
            />
          </>
        ) : null}

        {stage === 'tool' && activeTool ? (
          <ToolStage
            tool={activeTool}
            timerSeconds={timerSeconds}
            breathStep={breatheSteps[breathIndex] ?? 'INHALE'}
            isSaving={recordMutation.isPending}
            onComplete={() => void finishTool()}
          />
        ) : null}

        {stage === 'feedback' ? (
          <View style={styles.stack}>
            <AppText variant="caption" tone="secondary">OPTIONAL</AppText>
            <AppText variant="display">Did that help?</AppText>
            <AppText tone="secondary">One tap helps Reclaim learn which support works for you.</AppText>
            <Button label="Yes" onPress={() => void submitFeedback('yes')} />
            <Button label="A little" onPress={() => void submitFeedback('a_little')} />
            <Button label="Not really" onPress={() => void submitFeedback('not_really')} />
            <Pressable onPress={() => router.replace('/(app)')} style={styles.skipButton}>
              <AppText tone="secondary">Skip</AppText>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">{error instanceof Error ? error.message : 'Could not save this craving.'}</AppText>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ToolStage({
  tool,
  timerSeconds,
  breathStep,
  isSaving,
  onComplete,
}: {
  tool: CravingToolKey;
  timerSeconds: number;
  breathStep: (typeof breatheSteps)[number];
  isSaving: boolean;
  onComplete: () => void;
}) {
  const copy: Record<CravingToolKey, { title: string; body: string }> = {
    breathe: {
      title: breathStep,
      body: 'Four seconds each: inhale, hold, exhale, hold. Keep the pace comfortable.',
    },
    timer: {
      title: formatTimer(timerSeconds),
      body: 'Notice the urge without obeying it. You can finish whenever you feel ready.',
    },
    water: {
      title: 'Water reset',
      body: 'Pour a glass, sip slowly, and move to a different room or space.',
    },
    walk: {
      title: 'Take a short walk',
      body: 'Move for a few minutes. Notice five things you can see and four you can hear.',
    },
  };

  return (
    <View style={styles.toolStage}>
      <AppText variant="caption" tone="secondary">SUPPORT TOOL</AppText>
      <AppText style={styles.toolValue}>{copy[tool].title}</AppText>
      <AppText tone="secondary">{copy[tool].body}</AppText>
      <Button
        label={isSaving ? 'Saving…' : tool === 'timer' ? 'End & log win' : 'I feel ready'}
        disabled={isSaving}
        onPress={onComplete}
      />
    </View>
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
  stack: {
    gap: spacing.md,
  },
  toolCard: {
    gap: spacing.sm,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  toolStage: {
    minHeight: 420,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  toolValue: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  skipButton: {
    alignSelf: 'center',
    padding: spacing.md,
  },
  errorCard: {
    borderColor: colors.danger,
    borderRadius: radius.md,
  },
});
