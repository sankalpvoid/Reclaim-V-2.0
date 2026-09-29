import {
  buildRecentDailySeries,
  dayKey,
  type DaySmokingSummary,
  type SmokingEvent,
} from '../../domain/smoking/smokingEvents';
import {
  buildWeeklyReview,
  type WeeklyReview,
  type WeekStatus,
} from '../../domain/smoking/reduction';

export type ReductionTargetHistoryEntry = {
  from: string;
  target: number;
};

export type ReductionReviewPlan = {
  baseline: number;
  current_target: number;
  stage: number;
  review_start: string;
  last_review_status: WeekStatus | null;
  target_history: ReductionTargetHistoryEntry[];
  review_window_days: number;
};

export type ReductionReviewState = {
  due: boolean;
  daysRemaining: number;
  days: DaySmokingSummary[];
  knownDays: number;
  review: WeeklyReview | null;
};

function calendarDayNumber(key: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = Date.UTC(year, month - 1, day);
  return Number.isFinite(value) ? Math.floor(value / 86_400_000) : null;
}

export function reductionReviewSchedule(
  reviewStart: string,
  reviewWindowDays: number,
  now: Date = new Date(),
) {
  const start = calendarDayNumber(reviewStart);
  const today = calendarDayNumber(dayKey(now));
  const windowDays = Math.max(1, Math.round(reviewWindowDays));

  if (start === null || today === null) {
    return { due: false, daysRemaining: windowDays };
  }

  const elapsedDays = Math.max(0, today - start);
  return {
    due: elapsedDays >= windowDays,
    daysRemaining: Math.max(0, windowDays - elapsedDays),
  };
}

export function buildReductionReviewState(input: {
  plan: ReductionReviewPlan;
  events: readonly SmokingEvent[];
  now?: Date;
}): ReductionReviewState {
  const now = input.now ?? new Date();
  const schedule = reductionReviewSchedule(
    input.plan.review_start,
    input.plan.review_window_days,
    now,
  );

  const reviewEnd = new Date(now);
  reviewEnd.setHours(12, 0, 0, 0);
  reviewEnd.setDate(reviewEnd.getDate() - 1);

  const days = buildRecentDailySeries(
    input.events,
    input.plan.review_window_days,
    reviewEnd,
  );
  const knownCounts = days.filter((day) => day.known).map((day) => day.cigarettes);

  return {
    ...schedule,
    days,
    knownDays: knownCounts.length,
    review: schedule.due
      ? buildWeeklyReview({
          dailyCounts: knownCounts,
          target: input.plan.current_target,
          previousReviewStatus: input.plan.last_review_status,
        })
      : null,
  };
}
