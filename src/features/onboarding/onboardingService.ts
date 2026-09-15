import { supabase } from '@/core/supabase/client';
import { getCurrencySymbol } from '@/features/onboarding/countries';
import {
  calculateInitialReductionTarget,
  calculatePricePerCigarette,
} from '@/features/onboarding/onboardingModel';
import {
  onboardingMoodSchema,
  onboardingPlanSchema,
  type OnboardingMood,
  type OnboardingPlanInput,
} from '@/features/onboarding/onboardingSchemas';

const ONBOARDING_CHECKIN_CLIENT_ID = 'onboarding-v2';

export async function saveOnboardingPlan(userId: string, input: OnboardingPlanInput) {
  const plan = onboardingPlanSchema.parse(input);
  const dailyTarget =
    plan.journeyMode === 'reduce'
      ? calculateInitialReductionTarget(plan.cigarettesPerDay)
      : null;
  const quitDate = plan.journeyMode === 'quit' ? plan.quitDate!.toISOString() : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: plan.displayName,
      journey_mode: plan.journeyMode,
      quit_date: quitDate,
      cigarettes_per_day: plan.cigarettesPerDay,
      daily_target: dailyTarget,
      price_per_pack: plan.pricePerPack,
      cigarettes_per_pack: plan.cigarettesPerPack,
      price_per_cigarette: calculatePricePerCigarette(
        plan.pricePerPack,
        plan.cigarettesPerPack,
      ),
      country: plan.country,
      currency_symbol: getCurrencySymbol(plan.country),
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  return { dailyTarget };
}

export async function completeOnboarding(userId: string, mood: OnboardingMood) {
  const parsedMood = onboardingMoodSchema.parse(mood);

  const { error: checkinError } = await supabase.from('daily_checkins').insert({
    user_id: userId,
    client_id: ONBOARDING_CHECKIN_CLIENT_ID,
    mood: parsedMood,
  });

  // The stable client id makes retries idempotent. A duplicate means the
  // onboarding check-in already reached Supabase on an earlier attempt.
  if (checkinError && checkinError.code !== '23505') throw checkinError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw profileError;
}
