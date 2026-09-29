import { calculateInitialReductionTarget } from '@/features/onboarding/onboardingModel';
import type { Profile } from '@/features/profile/profile';

export type JourneyMode = Profile['journey_mode'];

export type JourneyTransition = {
  journeyMode: JourneyMode;
  quitDate: string | null;
  dailyTarget: number | null;
};

export function buildJourneyTransition(
  profile: Profile,
  nextMode: JourneyMode,
  quitDate: Date,
  now: Date = new Date(),
): JourneyTransition {
  const baseline = profile.cigarettes_per_day ?? 0;
  if (!Number.isFinite(baseline) || baseline < 1) {
    throw new Error('Add a valid smoking baseline before changing your journey.');
  }

  if (nextMode === 'quit') {
    const quitAt = quitDate.getTime();
    if (!Number.isFinite(quitAt)) throw new Error('Choose a valid quit date.');
    if (quitAt > now.getTime() + 60_000) {
      throw new Error('Quit time cannot be in the future.');
    }

    return {
      journeyMode: 'quit',
      quitDate: quitDate.toISOString(),
      dailyTarget: null,
    };
  }

  if (nextMode === 'reduce') {
    return {
      journeyMode: 'reduce',
      quitDate: null,
      dailyTarget: calculateInitialReductionTarget(baseline),
    };
  }

  return {
    journeyMode: 'track',
    quitDate: null,
    dailyTarget: null,
  };
}

export function journeyTransitionCopy(
  currentMode: JourneyMode,
  nextMode: JourneyMode,
): string {
  if (currentMode === nextMode) {
    return nextMode === 'quit'
      ? 'You can correct your active quit date without changing the rest of your history.'
      : 'Your current journey is already selected.';
  }

  if (nextMode === 'quit') {
    return 'A new active smoke-free timeline will start from the quit date you choose. Existing logs, check-ins, goals, learning progress, and community activity stay intact.';
  }

  if (nextMode === 'reduce') {
    return 'Reclaim will create a fresh gentle daily target from your saved smoking baseline. Existing logs, check-ins, goals, learning progress, and community activity stay intact.';
  }

  return 'Reclaim will stop the active quit timeline or reduction target and focus on honest tracking. Existing history stays intact.';
}
