import { supabase } from '@/core/supabase/client';
import { profileSchema, type Profile } from '@/features/profile/profile';

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

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profileSchema.parse(data);
}
