import { z } from 'zod';

import { supabase } from '@/core/supabase/client';

export const journeyModeSchema = z.enum(['quit', 'reduce', 'track']);

export const profileSchema = z.object({
  id: z.string().uuid(),
  quit_date: z.string().nullable(),
  cigarettes_per_day: z.number().nullable(),
  price_per_cigarette: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  price_per_pack: z.number().nullable(),
  cigarettes_per_pack: z.number().int().nullable(),
  minutes_per_cigarette: z.number(),
  currency_symbol: z.string(),
  country: z.string().nullable(),
  attempt_number: z.number().int(),
  best_streak_seconds: z.number(),
  journey_mode: journeyModeSchema,
  daily_target: z.number().int().nullable(),
  display_name: z.string().nullable(),
  onboarding_completed: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;

export const profileKeys = {
  all: ['profile'] as const,
  byUser: (userId: string) => ['profile', userId] as const,
};

const profileColumns = `
  id,
  quit_date,
  cigarettes_per_day,
  price_per_cigarette,
  created_at,
  updated_at,
  price_per_pack,
  cigarettes_per_pack,
  minutes_per_cigarette,
  currency_symbol,
  country,
  attempt_number,
  best_streak_seconds,
  journey_mode,
  daily_target,
  display_name,
  onboarding_completed
`;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? profileSchema.parse(data) : null;
}
