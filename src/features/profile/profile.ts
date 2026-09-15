import { z } from 'zod';

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
