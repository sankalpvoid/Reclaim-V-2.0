import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import { useAuth } from '@/features/auth/AuthContext';
import { JourneyModePicker } from '@/features/onboarding/JourneyStep';
import { calculateInitialReductionTarget } from '@/features/onboarding/onboardingModel';
import { QuitDatePicker } from '@/features/onboarding/QuitDatePicker';
import {
  journeyTransitionCopy,
  type JourneyMode,
} from '@/features/settings/journeySettingsModel';
import { updateJourneySettings } from '@/features/settings/journeySettingsService';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

function initialQuitDate(value: string | null): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.getTime() > Date.now()) return new Date();
  return parsed;
}

export function JourneySettingsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [mode, setMode] = useState<JourneyMode>(profile?.journey_mode ?? 'quit');
  const [quitDate, setQuitDate] = useState(() => initialQuitDate(profile?.quit_date ?? null));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !profile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText tone="secondary">Preparing journey settings…</AppText>
        </View>
      </Screen>
    );
  }

  const storedQuitAt = profile.quit_date ? new Date(profile.quit_date).getTime() : null;
  const quitDateChanged =
    mode === 'quit' &&
    (storedQuitAt === null || !Number.isFinite(storedQuitAt) || quitDate.getTime() !== storedQuitAt);
  const hasChanges = mode !== profile.journey_mode || quitDateChanged;
  const targetPreview =
    mode === 'reduce' && (profile.cigarettes_per_day ?? 0) > 0
      ? calculateInitialReductionTarget(profile.cigarettes_per_day ?? 0)
      : null;

  async function save() {
    if (!hasChanges || isSaving) return;
    setError(null);
    setIsSaving(true);

    try {
      const previousMode = profile.journey_mode;
      await updateJourneySettings({
        userId: user.id,
        profile,
        nextMode: mode,
        quitDate,
      });
      await refreshProfile();

      if (previousMode !== mode) {
        void trackAnalyticsEvent({
          eventName: 'journey_mode_selected',
          userId: user.id,
          journeyMode: mode,
        });
      }

      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your journey.');
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ More</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">YOUR JOURNEY</AppText>
          <AppText variant="display">Your pace can change.</AppText>
          <AppText tone="secondary">
            Pick the path that matches where you are now. Reclaim will adapt the active dashboard and calculations without erasing your history.
          </AppText>
        </View>

        <JourneyModePicker value={mode} onSelect={setMode} />

        {mode === 'quit' ? (
          <Card style={styles.detailCard}>
            <AppText variant="caption" tone="secondary">ACTIVE QUIT TIMELINE</AppText>
            <QuitDatePicker value={quitDate} onChange={setQuitDate} disabled={isSaving} />
          </Card>
        ) : null}

        {mode === 'reduce' && targetPreview !== null ? (
          <Card style={styles.detailCard}>
            <AppText variant="caption" tone="secondary">FRESH STARTING TARGET</AppText>
            <AppText variant="title">{targetPreview} cigarettes / day</AppText>
            <AppText tone="secondary">
              Based on your saved baseline of {profile.cigarettes_per_day} per day. This creates a new active reduction plan only when you switch into Smoke Less.
            </AppText>
          </Card>
        ) : null}

        <Card style={styles.detailCard}>
          <AppText variant="caption" tone="secondary">WHAT CHANGES</AppText>
          <AppText tone="secondary">
            {journeyTransitionCopy(profile.journey_mode, mode)}
          </AppText>
        </Card>

        {error ? (
          <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
            {error}
          </AppText>
        ) : null}

        <Button
          label={isSaving ? 'Saving…' : hasChanges ? 'Save journey' : 'Journey is up to date'}
          disabled={!hasChanges || isSaving}
          onPress={() => void save()}
        />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  heading: {
    gap: spacing.sm,
  },
  detailCard: {
    gap: spacing.md,
  },
});
