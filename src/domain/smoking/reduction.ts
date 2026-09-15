export const REDUCTION_RULES = Object.freeze({
  reviewWindowDays: 7,
  minimumLoggedDaysForReview: 4,
  defaultReductionRate: 0.1,
  minimumWeeklyDrop: 1,
  minimumAutomaticTarget: 1,
  stableSuccessRate: 0.7,
  strugglingSuccessRate: 0.4,
});

export type WeekStatus = 'collect_more_data' | 'stable' | 'mixed' | 'struggling';
export type ReviewAction = 'keep_logging' | 'reduce' | 'offer_quit_transition' | 'hold' | 'offer_adjustment';

export type WeekClassification = {
  status: WeekStatus;
  loggedDays: number;
  target: number;
  average: number | null;
  successDays: number;
  successRate: number;
};

export type WeeklyReview = WeekClassification & {
  action: ReviewAction;
  nextTarget: number;
  message: string;
};

export type ReductionPlan = {
  baseline: number;
  currentTarget: number;
  minimumAutomaticTarget: number;
  reductionRate: number;
  reviewWindowDays: number;
  stage: number;
  status: 'active';
  lastReviewStatus?: WeekStatus | null;
  lastReview?: WeeklyReview;
  targetChanged?: boolean;
};

export function clampInt(
  value: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const rounded = Number.isFinite(value) ? Math.round(value) : min;
  return Math.min(max, Math.max(min, rounded));
}

function validCounts(values: readonly number[]): number[] {
  return values.filter((value) => Number.isFinite(value) && value >= 0);
}

function mean(values: readonly number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function calculateBaseline({
  smokingLogs = [],
  onboardingEstimate,
}: {
  smokingLogs?: readonly number[];
  onboardingEstimate: number;
}): number {
  const observed = validCounts(smokingLogs).slice(-7);
  const estimate = clampInt(onboardingEstimate, 1);

  if (observed.length >= 4) {
    return Math.max(1, Math.round(mean(observed)));
  }

  return estimate;
}

export function calculateNextTarget(
  currentTarget: number,
  {
    reductionRate = REDUCTION_RULES.defaultReductionRate,
    minimumDrop = REDUCTION_RULES.minimumWeeklyDrop,
  }: { reductionRate?: number; minimumDrop?: number } = {},
): number {
  const current = clampInt(currentTarget, REDUCTION_RULES.minimumAutomaticTarget);
  if (current <= REDUCTION_RULES.minimumAutomaticTarget) {
    return REDUCTION_RULES.minimumAutomaticTarget;
  }

  const rate = Number.isFinite(reductionRate)
    ? Math.max(0, reductionRate)
    : REDUCTION_RULES.defaultReductionRate;
  const drop = Math.max(clampInt(minimumDrop, 1), Math.round(current * rate));

  return Math.max(REDUCTION_RULES.minimumAutomaticTarget, current - drop);
}

export function classifyDay(
  actual: number,
  target: number,
): 'under' | 'on_target' | 'over' {
  const smoked = clampInt(actual, 0);
  const goal = clampInt(target, REDUCTION_RULES.minimumAutomaticTarget);
  if (smoked < goal) return 'under';
  if (smoked === goal) return 'on_target';
  return 'over';
}

export function classifyWeek({
  dailyCounts = [],
  target,
}: {
  dailyCounts?: readonly number[];
  target: number;
}): WeekClassification {
  const counts = validCounts(dailyCounts).slice(-REDUCTION_RULES.reviewWindowDays);
  const goal = clampInt(target, REDUCTION_RULES.minimumAutomaticTarget);
  const successDays = counts.filter((value) => value <= goal).length;
  const average = counts.length > 0 ? mean(counts) : null;
  const successRate = counts.length > 0 ? successDays / counts.length : 0;

  if (counts.length < REDUCTION_RULES.minimumLoggedDaysForReview) {
    return {
      status: 'collect_more_data',
      loggedDays: counts.length,
      target: goal,
      average,
      successDays,
      successRate,
    };
  }

  if (successRate >= REDUCTION_RULES.stableSuccessRate && average !== null && average <= goal) {
    return {
      status: 'stable',
      loggedDays: counts.length,
      target: goal,
      average,
      successDays,
      successRate,
    };
  }

  if (successRate < REDUCTION_RULES.strugglingSuccessRate && average !== null && average > goal) {
    return {
      status: 'struggling',
      loggedDays: counts.length,
      target: goal,
      average,
      successDays,
      successRate,
    };
  }

  return {
    status: 'mixed',
    loggedDays: counts.length,
    target: goal,
    average,
    successDays,
    successRate,
  };
}

export function buildWeeklyReview({
  dailyCounts = [],
  target,
  previousReviewStatus = null,
}: {
  dailyCounts?: readonly number[];
  target: number;
  previousReviewStatus?: WeekStatus | null;
}): WeeklyReview {
  const week = classifyWeek({ dailyCounts, target });
  const goal = week.target;

  if (week.status === 'collect_more_data') {
    return {
      ...week,
      action: 'keep_logging',
      nextTarget: goal,
      message: 'Keep logging for a few more days. Reclaim will adjust only when there is enough real data.',
    };
  }

  if (week.status === 'stable') {
    return {
      ...week,
      action: goal > 1 ? 'reduce' : 'offer_quit_transition',
      nextTarget: calculateNextTarget(goal),
      message:
        goal > 1
          ? 'You handled this target consistently. Reclaim can lower the next target gently.'
          : 'You are holding at 1 cigarette a day. Moving to zero should be your choice, not an automatic step.',
    };
  }

  if (week.status === 'struggling') {
    const repeated = previousReviewStatus === 'struggling';
    return {
      ...week,
      action: repeated ? 'offer_adjustment' : 'hold',
      nextTarget: repeated ? goal + 1 : goal,
      message: repeated
        ? 'This target has felt too difficult across two reviews. Reclaim can temporarily raise it by one instead of punishing you.'
        : 'Hold this target for another week. One difficult week should not trigger a harsher plan.',
    };
  }

  return {
    ...week,
    action: 'hold',
    nextTarget: goal,
    message: 'This week was mixed. Keep the same target and build consistency before reducing again.',
  };
}

export function createInitialReductionPlan({
  smokingLogs = [],
  onboardingEstimate,
}: {
  smokingLogs?: readonly number[];
  onboardingEstimate: number;
}): ReductionPlan {
  const baseline = calculateBaseline({ smokingLogs, onboardingEstimate });
  const firstTarget = calculateNextTarget(baseline);

  return {
    baseline,
    currentTarget: firstTarget,
    minimumAutomaticTarget: REDUCTION_RULES.minimumAutomaticTarget,
    reductionRate: REDUCTION_RULES.defaultReductionRate,
    reviewWindowDays: REDUCTION_RULES.reviewWindowDays,
    stage: 1,
    status: 'active',
  };
}

export function applyWeeklyReview(
  plan: ReductionPlan,
  dailyCounts: readonly number[],
): ReductionPlan {
  const currentTarget = clampInt(plan.currentTarget, REDUCTION_RULES.minimumAutomaticTarget);
  const review = buildWeeklyReview({
    dailyCounts,
    target: currentTarget,
    previousReviewStatus: plan.lastReviewStatus ?? null,
  });

  return {
    ...plan,
    currentTarget: review.nextTarget,
    stage: Math.max(1, Math.round(plan.stage)) + (review.action === 'reduce' ? 1 : 0),
    lastReviewStatus: review.status,
    lastReview: review,
    targetChanged: review.nextTarget !== currentTarget,
  };
}

export function getReductionProgress({
  baseline,
  currentTarget,
}: Pick<ReductionPlan, 'baseline' | 'currentTarget'>) {
  const start = clampInt(baseline, 1);
  const target = clampInt(currentTarget, 1);
  const cigarettesReduced = Math.max(0, start - target);

  return {
    baseline: start,
    currentTarget: target,
    cigarettesReduced,
    percentReduced: start > 0 ? Math.round((cigarettesReduced / start) * 100) : 0,
    atMinimumAutomaticTarget: target <= REDUCTION_RULES.minimumAutomaticTarget,
  };
}

export function summarizeToday({ smoked = 0, target }: { smoked?: number; target: number }) {
  const actual = clampInt(smoked, 0);
  const goal = clampInt(target, REDUCTION_RULES.minimumAutomaticTarget);

  return {
    smoked: actual,
    target: goal,
    remaining: Math.max(0, goal - actual),
    overBy: Math.max(0, actual - goal),
    status: classifyDay(actual, goal),
    reachedTarget: actual >= goal,
  };
}
