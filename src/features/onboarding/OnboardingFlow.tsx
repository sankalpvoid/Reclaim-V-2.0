import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import { useAuth } from '@/features/auth/AuthContext';
import { JourneyStep } from '@/features/onboarding/JourneyStep';
import { MoodStep } from '@/features/onboarding/MoodStep';
import { PlanStep } from '@/features/onboarding/PlanStep';
import { hasSavedOnboardingPlan } from '@/features/onboarding/onboardingModel';
import type { OnboardingMood } from '@/features/onboarding/onboardingSchemas';
import { completeOnboarding } from '@/features/onboarding/onboardingService';
import type { Profile } from '@/features/profile/profile';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
import { Screen } from '@/ui/Screen';

type Step = 'journey' | 'plan' | 'mood';
type JourneyMode = Profile['journey_mode'];

export function OnboardingFlow() {
  const { user, profile, refreshProfile } = useAuth();
  const [mode, setMode] = useState<JourneyMode>(profile?.journey_mode ?? 'quit');
  const [step, setStep] = useState<Step>(() =>
    profile && hasSavedOnboardingPlan(profile) ? 'mood' : 'journey',
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const defaultDisplayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name;
    return profile?.display_name ?? (typeof metadataName === 'string' ? metadataName : '');
  }, [profile?.display_name, user?.user_metadata?.display_name]);

  if (!user || !profile) {
    return (
      <Screen>
        <View style={styles.loading}>
          <BrandMark />
          <AppText variant="headline">Preparing your Reclaim journey…</AppText>
          <AppText tone="secondary">Loading your private setup and progress.</AppText>
        </View>
      </Screen>
    );
  }

  const userId = user.id;

  async function handlePlanSaved() {
    await refreshProfile();
    void trackAnalyticsEvent({
      eventName: 'plan_saved',
      userId,
      journeyMode: mode,
    });
    setStep('mood');
  }

  async function handleMood(mood: OnboardingMood) {
    setCompletionError(null);
    setIsCompleting(true);
    try {
      await completeOnboarding(userId, mood);
      await refreshProfile();
      void trackAnalyticsEvent({
        eventName: 'onboarding_completed',
        userId,
        journeyMode: mode,
      });
      router.replace(mood === 'craving' ? '/(app)/craving' : '/(app)');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Could not finish onboarding.');
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <Screen>
      {step === 'journey' ? (
        <JourneyStep
          value={mode}
          onSelect={(nextMode) => {
            setMode(nextMode);
            void trackAnalyticsEvent({
              eventName: 'journey_mode_selected',
              userId,
              journeyMode: nextMode,
            });
            setStep('plan');
          }}
        />
      ) : null}

      {step === 'plan' ? (
        <PlanStep
          userId={userId}
          mode={mode}
          profile={profile}
          defaultDisplayName={defaultDisplayName}
          onBack={() => setStep('journey')}
          onSaved={() => void handlePlanSaved()}
        />
      ) : null}

      {step === 'mood' ? (
        <MoodStep
          isSubmitting={isCompleting}
          error={completionError}
          onBack={() => setStep('plan')}
          onSelect={(mood) => void handleMood(mood)}
        />
      ) : null}
    </Screen>
  );
}


const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
