import { describe, expect, it } from 'vitest';

import {
  articlesForJourney,
  attachLearningProgress,
  buildLearningFocus,
  rankLearningArticles,
  type LearningArticle,
} from './learningModel';

const base: LearningArticle = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'one',
  title: 'One',
  summary: 'Summary',
  body: 'Body',
  category: 'cravings',
  estimatedMinutes: 3,
  journeyModes: ['quit', 'reduce', 'track'],
  sourceName: null,
  sourceUrl: null,
  sortOrder: 20,
};

describe('learning content model', () => {
  it('filters by journey and preserves sort order', () => {
    const quitOnly: LearningArticle = {
      ...base,
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'quit-only',
      title: 'Quit only',
      journeyModes: ['quit'],
      sortOrder: 10,
    };

    expect(articlesForJourney([base, quitOnly], 'quit').map((item) => item.slug)).toEqual([
      'quit-only',
      'one',
    ]);
    expect(articlesForJourney([base, quitOnly], 'track').map((item) => item.slug)).toEqual(['one']);
  });

  it('treats absent progress as unsaved and incomplete', () => {
    expect(attachLearningProgress([base], [])[0]).toMatchObject({ saved: false, completed: false });
  });

  it('prioritizes craving learning when recent signals show repeated difficulty', () => {
    const focus = buildLearningFocus(
      'quit',
      [
        { event_type: 'craving', smoked_at: '2026-09-14T12:00:00Z' },
        { event_type: 'craving', smoked_at: '2026-09-15T12:00:00Z' },
      ],
      [],
      new Date('2026-09-16T12:00:00Z'),
    );
    expect(focus.category).toBe('cravings');
  });

  it('uses journey context when no stronger recent support signal exists', () => {
    expect(
      buildLearningFocus('reduce', [], [], new Date('2026-09-16T12:00:00Z')).category,
    ).toBe('tracking');
  });

  it('keeps saved unread articles ahead of personalized ordering', () => {
    const progressArticle: LearningArticle = {
      ...base,
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'progress',
      title: 'Progress',
      category: 'progress',
      sortOrder: 5,
    };
    const states = attachLearningProgress([base, progressArticle], [
      { articleId: progressArticle.id, saved: true, completedAt: null },
    ]);
    expect(rankLearningArticles(states, 'cravings')[0]?.id).toBe(progressArticle.id);
  });

  it('keeps save and completion as separate states', () => {
    expect(
      attachLearningProgress([base], [
        { articleId: base.id, saved: false, completedAt: '2026-09-16T06:30:00.000Z' },
      ])[0],
    ).toMatchObject({ saved: false, completed: true });
  });
});
