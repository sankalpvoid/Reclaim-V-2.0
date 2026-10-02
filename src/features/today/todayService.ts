import { z } from 'zod';

import { supabase } from '@/core/supabase/client';
import { applyLapse, validateSmokedAt, type LapseInput } from '@/domain/smoking/lapse';

const smokingEventRowSchema = z.object({
  id: z.string().uuid(),
  smoked_at: z.string(),
  cigarettes: z.coerce.number(),
});

const reductionPlanRowSchema = z.object({
  user_id: z.string().uuid(),
  baseline: z.number().int(),
  current_target: z.number().int(),
  stage: z.number().int(),
  status: z.enum(['active', 'paused', 'completed']),
});

export type SmokingEventRow = z.infer<typeof smokingEventRowSchema>;
export type ReductionPlanRow = z.infer<typeof reductionPlanRowSchema>;

export const todayKeys = {
  smokingEvents: (userId: string) => ['today', 'smoking-events', userId] as const,
  reductionPlan: (userId: string) => ['today', 'reduction-plan', userId] as const,
};

export async function getSmokingEvents(userId: string): Promise<SmokingEventRow[]> {
  const { data, error } = await supabase
    .from('smoking_events')
    .select('id, smoked_at, cigarettes')
    .eq('user_id', userId)
    .eq('event_type', 'smoked')
    .order('smoked_at', { ascending: false })
    .limit(1000);

  if (error) throw error;
  // Newest 1000 (so a long history never drops recent events), returned oldest-first.
  return z.array(smokingEventRowSchema).parse(data ?? []).reverse();
}

export async function getReductionPlan(userId: string): Promise<ReductionPlanRow | null> {
  const { data, error } = await supabase
    .from('reduction_plans')
    .select('user_id, baseline, current_target, stage, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? reductionPlanRowSchema.parse(data) : null;
}

export async function logCigarette(
  userId: string,
  smokedAt: Date = new Date(),
): Promise<string> {
  const checked = validateSmokedAt(smokedAt);
  if (!checked.ok) {
    throw new Error(
      checked.reason === 'future'
        ? 'A cigarette cannot be logged in the future.'
        : 'That date and time is not valid.',
    );
  }

  const { data, error } = await supabase
    .from('smoking_events')
    .insert({
      user_id: userId,
      event_type: 'smoked',
      cigarettes: 1,
      smoked_at: checked.value.toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return z.object({ id: z.string().uuid() }).parse(data).id;
}

export async function deleteSmokingEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('smoking_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function recordLapse(
  userId: string,
  current: LapseInput,
  smokedAt: Date,
): Promise<void> {
  const result = applyLapse(current, smokedAt);
  if (!result.ok) {
    throw new Error(
      result.reason === 'future'
        ? 'A cigarette cannot be logged in the future.'
        : result.reason === 'before-quit'
          ? 'That is before your current quit date. Pick a time after it.'
          : 'That date and time is not valid.',
    );
  }

  const eventId = await logCigarette(userId, smokedAt);

  const { error } = await supabase
    .from('profiles')
    .update({
      quit_date: result.update.quitDate.toISOString(),
      attempt_number: result.update.attemptNumber,
      best_streak_seconds: result.update.bestStreakSeconds,
    })
    .eq('id', userId);

  if (error) {
    await deleteSmokingEvent(userId, eventId).catch(() => undefined);
    throw error;
  }
}
