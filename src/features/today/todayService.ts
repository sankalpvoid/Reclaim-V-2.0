import { z } from 'zod';

import { supabase } from '@/core/supabase/client';

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
    .order('smoked_at', { ascending: true })
    .limit(1000);

  if (error) throw error;
  return z.array(smokingEventRowSchema).parse(data ?? []);
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

export async function logCigarette(userId: string, smokedAt: Date = new Date()): Promise<void> {
  const { error } = await supabase.from('smoking_events').insert({
    user_id: userId,
    event_type: 'smoked',
    cigarettes: 1,
    smoked_at: smokedAt.toISOString(),
  });

  if (error) throw error;
}
