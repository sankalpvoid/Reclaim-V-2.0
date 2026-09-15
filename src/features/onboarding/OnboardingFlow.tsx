import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { JourneyStep } from '@/features/onboarding/JourneyStep';
import { MoodStep } from '@/features/onboarding/MoodStep';
import { PlanStep } from '@/features/onboarding/PlanStep';
import { hasSavedOnboardingPlan } from '@/features/onboarding/onboardingModel';
import type { OnboardingMood } from '@/features/onboarding/onboardingSchemas';
import { completeOnboarding } from '@/features/onboarding/onboardingService';
import type { Profile } from '@/features/profile/profile';
import { AppText } from '@/ui/AppText';
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
        <AppText tone="secondary">Preparing your Reclaim journey…</AppText>
      </Screen>
    );
  }

  async function handlePlanSaved() {
    await refreshProfile();
    setStep('mood');
  }

  async function handleMood(mood: OnboardingMood) {
    setCompletionError(null);
    setIsCompleting(true);
    try {
      await completeOnboarding(user.id, mood);
      await refreshProfile();
      router.replace('/(app)');
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
            setStep('plan');
          }}
        />
      ) : null}

      {step === 'plan' ? (
        <PlanStep
          userId={user.id}
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
