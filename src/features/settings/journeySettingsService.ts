import { supabase } from '@/core/supabase/client';
import { syncReductionPlan } from '@/features/onboarding/onboardingService';
import type { Profile } from '@/features/profile/profile';
import {
  buildJourneyTransition,
  type JourneyMode,
} from '@/features/settings/journeySettingsModel';

export async function updateJourneySettings(input: {
  userId: string;
  profile: Profile;
  nextMode: JourneyMode;
  quitDate: Date;
}) {
  const transition = buildJourneyTransition(input.profile, input.nextMode, input.quitDate);
  const baseline = input.profile.cigarettes_per_day ?? 0;

  const { error } = await supabase
    .from('profiles')
    .update({
      journey_mode: transition.journeyMode,
      quit_date: transition.quitDate,
      daily_target: transition.dailyTarget,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId);

  if (error) throw error;

  if (input.profile.journey_mode !== transition.journeyMode) {
    await syncReductionPlan(input.userId, baseline, transition.dailyTarget);
  }

  return transition;
}
