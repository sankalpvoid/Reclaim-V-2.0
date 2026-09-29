import { calculateQuitMetrics } from '../../domain/smoking/quitMetrics';
import {
  buildRecentDailySeries,
  calculateSmokingSpend,
  countCigarettesOnDay,
  dayKey,
  type SmokingEvent,
} from '../../domain/smoking/smokingEvents';
import { summarizeToday } from '../../domain/smoking/reduction';
import { buildGoalProgress, type SavingsGoal } from '../goals/goalModel';
import {
  dailyCheckinClientId,
  localDateKey,
  type Checkin,
  type Mood,
} from '../checkins/checkinModel';
import type { CravingRow } from '../craving/cravingService';
import type { Profile } from '../profile/profile';

export function formatSmokeFreeDuration(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatReclaimedMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
}

export function formatMoney(currencySymbol: string, value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${currencySymbol}${Math.round(safeValue).toLocaleString()}`;
}

export function formatAvoidedCigarettes(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safeValue > 0 && safeValue < 1) return safeValue.toFixed(1);
  return Math.floor(safeValue).toLocaleString();
}

export function buildQuitTodaySummary(profile: Profile, now: Date = new Date()) {
  if (!profile.quit_date) return null;

  const metrics = calculateQuitMetrics(
    {
      quitDate: profile.quit_date,
      cigarettesPerDay: profile.cigarettes_per_day ?? 0,
      pricePerPack: profile.price_per_pack ?? 0,
      cigarettesPerPack: profile.cigarettes_per_pack ?? 0,
      minutesPerCigarette: profile.minutes_per_cigarette,
    },
    now,
  );

  return {
    ...metrics,
    durationLabel: formatSmokeFreeDuration(metrics.elapsedMilliseconds),
    avoidedLabel: formatAvoidedCigarettes(metrics.cigarettesAvoided),
    moneyLabel: formatMoney(profile.currency_symbol, metrics.moneyReclaimed),
    timeLabel: formatReclaimedMinutes(metrics.minutesReclaimed),
  };
}

export function buildSmokingTodaySummary(
  profile: Profile,
  events: readonly SmokingEvent[],
  target: number | null,
  now: Date = new Date(),
) {
  const today = dayKey(now);
  const todayCount = countCigarettesOnDay(events, today);
  const recentDays = buildRecentDailySeries(events, 7, now);
  const sevenDayCount = recentDays.reduce((sum, day) => sum + day.cigarettes, 0);
  const knownDays = recentDays.filter((day) => day.known).length;
  const todaySpend = calculateSmokingSpend(
    todayCount,
    profile.price_per_pack ?? 0,
    profile.cigarettes_per_pack ?? 0,
  );
  const sevenDaySpend = calculateSmokingSpend(
    sevenDayCount,
    profile.price_per_pack ?? 0,
    profile.cigarettes_per_pack ?? 0,
  );

  return {
    today,
    todayCount,
    sevenDayCount,
    knownDays,
    todaySpend,
    sevenDaySpend,
    recentDays,
    targetProgress: target === null ? null : summarizeToday({ smoked: todayCount, target }),
  };
}


export type TodayFocusRoute =
  | '/(app)/craving'
  | '/(app)/check-in'
  | '/(app)/goals'
  | '/(app)/insights';

export type TodayFocus = {
  kind: 'support' | 'checkin' | 'goal' | 'insights';
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  route: TodayFocusRoute;
};

const moodLabels: Record<Mood, string> = {
  great: 'Great',
  okay: 'Okay',
  struggling: 'Struggling',
  craving: 'Strong cravings',
};

function isRecentCraving(createdAt: string, now: Date): boolean {
  const cravingAt = new Date(createdAt).getTime();
  const nowAt = now.getTime();
  if (!Number.isFinite(cravingAt) || !Number.isFinite(nowAt)) return false;
  const elapsed = nowAt - cravingAt;
  return elapsed >= 0 && elapsed <= 3 * 60 * 60 * 1_000;
}

export function buildPersonalizedToday(input: {
  mode: Profile['journey_mode'];
  checkins: readonly Checkin[];
  cravings: readonly CravingRow[];
  goals: readonly SavingsGoal[];
  moneyReclaimed: number;
  currencySymbol: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const todayClientId = dailyCheckinClientId(now);
  const todayCheckin = input.checkins.find((checkin) => checkin.clientId === todayClientId) ?? null;
  const todayKey = localDateKey(now);
  const cravingsToday = input.cravings.filter(
    (craving) => localDateKey(new Date(craving.created_at)) === todayKey,
  );
  const resistedToday = cravingsToday.filter((craving) => craving.resisted === true).length;
  const hasRecentCraving = cravingsToday.some((craving) => isRecentCraving(craving.created_at, now));

  const goalCandidates =
    input.mode === 'quit'
      ? input.goals
          .map((goal) => ({
            goal,
            progress: buildGoalProgress(goal.target_amount, input.moneyReclaimed),
          }))
          .filter(({ progress }) => !progress.achieved)
      : [];
  const nextGoal = goalCandidates[0] ?? null;

  let focus: TodayFocus;

  if (todayCheckin?.mood === 'craving' || todayCheckin?.mood === 'struggling') {
    focus = {
      kind: 'support',
      eyebrow: 'FOR YOU NOW',
      title: todayCheckin.mood === 'craving' ? 'Make the next few minutes easier.' : 'Today feels harder. Keep the next step small.',
      body:
        todayCheckin.mood === 'craving'
          ? 'You checked in with strong cravings today. Put a support tool one tap away instead of relying on willpower alone.'
          : 'You marked today as a struggle. A short craving tool can create some space before the next decision.',
      ctaLabel: 'Open craving support',
      route: '/(app)/craving',
    };
  } else if (hasRecentCraving) {
    focus = {
      kind: 'support',
      eyebrow: 'FOR YOU NOW',
      title: 'You handled an urge recently.',
      body: 'A craving was logged in the last few hours. Keep support close while the pattern is still fresh.',
      ctaLabel: 'Open craving support',
      route: '/(app)/craving',
    };
  } else if (!todayCheckin) {
    focus = {
      kind: 'checkin',
      eyebrow: 'FOR YOU NOW',
      title: 'Give Reclaim ten seconds of context.',
      body: 'You have not checked in today yet. One mood check-in helps the app interpret cravings, smoking logs, and later insights more intelligently.',
      ctaLabel: 'Check in now',
      route: '/(app)/check-in',
    };
  } else if (nextGoal) {
    focus = {
      kind: 'goal',
      eyebrow: 'FOR YOU NOW',
      title: `You are ${Math.round(nextGoal.progress.progressPercent)}% of the way to ${nextGoal.goal.name}.`,
      body: `${formatMoney(input.currencySymbol, nextGoal.progress.remainingAmount)} left to reach this target from your reclaimed total.`,
      ctaLabel: 'View savings goals',
      route: '/(app)/goals',
    };
  } else {
    focus = {
      kind: 'insights',
      eyebrow: 'FOR YOU NOW',
      title: 'Your data has context now.',
      body: 'You have checked in today. See whether your recent logs are starting to form a repeated pattern.',
      ctaLabel: 'View insights',
      route: '/(app)/insights',
    };
  }

  return {
    focus,
    moodLabel: todayCheckin ? moodLabels[todayCheckin.mood] : 'Not checked in',
    cravingsToday: cravingsToday.length,
    resistedToday,
    goalSignal: nextGoal
      ? {
          name: nextGoal.goal.name,
          progressPercent: nextGoal.progress.progressPercent,
          remainingAmount: nextGoal.progress.remainingAmount,
        }
      : null,
  };
}
