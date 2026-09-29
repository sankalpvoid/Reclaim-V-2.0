import { supabase } from '@/core/supabase/client';
import { dayKey } from '@/domain/smoking/smokingEvents';
import type { WeeklyReview } from '@/domain/smoking/reduction';
import type {
  ReductionReviewPlan,
  ReductionTargetHistoryEntry,
} from '@/features/reduction/reductionReviewModel';

export type ReductionReviewDecision = 'accept' | 'keep';

export async function completeReductionReview(input: {
  userId: string;
  plan: ReductionReviewPlan;
  review: WeeklyReview;
  decision: ReductionReviewDecision;
  now?: Date;
}) {
  if (input.review.status === 'collect_more_data') {
    throw new Error('More real smoking logs are needed before this review can be completed.');
  }

  const now = input.now ?? new Date();
  const canAcceptNextTarget =
    input.decision === 'accept' &&
    (input.review.action === 'reduce' || input.review.action === 'offer_adjustment');
  const nextTarget = canAcceptNextTarget
    ? input.review.nextTarget
    : input.plan.current_target;
  const targetChanged = nextTarget !== input.plan.current_target;
  const nextStage =
    input.plan.stage + (canAcceptNextTarget && input.review.action === 'reduce' ? 1 : 0);
  const targetHistory: ReductionTargetHistoryEntry[] = [...input.plan.target_history];

  if (targetChanged) {
    targetHistory.push({ from: dayKey(now), target: nextTarget });
  }

  const { error: planError } = await supabase
    .from('reduction_plans')
    .update({
      current_target: nextTarget,
      stage: nextStage,
      review_start: dayKey(now),
      last_review_status: input.review.status,
      last_review: input.review,
      target_history: targetHistory,
      target_changed: targetChanged,
      updated_at: now.toISOString(),
    })
    .eq('user_id', input.userId);

  if (planError) throw planError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      daily_target: nextTarget,
      updated_at: now.toISOString(),
    })
    .eq('id', input.userId);

  if (profileError) throw profileError;

  return { nextTarget, targetChanged, nextStage };
}
