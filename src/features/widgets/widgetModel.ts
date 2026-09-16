import type { Profile } from '../profile/profile';
import { buildQuitTodaySummary } from '../today/todayModel';

export type ReclaimWidgetSnapshot = {
  mode: 'quit' | 'reduce' | 'track';
  eyebrow: string;
  primary: string;
  secondary: string;
};

export function buildReclaimWidgetSnapshot(
  profile: Profile,
  now: Date = new Date(),
): ReclaimWidgetSnapshot {
  const mode = profile.journey_mode ?? 'quit';

  if (mode === 'quit') {
    const summary = buildQuitTodaySummary(profile, now);
    if (summary) {
      return {
        mode,
        eyebrow: 'SMOKE-FREE',
        primary: summary.durationLabel,
        secondary: `${summary.moneyLabel} reclaimed`,
      };
    }

    return {
      mode,
      eyebrow: 'QUIT NOW',
      primary: 'Your next decision',
      secondary: 'Open Reclaim to continue',
    };
  }

  if (mode === 'reduce') {
    return {
      mode,
      eyebrow: 'SMOKE LESS',
      primary: 'Today matters',
      secondary: 'Open Reclaim to log honestly',
    };
  }

  return {
    mode: 'track',
    eyebrow: 'UNDERSTAND',
    primary: 'Notice the pattern',
    secondary: 'Open Reclaim to log honestly',
  };
}
