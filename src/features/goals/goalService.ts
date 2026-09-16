import { z } from 'zod';

import { supabase } from '@/core/supabase/client';
import { goalDraftSchema, savingsGoalSchema, type GoalDraft, type SavingsGoal } from './goalModel';

export const goalKeys = {
  list: (userId: string) => ['goals', userId] as const,
};

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('id, user_id, name, target_amount, current_amount, achieved, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return z.array(savingsGoalSchema).parse(data ?? []);
}

export async function createSavingsGoal(userId: string, draft: GoalDraft): Promise<SavingsGoal> {
  const parsed = goalDraftSchema.parse(draft);
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: userId,
      name: parsed.name,
      target_amount: parsed.targetAmount,
      current_amount: 0,
      achieved: false,
    })
    .select('id, user_id, name, target_amount, current_amount, achieved, created_at')
    .single();

  if (error) throw error;
  return savingsGoalSchema.parse(data);
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  draft: GoalDraft,
): Promise<SavingsGoal> {
  const parsed = goalDraftSchema.parse(draft);
  const { data, error } = await supabase
    .from('savings_goals')
    .update({ name: parsed.name, target_amount: parsed.targetAmount })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('id, user_id, name, target_amount, current_amount, achieved, created_at')
    .single();

  if (error) throw error;
  return savingsGoalSchema.parse(data);
}

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
}
