import { z } from 'zod';

export const learningCategorySchema = z.enum(['cravings', 'tracking', 'checkins', 'community', 'progress']);
export type LearningCategory = z.infer<typeof learningCategorySchema>;

export const journeyModeSchema = z.enum(['quit', 'reduce', 'track']);
export type LearningJourneyMode = z.infer<typeof journeyModeSchema>;

export const learningArticleSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  category: learningCategorySchema,
  estimatedMinutes: z.number().int().min(1).max(30),
  journeyModes: z.array(journeyModeSchema).min(1),
  sourceName: z.string().nullable(),
  sourceUrl: z.string().url().nullable(),
  sortOrder: z.number().int(),
});
export type LearningArticle = z.infer<typeof learningArticleSchema>;

export const learningProgressSchema = z.object({
  articleId: z.string().uuid(),
  saved: z.boolean(),
  completedAt: z.string().datetime({ offset: true }).nullable(),
});
export type LearningProgress = z.infer<typeof learningProgressSchema>;

export type LearningArticleState = LearningArticle & {
  saved: boolean;
  completed: boolean;
};

export function articlesForJourney(
  articles: LearningArticle[],
  journeyMode: LearningJourneyMode,
): LearningArticle[] {
  return articles
    .filter((article) => article.journeyModes.includes(journeyMode))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function attachLearningProgress(
  articles: LearningArticle[],
  progress: LearningProgress[],
): LearningArticleState[] {
  const byArticleId = new Map(progress.map((item) => [item.articleId, item]));
  return articles.map((article) => {
    const item = byArticleId.get(article.id);
    return {
      ...article,
      saved: item?.saved ?? false,
      completed: Boolean(item?.completedAt),
    };
  });
}

export const learningCategoryLabels: Record<LearningCategory, string> = {
  cravings: 'Cravings',
  tracking: 'Tracking',
  checkins: 'Check-ins',
  community: 'Community',
  progress: 'Progress',
};


export type LearningSignalEvent = {
  event_type: string;
  smoked_at: string;
};

export type LearningSignalCheckin = {
  mood: string;
  created_at: string;
};

export type LearningFocus = {
  category: LearningCategory;
  reason: string;
};

function withinRecentDays(value: string, now: Date, days: number): boolean {
  const time = new Date(value).getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(time) || !Number.isFinite(nowTime)) return false;
  const elapsed = nowTime - time;
  return elapsed >= 0 && elapsed <= days * 86_400_000;
}

export function buildLearningFocus(
  journeyMode: LearningJourneyMode,
  events: readonly LearningSignalEvent[],
  checkins: readonly LearningSignalCheckin[],
  now: Date = new Date(),
): LearningFocus {
  const recentCravings = events.filter(
    (event) => event.event_type === 'craving' && withinRecentDays(event.smoked_at, now, 7),
  ).length;
  const recentCheckins = checkins.filter((checkin) => withinRecentDays(checkin.created_at, now, 7));
  const hardCheckins = recentCheckins.filter((checkin) =>
    checkin.mood === 'struggling' || checkin.mood === 'craving',
  ).length;

  if (recentCravings >= 2 || hardCheckins >= 2) {
    return {
      category: 'cravings',
      reason:
        recentCravings >= 2
          ? `You logged ${recentCravings} cravings in the last seven days, so craving skills are surfaced first.`
          : `${hardCheckins} recent check-ins reflected struggle or cravings, so support-focused reading is surfaced first.`,
    };
  }

  if (journeyMode === 'reduce' || journeyMode === 'track') {
    return {
      category: 'tracking',
      reason:
        journeyMode === 'reduce'
          ? 'Tracking and reduction context comes first for your current Smoke Less journey.'
          : 'Tracking context comes first while you are learning your smoking pattern.',
    };
  }

  if (recentCheckins.length === 0) {
    return {
      category: 'checkins',
      reason: 'There is no recent mood check-in, so Reclaim is surfacing context on how check-ins support later insights.',
    };
  }

  return {
    category: 'progress',
    reason: 'Progress context comes first for your current quit journey when no stronger recent support signal stands out.',
  };
}

function learningRank(article: LearningArticleState, focus: LearningCategory | null): number {
  if (article.saved && !article.completed) return 0;
  if (!article.completed && article.category === focus) return 1;
  if (!article.completed) return 2;
  return 3;
}

export function rankLearningArticles(
  articles: readonly LearningArticleState[],
  focus: LearningCategory | null,
): LearningArticleState[] {
  return [...articles].sort((a, b) => {
    const rankDifference = learningRank(a, focus) - learningRank(b, focus);
    if (rankDifference !== 0) return rankDifference;
    return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  });
}
