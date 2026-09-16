import { supabase } from '@/core/supabase/client';
import {
  learningArticleSchema,
  learningProgressSchema,
  type LearningArticle,
  type LearningProgress,
} from './learningModel';

export const learningKeys = {
  articles: ['learning', 'articles'] as const,
  progress: (userId: string) => ['learning', 'progress', userId] as const,
};

export async function getLearningArticles(): Promise<LearningArticle[]> {
  const { data, error } = await supabase
    .from('learning_articles')
    .select('id, slug, title, summary, body, category, estimated_minutes, journey_modes, source_name, source_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    learningArticleSchema.parse({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      category: row.category,
      estimatedMinutes: row.estimated_minutes,
      journeyModes: row.journey_modes,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      sortOrder: row.sort_order,
    }),
  );
}

export async function getLearningProgress(userId: string): Promise<LearningProgress[]> {
  const { data, error } = await supabase
    .from('user_learning_progress')
    .select('article_id, saved, completed_at')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) =>
    learningProgressSchema.parse({
      articleId: row.article_id,
      saved: row.saved,
      completedAt: row.completed_at,
    }),
  );
}

async function readProgressRow(userId: string, articleId: string) {
  const { data, error } = await supabase
    .from('user_learning_progress')
    .select('saved, completed_at')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setLearningSaved(userId: string, articleId: string, saved: boolean) {
  const current = await readProgressRow(userId, articleId);
  const { error } = await supabase.from('user_learning_progress').upsert(
    {
      user_id: userId,
      article_id: articleId,
      saved,
      completed_at: current?.completed_at ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,article_id' },
  );
  if (error) throw error;
}

export async function setLearningCompleted(userId: string, articleId: string, completed: boolean) {
  const current = await readProgressRow(userId, articleId);
  const { error } = await supabase.from('user_learning_progress').upsert(
    {
      user_id: userId,
      article_id: articleId,
      saved: current?.saved ?? false,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,article_id' },
  );
  if (error) throw error;
}
