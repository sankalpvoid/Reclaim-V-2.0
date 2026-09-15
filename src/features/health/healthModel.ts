import { z } from 'zod';

export const healthMilestoneSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  minutes_after_quitting: z.number().int().nonnegative(),
  source_name: z.string().nullable(),
  source_url: z.string().nullable(),
});

export type HealthMilestone = z.infer<typeof healthMilestoneSchema>;

export type HealthMilestoneProgress = HealthMilestone & {
  reached: boolean;
};

export type HealthRecovery = {
  elapsedMinutes: number;
  milestones: HealthMilestoneProgress[];
  reachedCount: number;
  nextMilestone: HealthMilestone | null;
  intervalProgress: number;
};

export function buildHealthRecovery(
  quitDate: string,
  milestones: readonly HealthMilestone[],
  now: Date = new Date(),
): HealthRecovery {
  const quitAt = new Date(quitDate).getTime();
  const nowAt = now.getTime();
  const elapsedMinutes = Number.isFinite(quitAt)
    ? Math.max(0, (nowAt - quitAt) / 60_000)
    : 0;

  const sorted = [...milestones].sort(
    (a, b) => a.minutes_after_quitting - b.minutes_after_quitting,
  );
  const progressMilestones = sorted.map((milestone) => ({
    ...milestone,
    reached: elapsedMinutes >= milestone.minutes_after_quitting,
  }));
  const reachedCount = progressMilestones.filter((milestone) => milestone.reached).length;
  const nextMilestone = sorted.find(
    (milestone) => elapsedMinutes < milestone.minutes_after_quitting,
  ) ?? null;

  if (!nextMilestone) {
    return {
      elapsedMinutes,
      milestones: progressMilestones,
      reachedCount,
      nextMilestone: null,
      intervalProgress: sorted.length ? 1 : 0,
    };
  }

  const nextIndex = sorted.findIndex((milestone) => milestone.id === nextMilestone.id);
  const previousMinutes = nextIndex > 0 ? sorted[nextIndex - 1]!.minutes_after_quitting : 0;
  const interval = Math.max(1, nextMilestone.minutes_after_quitting - previousMinutes);
  const intervalProgress = Math.min(
    1,
    Math.max(0, (elapsedMinutes - previousMinutes) / interval),
  );

  return {
    elapsedMinutes,
    milestones: progressMilestones,
    reachedCount,
    nextMilestone,
    intervalProgress,
  };
}

export function formatRecoveryElapsed(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = Math.floor(safeMinutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}
