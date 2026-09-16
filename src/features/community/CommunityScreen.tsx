import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';
import {
  formatCommunityAge,
  smokeFreeDaysFromQuitDate,
  topicLabels,
  type CommunityReportReason,
  type CommunityTopic,
} from './communityModel';
import {
  blockCommunityUser,
  communityKeys,
  createCommunityPost,
  createCommunityReply,
  deleteCommunityPost,
  deleteCommunityReply,
  getCommunitySnapshot,
  reportCommunityTarget,
  setChallengeCompleted,
  setPostCheer,
  setPostSaved,
  unblockCommunityUser,
  type CommunityPost,
} from './communityService';

type CommunityAction =
  | { type: 'cheer'; postId: string; next: boolean }
  | { type: 'save'; postId: string; next: boolean }
  | { type: 'delete-post'; postId: string }
  | { type: 'reply'; postId: string; body: string }
  | { type: 'delete-reply'; replyId: string }
  | { type: 'block'; userId: string; name: string }
  | { type: 'unblock'; userId: string }
  | { type: 'challenge'; challengeId: string; next: boolean };

type ReportTarget = { postId: string | null; replyId: string | null };

const topics: CommunityTopic[] = ['win', 'craving', 'advice', 'reflection'];
const reportReasons: CommunityReportReason[] = ['harmful', 'harassment', 'privacy', 'spam', 'other'];

export function CommunityScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [postBody, setPostBody] = useState('');
  const [postInputVersion, setPostInputVersion] = useState(0);
  const [topic, setTopic] = useState<CommunityTopic>('reflection');
  const [anonymous, setAnonymous] = useState(false);
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState<CommunityReportReason>('harmful');
  const [reportDetails, setReportDetails] = useState('');

  const userId = user?.id ?? '';
  const smokeFreeDays = useMemo(
    () => smokeFreeDaysFromQuitDate(profile?.quit_date ?? null),
    [profile?.quit_date],
  );

  const snapshotQuery = useQuery({
    queryKey: communityKeys.snapshot(userId, smokeFreeDays),
    queryFn: () => getCommunitySnapshot(userId, smokeFreeDays),
    enabled: Boolean(userId) && profile?.journey_mode === 'quit',
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['community', 'snapshot', userId] });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const circle = snapshotQuery.data?.activeCircle;
      if (!userId || !circle) throw new Error('Your stage circle is not ready yet.');
      await createCommunityPost({
        userId,
        circleId: circle.id,
        body: postBody,
        topic,
        displayName: profile?.display_name ?? null,
        smokeFreeDays,
        anonymous,
      });
    },
    onSuccess: async () => {
      setPostBody('');
      setPostInputVersion((version) => version + 1);
      setAnonymous(false);
      setTopic('reflection');
      await refresh();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: CommunityAction) => {
      if (!userId) throw new Error('Your session is not ready yet.');
      switch (action.type) {
        case 'cheer':
          await setPostCheer(userId, action.postId, action.next);
          return;
        case 'save':
          await setPostSaved(userId, action.postId, action.next);
          return;
        case 'delete-post':
          await deleteCommunityPost(userId, action.postId);
          return;
        case 'reply':
          await createCommunityReply({
            userId,
            postId: action.postId,
            body: action.body,
            displayName: profile?.display_name ?? null,
          });
          return;
        case 'delete-reply':
          await deleteCommunityReply(userId, action.replyId);
          return;
        case 'block':
          await blockCommunityUser({ blockerId: userId, blockedId: action.userId, blockedName: action.name });
          return;
        case 'unblock':
          await unblockCommunityUser(userId, action.userId);
          return;
        case 'challenge':
          await setChallengeCompleted({
            challengeId: action.challengeId,
            userId,
            displayName: profile?.display_name ?? null,
            next: action.next,
          });
      }
    },
    onSuccess: async (_, action) => {
      if (action.type === 'reply') {
        setReplyPostId(null);
        setReplyBody('');
      }
      await refresh();
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !reportTarget) throw new Error('Choose something to report first.');
      await reportCommunityTarget({
        reporterId: userId,
        postId: reportTarget.postId,
        replyId: reportTarget.replyId,
        reason: reportReason,
        details: reportDetails,
      });
    },
    onSuccess: () => {
      setReportTarget(null);
      setReportReason('harmful');
      setReportDetails('');
    },
  });

  if (!user || !profile) {
    return (
      <Screen>
        <View style={styles.centered}><AppText tone="secondary">Preparing Community…</AppText></View>
      </Screen>
    );
  }

  if (profile.journey_mode !== 'quit') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.stack}>
            <AppText variant="caption" tone="secondary">COMMUNITY CIRCLES</AppText>
            <AppText variant="title">Stage circles currently follow smoke-free time.</AppText>
            <AppText tone="secondary">
              Reclaim will not guess a quit stage for Reduce or Track journeys. Community support for those paths will get its own honest grouping later.
            </AppText>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  const snapshot = snapshotQuery.data;
  const error = createMutation.error ?? actionMutation.error ?? reportMutation.error ?? snapshotQuery.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">COMMUNITY</AppText>
          <AppText variant="display">People near your stage.</AppText>
          <AppText tone="secondary">
            Peer support, not comparison. Community stories are personal experiences, not medical advice.
          </AppText>
        </View>

        {snapshotQuery.isLoading ? (
          <Card><AppText tone="secondary">Finding your stage circle…</AppText></Card>
        ) : snapshot?.activeCircle ? (
          <Card style={styles.stageCard}>
            <AppText variant="caption" tone="secondary">YOUR STAGE · DAY {smokeFreeDays}</AppText>
            <AppText variant="title">{snapshot.activeCircle.name}</AppText>
            {snapshot.activeCircle.description ? (
              <AppText tone="secondary">{snapshot.activeCircle.description}</AppText>
            ) : null}
          </Card>
        ) : null}

        {snapshot?.challenge ? (
          <Card style={styles.stack}>
            <AppText variant="caption" tone="secondary">CURRENT COMMUNITY CHALLENGE</AppText>
            <AppText variant="title">{snapshot.challenge.title}</AppText>
            <AppText tone="secondary">{snapshot.challenge.description}</AppText>
            <AppText variant="caption" tone="secondary">
              {snapshot.challenge.completionCount} completed · Badge: {snapshot.challenge.badgeName}
            </AppText>
            <Button
              label={snapshot.challenge.completedByMe ? 'Mark incomplete' : 'I completed this'}
              disabled={actionMutation.isPending}
              onPress={() => actionMutation.mutate({
                type: 'challenge',
                challengeId: snapshot.challenge!.id,
                next: !snapshot.challenge!.completedByMe,
              })}
            />
          </Card>
        ) : null}

        {snapshot?.activeCircle ? (
          <Card style={styles.composer}>
            <AppText variant="caption" tone="secondary">SHARE WITH THIS STAGE</AppText>
            <View style={styles.chips}>
              {topics.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: topic === item }}
                  onPress={() => setTopic(item)}
                  style={[styles.chip, topic === item ? styles.chipActive : null]}
                >
                  <AppText variant="caption">{topicLabels[item]}</AppText>
                </Pressable>
              ))}
            </View>
            <Input
              key={`community-post-${postInputVersion}`}
              label="Your experience"
              defaultValue=""
              onChangeText={setPostBody}
              multiline
              maxLength={1000}
              placeholder="What happened, and what might help someone at the same stage?"
              style={styles.textarea}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: anonymous }}
              onPress={() => setAnonymous((value) => !value)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, anonymous ? styles.checkboxActive : null]} />
              <AppText>Share as Anonymous</AppText>
            </Pressable>
            <AppText variant="caption" tone="secondary">
              Avoid names, phone numbers, addresses, and other private details.
            </AppText>
            <Button
              label={createMutation.isPending ? 'Sharing…' : 'Share story'}
              disabled={createMutation.isPending || postBody.trim().length === 0}
              onPress={() => createMutation.mutate()}
            />
          </Card>
        ) : null}

        <View style={styles.feedHeader}>
          <AppText variant="caption" tone="secondary">STAGE FEED</AppText>
          <AppText variant="title">Stories, support, small wins.</AppText>
        </View>

        {snapshot && snapshot.posts.length === 0 ? (
          <Card><AppText tone="secondary">No visible stories in this stage yet.</AppText></Card>
        ) : null}

        {snapshot?.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            myUserId={userId}
            pending={actionMutation.isPending}
            replyOpen={replyPostId === post.id}
            replyBody={replyPostId === post.id ? replyBody : ''}
            onReplyBodyChange={setReplyBody}
            onToggleReply={() => {
              setReplyPostId((value) => (value === post.id ? null : post.id));
              setReplyBody('');
            }}
            onAction={(action) => actionMutation.mutate(action)}
            onReport={(target) => {
              setReportTarget(target);
              setReportReason('harmful');
              setReportDetails('');
            }}
          />
        ))}

        {reportTarget ? (
          <Card style={styles.stack}>
            <AppText variant="caption" tone="secondary">REPORT TO MODERATION</AppText>
            <AppText variant="title">What is the concern?</AppText>
            <View style={styles.chips}>
              {reportReasons.map((reason) => (
                <Pressable
                  key={reason}
                  accessibilityRole="button"
                  accessibilityState={{ selected: reportReason === reason }}
                  onPress={() => setReportReason(reason)}
                  style={[styles.chip, reportReason === reason ? styles.chipActive : null]}
                >
                  <AppText variant="caption">{reason}</AppText>
                </Pressable>
              ))}
            </View>
            <Input
              label="Optional details"
              defaultValue=""
              onChangeText={setReportDetails}
              maxLength={500}
              multiline
              style={styles.reportInput}
            />
            <Button
              label={reportMutation.isPending ? 'Submitting…' : 'Submit report'}
              disabled={reportMutation.isPending}
              onPress={() => reportMutation.mutate()}
            />
            <Pressable onPress={() => setReportTarget(null)} style={styles.smallAction}>
              <AppText tone="secondary">Cancel</AppText>
            </Pressable>
          </Card>
        ) : null}

        {snapshot && snapshot.blockedUsers.length > 0 ? (
          <Card style={styles.stack}>
            <AppText variant="caption" tone="secondary">BLOCKED COMMUNITY MEMBERS</AppText>
            {snapshot.blockedUsers.map((blocked) => (
              <View key={blocked.userId} style={styles.blockedRow}>
                <AppText>{blocked.name}</AppText>
                <Pressable
                  disabled={actionMutation.isPending}
                  onPress={() => actionMutation.mutate({ type: 'unblock', userId: blocked.userId })}
                >
                  <AppText tone="secondary">Unblock</AppText>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        {error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">{error instanceof Error ? error.message : 'Community could not refresh.'}</AppText>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function PostCard({
  post,
  myUserId,
  pending,
  replyOpen,
  replyBody,
  onReplyBodyChange,
  onToggleReply,
  onAction,
  onReport,
}: {
  post: CommunityPost;
  myUserId: string;
  pending: boolean;
  replyOpen: boolean;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onToggleReply: () => void;
  onAction: (action: CommunityAction) => void;
  onReport: (target: ReportTarget) => void;
}) {
  const mine = post.userId === myUserId;
  return (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderCopy}>
          <AppText variant="title">{post.authorName}</AppText>
          <AppText variant="caption" tone="secondary">
            {topicLabels[post.topic]} · day {post.smokeFreeDays} · {formatCommunityAge(post.createdAt)}
          </AppText>
        </View>
        {post.isFeatured ? <AppText variant="caption">FEATURED</AppText> : null}
      </View>
      <AppText>{post.body}</AppText>

      <View style={styles.actionRow}>
        <MiniAction
          label={`${post.cheeredByMe ? 'Cheered' : 'Cheer'} · ${post.cheerCount}`}
          disabled={pending}
          onPress={() => onAction({ type: 'cheer', postId: post.id, next: !post.cheeredByMe })}
        />
        <MiniAction
          label={post.savedByMe ? 'Saved' : 'Save'}
          disabled={pending}
          onPress={() => onAction({ type: 'save', postId: post.id, next: !post.savedByMe })}
        />
        <MiniAction label={`Reply · ${post.replies.length}`} disabled={pending} onPress={onToggleReply} />
        {mine ? (
          <MiniAction
            label="Delete"
            danger
            disabled={pending}
            onPress={() => onAction({ type: 'delete-post', postId: post.id })}
          />
        ) : (
          <>
            <MiniAction
              label="Report"
              disabled={pending}
              onPress={() => onReport({ postId: post.id, replyId: null })}
            />
            <MiniAction
              label="Block"
              danger
              disabled={pending}
              onPress={() => onAction({ type: 'block', userId: post.userId, name: post.authorName })}
            />
          </>
        )}
      </View>

      {post.replies.length > 0 ? (
        <View style={styles.replies}>
          {post.replies.map((reply) => {
            const replyMine = reply.userId === myUserId;
            return (
              <View key={reply.id} style={styles.replyRow}>
                <View style={styles.replyCopy}>
                  <AppText variant="caption">{reply.authorName} · {formatCommunityAge(reply.createdAt)}</AppText>
                  <AppText tone="secondary">{reply.body}</AppText>
                </View>
                {replyMine ? (
                  <MiniAction
                    label="Delete"
                    danger
                    disabled={pending}
                    onPress={() => onAction({ type: 'delete-reply', replyId: reply.id })}
                  />
                ) : (
                  <MiniAction
                    label="Report"
                    disabled={pending}
                    onPress={() => onReport({ postId: null, replyId: reply.id })}
                  />
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {replyOpen ? (
        <View style={styles.replyComposer}>
          <Input
            label="Reply"
            defaultValue=""
            onChangeText={onReplyBodyChange}
            maxLength={500}
            multiline
            placeholder="Keep it supportive and specific."
            style={styles.replyInput}
          />
          <Button
            label="Post reply"
            disabled={pending || replyBody.trim().length === 0}
            onPress={() => onAction({ type: 'reply', postId: post.id, body: replyBody })}
          />
        </View>
      ) : null}
    </Card>
  );
}

function MiniAction({
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={styles.smallAction}>
      <AppText variant="caption" tone={danger ? 'danger' : 'secondary'}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: spacing.sm },
  stack: { gap: spacing.md },
  stageCard: { gap: spacing.sm },
  composer: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { borderColor: colors.textPrimary },
  textarea: { minHeight: 112, textAlignVertical: 'top' },
  reportInput: { minHeight: 80, textAlignVertical: 'top' },
  replyInput: { minHeight: 72, textAlignVertical: 'top' },
  checkboxRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.textPrimary },
  feedHeader: { gap: spacing.xs },
  postCard: { gap: spacing.md },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  postHeaderCopy: { flex: 1, gap: spacing.xs },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  smallAction: { minHeight: 44, justifyContent: 'center', paddingRight: spacing.sm },
  replies: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  replyCopy: { flex: 1, gap: spacing.xs },
  replyComposer: { gap: spacing.sm },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorCard: { borderColor: colors.danger },
});
