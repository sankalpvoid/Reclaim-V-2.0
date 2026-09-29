import { z } from 'zod';

import { supabase } from '@/core/supabase/client';
import {
  communityReportReasonSchema,
  communityTopicSchema,
  postBodySchema,
  replyBodySchema,
  safeCommunityName,
  selectCommunityCircle,
  type CommunityCircle,
  type CommunityReportReason,
  type CommunityTopic,
} from './communityModel';

// PostgreSQL's uuid type accepts the seeded stage-circle IDs used by Reclaim,
// including values whose version/variant bits do not satisfy Zod's strict
// RFC UUID validator. Keep structural UUID validation without rejecting valid
// database identifiers such as 00000000-0000-0000-0000-000000000010.
const databaseUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Invalid database UUID',
);

const circleRowSchema = z.object({
  id: databaseUuidSchema,
  name: z.string(),
  min_smoke_free_days: z.number().int(),
  max_smoke_free_days: z.number().int().nullable(),
  description: z.string().nullable(),
});

const postRowSchema = z.object({
  id: databaseUuidSchema,
  circle_id: databaseUuidSchema,
  user_id: databaseUuidSchema,
  body: z.string(),
  topic: communityTopicSchema,
  author_name: z.string(),
  smoke_free_days: z.number().int(),
  is_featured: z.boolean(),
  created_at: z.string(),
});

const replyRowSchema = z.object({
  id: databaseUuidSchema,
  post_id: databaseUuidSchema,
  user_id: databaseUuidSchema,
  body: z.string(),
  author_name: z.string(),
  created_at: z.string(),
});

const cheerRowSchema = z.object({
  post_id: databaseUuidSchema,
  user_id: databaseUuidSchema,
});

const savedRowSchema = z.object({
  post_id: databaseUuidSchema,
});

const blockRowSchema = z.object({
  blocked_id: databaseUuidSchema,
  blocked_name: z.string(),
});

const challengeRowSchema = z.object({
  id: databaseUuidSchema,
  week_start: z.string(),
  title: z.string(),
  description: z.string(),
  badge_name: z.string(),
  target_count: z.number().int(),
});

const completionRowSchema = z.object({
  challenge_id: databaseUuidSchema,
  user_id: databaseUuidSchema,
});

export type CommunityReply = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  circleId: string;
  userId: string;
  body: string;
  topic: CommunityTopic;
  authorName: string;
  smokeFreeDays: number;
  isFeatured: boolean;
  createdAt: string;
  cheerCount: number;
  cheeredByMe: boolean;
  savedByMe: boolean;
  replies: CommunityReply[];
};

export type CommunityChallenge = {
  id: string;
  weekStart: string;
  title: string;
  description: string;
  badgeName: string;
  targetCount: number;
  completionCount: number;
  completedByMe: boolean;
};

export type CommunitySnapshot = {
  circles: CommunityCircle[];
  activeCircle: CommunityCircle | null;
  posts: CommunityPost[];
  blockedUsers: { userId: string; name: string }[];
  challenge: CommunityChallenge | null;
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const communityKeys = {
  snapshot: (userId: string, smokeFreeDays: number) =>
    ['community', 'snapshot', userId, smokeFreeDays] as const,
};

export async function getCommunitySnapshot(
  userId: string,
  smokeFreeDays: number,
): Promise<CommunitySnapshot> {
  const { data: circleData, error: circleError } = await supabase
    .from('circles')
    .select('id, name, min_smoke_free_days, max_smoke_free_days, description')
    .order('min_smoke_free_days', { ascending: true });
  if (circleError) throw circleError;

  const circles = z.array(circleRowSchema).parse(circleData ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    minSmokeFreeDays: row.min_smoke_free_days,
    maxSmokeFreeDays: row.max_smoke_free_days,
    description: row.description,
  }));
  const activeCircle = selectCommunityCircle(circles, smokeFreeDays);

  const { data: blockedData, error: blockedError } = await supabase
    .from('user_blocks')
    .select('blocked_id, blocked_name')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });
  if (blockedError) throw blockedError;
  const blockedUsers = z.array(blockRowSchema).parse(blockedData ?? []).map((row) => ({
    userId: row.blocked_id,
    name: row.blocked_name,
  }));

  const challengePromise = getCurrentChallenge(userId);
  if (!activeCircle) {
    return { circles, activeCircle: null, posts: [], blockedUsers, challenge: await challengePromise };
  }

  const { data: postData, error: postError } = await supabase
    .from('circle_posts')
    .select('id, circle_id, user_id, body, topic, author_name, smoke_free_days, is_featured, created_at')
    .eq('circle_id', activeCircle.id)
    .eq('moderation_status', 'visible')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (postError) throw postError;
  const postRows = z.array(postRowSchema).parse(postData ?? []);
  const postIds = postRows.map((row) => row.id);

  if (postIds.length === 0) {
    return { circles, activeCircle, posts: [], blockedUsers, challenge: await challengePromise };
  }

  const [cheerResult, replyResult, savedResult, challenge] = await Promise.all([
    supabase.from('post_cheers').select('post_id, user_id').in('post_id', postIds),
    supabase
      .from('post_replies')
      .select('id, post_id, user_id, body, author_name, created_at')
      .in('post_id', postIds)
      .eq('moderation_status', 'visible')
      .order('created_at', { ascending: true }),
    supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds),
    challengePromise,
  ]);

  if (cheerResult.error) throw cheerResult.error;
  if (replyResult.error) throw replyResult.error;
  if (savedResult.error) throw savedResult.error;

  const cheers = z.array(cheerRowSchema).parse(cheerResult.data ?? []);
  const replies = z.array(replyRowSchema).parse(replyResult.data ?? []);
  const saved = new Set(z.array(savedRowSchema).parse(savedResult.data ?? []).map((row) => row.post_id));

  const posts = postRows.map((row): CommunityPost => {
    const postCheers = cheers.filter((cheer) => cheer.post_id === row.id);
    return {
      id: row.id,
      circleId: row.circle_id,
      userId: row.user_id,
      body: row.body,
      topic: row.topic,
      authorName: row.author_name,
      smokeFreeDays: row.smoke_free_days,
      isFeatured: row.is_featured,
      createdAt: row.created_at,
      cheerCount: postCheers.length,
      cheeredByMe: postCheers.some((cheer) => cheer.user_id === userId),
      savedByMe: saved.has(row.id),
      replies: replies
        .filter((reply) => reply.post_id === row.id)
        .map((reply) => ({
          id: reply.id,
          postId: reply.post_id,
          userId: reply.user_id,
          body: reply.body,
          authorName: reply.author_name,
          createdAt: reply.created_at,
        })),
    };
  });

  return { circles, activeCircle, posts, blockedUsers, challenge };
}

async function getCurrentChallenge(userId: string): Promise<CommunityChallenge | null> {
  const { data, error } = await supabase
    .from('community_challenges')
    .select('id, week_start, title, description, badge_name, target_count')
    .lte('week_start', localDateKey())
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const challenge = challengeRowSchema.parse(data);
  const { data: completionData, error: completionError } = await supabase
    .from('challenge_completions')
    .select('challenge_id, user_id')
    .eq('challenge_id', challenge.id);
  if (completionError) throw completionError;
  const completions = z.array(completionRowSchema).parse(completionData ?? []);

  return {
    id: challenge.id,
    weekStart: challenge.week_start,
    title: challenge.title,
    description: challenge.description,
    badgeName: challenge.badge_name,
    targetCount: challenge.target_count,
    completionCount: completions.length,
    completedByMe: completions.some((row) => row.user_id === userId),
  };
}

export async function createCommunityPost(input: {
  userId: string;
  circleId: string;
  body: string;
  topic: CommunityTopic;
  displayName: string | null;
  smokeFreeDays: number;
  anonymous: boolean;
}): Promise<void> {
  const body = postBodySchema.parse(input.body);
  const topic = communityTopicSchema.parse(input.topic);
  const { error } = await supabase.from('circle_posts').insert({
    circle_id: input.circleId,
    user_id: input.userId,
    body,
    topic,
    author_name: safeCommunityName(input.displayName, input.anonymous),
    smoke_free_days: Math.max(0, Math.floor(input.smokeFreeDays)),
  });
  if (error) throw error;
}

export async function deleteCommunityPost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase.from('circle_posts').delete().eq('id', postId).eq('user_id', userId);
  if (error) throw error;
}

export async function setPostCheer(userId: string, postId: string, next: boolean): Promise<void> {
  if (next) {
    const { error } = await supabase.from('post_cheers').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('post_cheers')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setPostSaved(userId: string, postId: string, next: boolean): Promise<void> {
  if (next) {
    const { error } = await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

export async function createCommunityReply(input: {
  userId: string;
  postId: string;
  body: string;
  displayName: string | null;
}): Promise<void> {
  const body = replyBodySchema.parse(input.body);
  const { error } = await supabase.from('post_replies').insert({
    user_id: input.userId,
    post_id: input.postId,
    body,
    author_name: safeCommunityName(input.displayName),
  });
  if (error) throw error;
}

export async function deleteCommunityReply(userId: string, replyId: string): Promise<void> {
  const { error } = await supabase.from('post_replies').delete().eq('id', replyId).eq('user_id', userId);
  if (error) throw error;
}

export async function reportCommunityTarget(input: {
  reporterId: string;
  postId: string | null;
  replyId: string | null;
  reason: CommunityReportReason;
  details: string;
}): Promise<void> {
  const reason = communityReportReasonSchema.parse(input.reason);
  const details = input.details.trim().slice(0, 500);
  const { error } = await supabase.from('community_reports').insert({
    reporter_id: input.reporterId,
    post_id: input.postId,
    reply_id: input.replyId,
    reason,
    details: details || null,
  });
  if (error) throw error;
}

export async function blockCommunityUser(input: {
  blockerId: string;
  blockedId: string;
  blockedName: string;
}): Promise<void> {
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: input.blockerId,
    blocked_id: input.blockedId,
    blocked_name: safeCommunityName(input.blockedName),
  });
  if (error) throw error;
}

export async function unblockCommunityUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function setChallengeCompleted(input: {
  challengeId: string;
  userId: string;
  displayName: string | null;
  next: boolean;
}): Promise<void> {
  if (input.next) {
    const { error } = await supabase.from('challenge_completions').insert({
      challenge_id: input.challengeId,
      user_id: input.userId,
      display_name: safeCommunityName(input.displayName),
    });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('challenge_completions')
    .delete()
    .eq('challenge_id', input.challengeId)
    .eq('user_id', input.userId);
  if (error) throw error;
}
