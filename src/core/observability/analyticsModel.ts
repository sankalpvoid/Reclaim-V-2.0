import { z } from 'zod';

export const analyticsJourneyModeSchema = z.enum(['quit', 'reduce', 'track']);
export type AnalyticsJourneyMode = z.infer<typeof analyticsJourneyModeSchema>;

export const analyticsScreenSchema = z.enum([
  'today',
  'insights',
  'community',
  'learning',
  'more',
  'check-in',
  'craving',
  'goals',
  'health',
  'journey',
  'notifications',
]);
export type AnalyticsScreen = z.infer<typeof analyticsScreenSchema>;

export const clientErrorOperationSchema = z.enum([
  'auth_bootstrap',
  'profile_load',
  'notification_response',
]);
export type ClientErrorOperation = z.infer<typeof clientErrorOperationSchema>;

const screenByLeaf: Record<string, AnalyticsScreen> = {
  insights: 'insights',
  community: 'community',
  learning: 'learning',
  more: 'more',
  'check-in': 'check-in',
  craving: 'craving',
  goals: 'goals',
  health: 'health',
  journey: 'journey',
  notifications: 'notifications',
};

export function analyticsScreenFromPath(pathname: string): AnalyticsScreen | null {
  const cleanPath = pathname.split('?')[0]?.replace(/\/+$/, '') || '/';
  if (cleanPath === '/') return 'today';

  const leaf = cleanPath.split('/').filter(Boolean).at(-1);
  if (!leaf) return 'today';
  return screenByLeaf[leaf] ?? null;
}

export function analyticsPlatform(value: string): 'ios' | 'android' | 'web' | 'unknown' {
  if (value === 'ios' || value === 'android' || value === 'web') return value;
  return 'unknown';
}
