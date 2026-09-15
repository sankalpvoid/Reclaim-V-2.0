import { supabase } from '@/core/supabase/client';
import type { CravingFeedback, CravingToolKey } from '@/features/craving/cravingModel';

export type CravingRow = {
  id: string;
  resisted: boolean | null;
  toolkit: CravingToolKey | null;
  tool_feedback: CravingFeedback | null;
  duration_seconds: number | null;
  created_at: string;
};

export const cravingKeys = {
  history: (userId: string) => ['cravings', userId] as const,
};

export async function getCravingHistory(userId: string): Promise<CravingRow[]> {
  const { data, error } = await supabase
    .from('smoking_events')
    .select('id,resisted,toolkit,tool_feedback,duration_seconds,created_at')
    .eq('user_id', userId)
    .eq('event_type', 'craving')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as CravingRow[];
}

export async function recordCraving(input: {
  userId: string;
  resisted: boolean;
  toolkit: CravingToolKey | null;
  durationSeconds?: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('smoking_events')
    .insert({
      user_id: input.userId,
      cigarettes: 0,
      event_type: 'craving',
      resisted: input.resisted,
      toolkit: input.toolkit,
      duration_seconds:
        input.durationSeconds === undefined ? null : Math.max(0, Math.round(input.durationSeconds)),
      smoked_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function saveCravingFeedback(input: {
  userId: string;
  eventId: string;
  feedback: CravingFeedback;
}) {
  const { error } = await supabase
    .from('smoking_events')
    .update({ tool_feedback: input.feedback })
    .eq('id', input.eventId)
    .eq('user_id', input.userId)
    .eq('event_type', 'craving');

  if (error) throw error;
}
