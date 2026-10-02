import type { SmokingEvent } from '../../domain/smoking/smokingEvents';
import type { Profile } from '../profile/profile';
import { buildQuitTodaySummary, buildSmokingTodaySummary } from '../today/todayModel';

export type ReclaimWidgetSnapshot = {
  mode: 'quit' | 'reduce' | 'track';
  eyebrow: string;
  primary: string;
  secondary: string;
};

export const signedOutWidgetSnapshot: ReclaimWidgetSnapshot = {
  mode: 'track',
  eyebrow: 'RECLAIM',
  primary: 'Open Reclaim',
  secondary: 'Sign in to continue',
};

export type ReclaimWidgetContext = {
  smokingEvents?: readonly SmokingEvent[] | undefined;
  reductionTarget?: number | null | undefined;
};

export function buildReclaimWidgetSnapshot(
  profile: Profile,
  now: Date = new Date(),
  context: ReclaimWidgetContext = {},
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

  if (context.smokingEvents !== undefined) {
    const target = mode === 'reduce' ? (context.reductionTarget ?? profile.daily_target ?? null) : null;
    const summary = buildSmokingTodaySummary(profile, context.smokingEvents, target, now);
    const today = summary.recentDays.at(-1);
    const hasTodayLog = today?.known === true;

    if (mode === 'reduce') {
      if (!hasTodayLog) {
        return {
          mode,
          eyebrow: 'SMOKE LESS',
          primary: 'No log yet',
          secondary: target === null ? 'Open Reclaim to log honestly' : `Target: ${target} today`,
        };
      }

      if (summary.targetProgress) {
        const { remaining, overBy } = summary.targetProgress;
        return {
          mode,
          eyebrow: 'SMOKE LESS',
          primary: `${summary.todayCount} / ${summary.targetProgress.target}`,
          secondary:
            overBy > 0
              ? `${overBy} over target · keep logging`
              : `${remaining} remaining today`,
        };
      }

      return {
        mode,
        eyebrow: 'SMOKE LESS',
        primary: `${summary.todayCount} logged today`,
        secondary: `${summary.sevenDayCount} in the last 7 days`,
      };
    }

    return {
      mode: 'track',
      eyebrow: 'UNDERSTAND',
      primary: hasTodayLog ? `${summary.todayCount} logged today` : 'No log yet',
      secondary:
        summary.sevenDayCount > 0
          ? `${summary.sevenDayCount} in the last 7 days`
          : 'Open Reclaim to log honestly',
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
