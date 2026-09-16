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
