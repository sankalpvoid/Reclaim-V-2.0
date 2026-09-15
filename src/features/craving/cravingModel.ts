export type CravingToolKey = 'breathe' | 'timer' | 'water' | 'walk';
export type CravingFeedback = 'yes' | 'a_little' | 'not_really';

export type CravingHistoryItem = {
  toolkit: CravingToolKey | null;
  tool_feedback: CravingFeedback | null;
};

export const cravingTools: Array<{
  key: CravingToolKey;
  name: string;
  durationLabel: string;
  summary: string;
}> = [
  {
    key: 'breathe',
    name: 'Box breathing',
    durationLabel: '4 min',
    summary: 'Follow a paced inhale, hold, exhale and hold cycle.',
  },
  {
    key: 'timer',
    name: 'Ride the wave',
    durationLabel: '5 min',
    summary: 'Notice the urge without obeying it and let it change over time.',
  },
  {
    key: 'water',
    name: 'Water reset',
    durationLabel: '1 min',
    summary: 'Drink water slowly and change your immediate environment.',
  },
  {
    key: 'walk',
    name: 'Take a short walk',
    durationLabel: '5 min',
    summary: 'Move your body and interrupt the cue-response loop.',
  },
];

const feedbackScores: Record<CravingFeedback, number> = {
  yes: 2,
  a_little: 1,
  not_really: 0,
};

export function recommendCravingTool(
  history: readonly CravingHistoryItem[],
): CravingToolKey | null {
  const rated = history.filter(
    (item): item is CravingHistoryItem & { toolkit: CravingToolKey; tool_feedback: CravingFeedback } =>
      item.toolkit !== null && item.tool_feedback !== null,
  );

  if (rated.length < 3) return null;

  const aggregate = new Map<CravingToolKey, { count: number; score: number }>();
  for (const item of rated) {
    const current = aggregate.get(item.toolkit) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += feedbackScores[item.tool_feedback];
    aggregate.set(item.toolkit, current);
  }

  const ranked = [...aggregate.entries()]
    .filter(([, value]) => value.count >= 2 && value.score > 0)
    .sort(([, a], [, b]) => b.score / b.count - a.score / a.count || b.count - a.count);

  return ranked[0]?.[0] ?? null;
}

export function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
