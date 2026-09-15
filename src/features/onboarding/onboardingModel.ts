import { calculateNextTarget } from '../../domain/smoking/reduction';
import type { Profile } from '@/features/profile/profile';

export const DEFAULT_REDUCTION_RATE = 0.1;
export const MINIMUM_REDUCTION_TARGET = 1;

export function calculateInitialReductionTarget(
  cigarettesPerDay: number,
  reductionRate = DEFAULT_REDUCTION_RATE,
): number {
  return calculateNextTarget(cigarettesPerDay, { reductionRate });
}

export function calculatePricePerCigarette(pricePerPack: number, cigarettesPerPack: number): number {
  if (!Number.isFinite(pricePerPack) || !Number.isFinite(cigarettesPerPack) || cigarettesPerPack <= 0) {
    return 0;
  }
  return pricePerPack / cigarettesPerPack;
}

export function hasSavedOnboardingPlan(profile: Profile): boolean {
  const hasBasics =
    Boolean(profile.display_name?.trim()) &&
    Boolean(profile.country) &&
    profile.cigarettes_per_day !== null &&
    profile.cigarettes_per_day > 0 &&
    profile.price_per_pack !== null &&
    profile.price_per_pack >= 0 &&
    profile.cigarettes_per_pack !== null &&
    profile.cigarettes_per_pack > 0;

  if (!hasBasics) return false;
  if (profile.journey_mode === 'quit') return Boolean(profile.quit_date);
  if (profile.journey_mode === 'reduce') return profile.daily_target !== null && profile.daily_target >= 1;
  return true;
}
