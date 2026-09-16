import { z } from 'zod';

export const communityTopicSchema = z.enum(['win', 'craving', 'advice', 'reflection']);
export type CommunityTopic = z.infer<typeof communityTopicSchema>;

export const communityReportReasonSchema = z.enum([
  'harmful',
  'harassment',
  'privacy',
  'spam',
  'other',
]);
export type CommunityReportReason = z.infer<typeof communityReportReasonSchema>;

export type CommunityCircle = {
  id: string;
  name: string;
  minSmokeFreeDays: number;
  maxSmokeFreeDays: number | null;
  description: string | null;
};

export const postBodySchema = z.string().trim().min(1, 'Write something first.').max(1000);
export const replyBodySchema = z.string().trim().min(1, 'Write a reply first.').max(500);
export const reportDetailsSchema = z.string().trim().max(500).optional();

export const topicLabels: Record<CommunityTopic, string> = {
  win: 'Small win',
  craving: 'Craving support',
  advice: 'What helped',
  reflection: 'Reflection',
};

export function smokeFreeDaysFromQuitDate(quitDate: string | null, now = new Date()): number {
  if (!quitDate) return 0;
  const started = new Date(quitDate).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((now.getTime() - started) / 86_400_000));
}

export function selectCommunityCircle(
  circles: readonly CommunityCircle[],
  smokeFreeDays: number,
): CommunityCircle | null {
  const days = Math.max(0, Math.floor(smokeFreeDays));
  return (
    [...circles]
      .sort((a, b) => a.minSmokeFreeDays - b.minSmokeFreeDays)
      .find(
        (circle) =>
          days >= circle.minSmokeFreeDays &&
          (circle.maxSmokeFreeDays === null || days <= circle.maxSmokeFreeDays),
      ) ?? null
  );
}

export function safeCommunityName(displayName: string | null | undefined, anonymous = false): string {
  if (anonymous) return 'Anonymous';
  const trimmed = displayName?.trim().slice(0, 80);
  return trimmed || 'Community member';
}

export function formatCommunityAge(value: string, now = new Date()): string {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return '';
  const seconds = Math.max(0, Math.floor((now.getTime() - created) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}
