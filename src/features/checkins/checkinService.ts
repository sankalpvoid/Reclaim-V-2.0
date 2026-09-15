import { supabase } from '@/core/supabase/client';
import {
  dailyCheckinClientId,
  moodSchema,
  type Checkin,
  type Mood,
} from '@/features/checkins/checkinModel';

export const ONBOARDING_CHECKIN_CLIENT_ID = '00000000-0000-4000-8000-000000000002';

function mapCheckin(row: {
  id: string;
  client_id: string;
  mood: string;
  note: string | null;
  created_at: string;
}): Checkin {
  return {
    id: row.id,
    clientId: row.client_id,
    mood: moodSchema.parse(row.mood),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function getCheckins(userId: string, limit = 90): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('id, client_id, mood, note, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapCheckin);
}

export async function saveCheckin(input: {
  userId: string;
  mood: Mood;
  note?: string | null;
  clientId: string;
}): Promise<Checkin> {
  const mood = moodSchema.parse(input.mood);
  const note = input.note?.trim() ? input.note.trim().slice(0, 500) : null;

  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert(
      {
        user_id: input.userId,
        client_id: input.clientId,
        mood,
        note,
      },
      { onConflict: 'user_id,client_id' },
    )
    .select('id, client_id, mood, note, created_at')
    .single();

  if (error) throw error;
  return mapCheckin(data);
}

export function saveDailyCheckin(input: {
  userId: string;
  mood: Mood;
  note?: string | null;
  date?: Date;
}) {
  return saveCheckin({
    userId: input.userId,
    mood: input.mood,
    ...(input.note !== undefined ? { note: input.note } : {}),
    clientId: dailyCheckinClientId(input.date ?? new Date()),
  });
}
