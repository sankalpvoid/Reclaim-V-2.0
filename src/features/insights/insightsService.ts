import { z } from 'zod';

import { supabase } from '@/core/supabase/client';

const insightEventSchema = z.object({
  smoked_at: z.string(),
  event_type: z.string(),
  cigarettes: z.coerce.number().nullable().optional(),
  toolkit: z.string().nullable().optional(),
  tool_feedback: z.string().nullable().optional(),
});

const insightCheckinSchema = z.object({
  mood: z.string(),
  created_at: z.string(),
});

export type InsightEventRow = z.infer<typeof insightEventSchema>;
export type InsightCheckinRow = z.infer<typeof insightCheckinSchema>;

export const insightKeys = {
  source: (userId: string) => ['insights', 'source', userId] as const,
};

export async function getInsightSourceData(userId: string) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [eventsResult, checkinsResult] = await Promise.all([
    supabase
      .from('smoking_events')
      .select('smoked_at, event_type, cigarettes, toolkit, tool_feedback')
      .eq('user_id', userId)
      .gte('smoked_at', since)
      .order('smoked_at', { ascending: false })
      .limit(1000),
    supabase
      .from('daily_checkins')
      .select('mood, created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(100),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (checkinsResult.error) throw checkinsResult.error;

  return {
    events: z.array(insightEventSchema).parse(eventsResult.data ?? []),
    checkins: z.array(insightCheckinSchema).parse(checkinsResult.data ?? []),
  };
}
