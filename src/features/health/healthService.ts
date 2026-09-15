import { supabase } from '@/core/supabase/client';
import { healthMilestoneSchema, type HealthMilestone } from '@/features/health/healthModel';

export const healthKeys = {
  milestones: ['health', 'milestones'] as const,
};

export async function getHealthMilestones(): Promise<HealthMilestone[]> {
  const { data, error } = await supabase
    .from('health_milestones')
    .select('id, title, description, minutes_after_quitting, source_name, source_url')
    .order('minutes_after_quitting', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => healthMilestoneSchema.parse(row));
}
