import { supabase } from '@/core/supabase/client';
import {
  ONBOARDING_CHECKIN_CLIENT_ID,
  saveCheckin,
} from '@/features/checkins/checkinService';
import { getCurrencySymbol } from '@/features/onboarding/countries';
import {
  DEFAULT_REDUCTION_RATE,
  MINIMUM_REDUCTION_TARGET,
  calculateInitialReductionTarget,
  calculatePricePerCigarette,
} from '@/features/onboarding/onboardingModel';
import {
  onboardingMoodSchema,
  onboardingPlanSchema,
  type OnboardingMood,
  type OnboardingPlanInput,
} from '@/features/onboarding/onboardingSchemas';

const REDUCTION_REVIEW_WINDOW_DAYS = 7;

function localDateKey(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function syncReductionPlan(
  userId: string,
  cigarettesPerDay: number,
  dailyTarget: number | null,
) {
  if (dailyTarget === null) {
    const { error } = await supabase
      .from('reduction_plans')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const today = localDateKey();
  const { error } = await supabase.from('reduction_plans').upsert(
    {
      user_id: userId,
      version: 1,
      baseline: cigarettesPerDay,
      baseline_source: 'your estimate',
      current_target: dailyTarget,
      stage: 1,
      status: 'active',
      started_on: today,
      review_start: today,
      last_review_status: null,
      last_review: null,
      target_history: [{ from: today, target: dailyTarget }],
      minimum_automatic_target: MINIMUM_REDUCTION_TARGET,
      reduction_rate: DEFAULT_REDUCTION_RATE,
      review_window_days: REDUCTION_REVIEW_WINDOW_DAYS,
      target_changed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}

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

  await syncReductionPlan(userId, plan.cigarettesPerDay, dailyTarget);

  return { dailyTarget };
}

export async function completeOnboarding(userId: string, mood: OnboardingMood) {
  const parsedMood = onboardingMoodSchema.parse(mood);

  await saveCheckin({
    userId,
    clientId: ONBOARDING_CHECKIN_CLIENT_ID,
    mood: parsedMood,
  });

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw profileError;
}
