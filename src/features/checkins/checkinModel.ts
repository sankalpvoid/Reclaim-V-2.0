import { z } from 'zod';

export const moodSchema = z.enum(['great', 'okay', 'struggling', 'craving']);
export type Mood = z.infer<typeof moodSchema>;

export const moodOptions: ReadonlyArray<{
  key: Mood;
  label: string;
  summary: string;
}> = [
  { key: 'great', label: 'I’m feeling great', summary: 'Things feel steady today.' },
  { key: 'okay', label: 'I’m okay', summary: 'Getting through the day.' },
  { key: 'struggling', label: 'I’m struggling', summary: 'Today feels harder than usual.' },
  { key: 'craving', label: 'I’m having strong cravings', summary: 'I could use support right now.' },
];

export type Checkin = {
  id: string;
  clientId: string;
  mood: Mood;
  note: string | null;
  createdAt: string;
};

export type MoodHistoryDay = {
  day: string;
  mood: Mood | null;
  note: string | null;
};

export function localDateKey(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dailyCheckinClientId(value: Date = new Date()): string {
  const compactDate = localDateKey(value).replaceAll('-', '');
  return `00000000-0000-4000-8000-${compactDate}0000`;
}

export function latestCheckinByLocalDay(checkins: readonly Checkin[]): Map<string, Checkin> {
  const byDay = new Map<string, Checkin>();
  const sorted = [...checkins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const checkin of sorted) {
    const key = localDateKey(new Date(checkin.createdAt));
    if (!byDay.has(key)) byDay.set(key, checkin);
  }

  return byDay;
}

export function buildMoodHistory(
  checkins: readonly Checkin[],
  days: number,
  now: Date = new Date(),
) {
  const safeDays = Math.max(1, Math.floor(days));
  const byDay = latestCheckinByLocalDay(checkins);
  const series: MoodHistoryDay[] = [];
  const counts: Record<Mood, number> = { great: 0, okay: 0, struggling: 0, craving: 0 };

  for (let index = safeDays - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const day = localDateKey(date);
    const checkin = byDay.get(day);
    const mood = checkin?.mood ?? null;
    if (mood) counts[mood] += 1;
    series.push({ day, mood, note: checkin?.note ?? null });
  }

  const loggedDays = series.filter((day) => day.mood !== null).length;
  const mostCommonMood = (Object.entries(counts) as Array<[Mood, number]>)
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count > 0)?.[0] ?? null;

  return {
    days: series,
    counts,
    loggedDays,
    mostCommonMood,
  };
}
