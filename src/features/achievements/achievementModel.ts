import { formatMoneyAmount } from '../../domain/format/money';
export type ProgressMomentInput = {
  elapsedDays: number;
  cigarettesAvoided: number;
  moneyReclaimed: number;
  minutesReclaimed: number;
  currencySymbol: string;
};

export type ProgressMoment = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  detail: string;
};

const dayMilestones = [365, 180, 90, 30, 14, 7, 3, 1] as const;
const cigaretteMilestones = [10_000, 5_000, 2_500, 1_000, 500, 250, 100, 50, 10] as const;
const moneyMilestones = [100_000, 50_000, 25_000, 10_000, 5_000, 2_500, 1_000, 500] as const;
const timeMilestones = [10_080, 5_040, 2_520, 1_440, 720, 360, 120] as const;

function formatInteger(value: number): string {
  return Math.floor(Math.max(0, value)).toLocaleString();
}

function formatMoney(currencySymbol: string, value: number): string {
  return formatMoneyAmount(currencySymbol, value, 'floor');
}

function formatMinutes(minutes: number): string {
  const safe = Math.floor(Math.max(0, minutes));
  const days = Math.floor(safe / 1_440);
  const hours = Math.floor((safe % 1_440) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${safe}m`;
}

function recentlyReached(
  value: number,
  thresholds: readonly number[],
  windowForThreshold: (threshold: number) => number,
): number | null {
  return (
    thresholds.find((threshold) => {
      const window = Math.max(0, windowForThreshold(threshold));
      return value >= threshold && value < threshold + window;
    }) ?? null
  );
}

export function buildProgressMoment(input: ProgressMomentInput): ProgressMoment | null {
  const dayMilestone = recentlyReached(input.elapsedDays, dayMilestones, () => 1);
  if (dayMilestone !== null) {
    return {
      id: `days-${dayMilestone}`,
      eyebrow: 'PROGRESS MOMENT',
      title: `${formatInteger(dayMilestone)} smoke-free day${dayMilestone === 1 ? '' : 's'}`,
      body: 'This is not a streak to protect at all costs. It is evidence that your next decision can be different too.',
      detail: `Current total: ${formatInteger(input.elapsedDays)} day${Math.floor(input.elapsedDays) === 1 ? '' : 's'} smoke-free`,
    };
  }

  const cigarettesMilestone = recentlyReached(
    input.cigarettesAvoided,
    cigaretteMilestones,
    (threshold) => Math.max(2, threshold * 0.05),
  );
  if (cigarettesMilestone !== null) {
    return {
      id: `cigarettes-${cigarettesMilestone}`,
      eyebrow: 'PROGRESS MOMENT',
      title: `${formatInteger(cigarettesMilestone)} cigarettes avoided`,
      body: 'A large number came from many small decisions. Reclaim counts it without turning it into pressure.',
      detail: `Current total: ${formatInteger(input.cigarettesAvoided)} avoided`,
    };
  }

  const moneyMilestone = recentlyReached(
    input.moneyReclaimed,
    moneyMilestones,
    (threshold) => Math.max(50, threshold * 0.05),
  );
  if (moneyMilestone !== null) {
    return {
      id: `money-${moneyMilestone}`,
      eyebrow: 'PROGRESS MOMENT',
      title: `${formatMoney(input.currencySymbol, moneyMilestone)} reclaimed`,
      body: 'That money did not disappear into smoke. Keep tying it to something meaningful, not just a number.',
      detail: `Current total: ${formatMoney(input.currencySymbol, input.moneyReclaimed)}`,
    };
  }

  const timeMilestone = recentlyReached(input.minutesReclaimed, timeMilestones, () => 60);
  if (timeMilestone !== null) {
    return {
      id: `time-${timeMilestone}`,
      eyebrow: 'PROGRESS MOMENT',
      title: `${formatMinutes(timeMilestone)} reclaimed`,
      body: 'Time comes back quietly. This is space you no longer had to give to cigarettes.',
      detail: `Current total: ${formatMinutes(input.minutesReclaimed)}`,
    };
  }

  return null;
}
