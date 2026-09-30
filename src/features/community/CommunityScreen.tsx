import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
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
  const postBodyRef = useRef('');
  const [postHasText, setPostHasText] = useState(false);
  const [postInputVersion, setPostInputVersion] = useState(0);
  const [topic, setTopic] = useState<CommunityTopic>('reflection');
  const [anonymous, setAnonymous] = useState(false);
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const replyBodyRef = useRef('');
  const [replyHasText, setReplyHasText] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState<CommunityReportReason>('harmful');
  const reportDetailsRef = useRef('');

  const userId = user?.id ?? '';
  const smokeFreeDays = useMemo(
    () => smokeFreeDaysFromQuitDate(profile?.quit_date ?? null),
    [profile?.quit_date],
  );

  const journeyMode = profile?.journey_mode ?? 'quit';
  const snapshotQuery = useQuery({
    queryKey: communityKeys.snapshot(userId, journeyMode, smokeFreeDays),
    queryFn: () => getCommunitySnapshot(userId, journeyMode, smokeFreeDays),
    enabled: Boolean(userId) && Boolean(profile),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['community', 'snapshot', userId] });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const circle = snapshotQuery.data?.activeCircle;
      if (!userId || !circle) throw new Error('Your community circle is not ready yet.');
      await createCommunityPost({
        userId,
        circleId: circle.id,
        body: postBodyRef.current,
        topic,
        displayName: profile?.display_name ?? null,
        smokeFreeDays: profile?.journey_mode === 'quit' ? smokeFreeDays : 0,
        anonymous,
      });
    },
    onSuccess: async () => {
      postBodyRef.current = '';
      setPostHasText(false);
      setPostInputVersion((version) => version + 1);
      setAnonymous(false);
      setTopic('reflection');
      void trackAnalyticsEvent({
        eventName: 'community_story_shared',
        userId,
        journeyMode: profile?.journey_mode ?? null,
      });
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
        replyBodyRef.current = '';
        setReplyHasText(false);
        void trackAnalyticsEvent({
          eventName: 'community_reply_shared',
          userId,
          journeyMode: profile?.journey_mode ?? null,
        });
      }

      if (
        (action.type === 'cheer' || action.type === 'save' || action.type === 'challenge') &&
        action.next
      ) {
        void trackAnalyticsEvent({
          eventName: 'community_engaged',
          engagement: action.type,
          userId,
          journeyMode: profile?.journey_mode ?? null,
        });
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
        details: reportDetailsRef.current,
      });
    },
    onSuccess: () => {
      setReportTarget(null);
      setReportReason('harmful');
      reportDetailsRef.current = '';
    },
  });

  if (!user || !profile) {
    return (
      <Screen>
        <View style={styles.centered}><AppText tone="secondary">Preparing Community…</AppText></View>
      </Screen>
    );
  }

  const snapshot = snapshotQuery.data;
  const error = createMutation.error ?? actionMutation.error ?? reportMutation.error ?? snapshotQuery.error;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText variant="micro" tone="accent">COMMUNITY</AppText>
          <AppText variant="display">
            {profile.journey_mode === 'quit' ? 'People near your stage.' : 'People on your path.'}
          </AppText>
          <AppText tone="secondary">
            Peer support, not comparison. Community stories are personal experiences, not medical advice.
          </AppText>
        </View>

        {snapshotQuery.isLoading ? (
          <Card tone="flat"><AppText tone="secondary">Finding your community circle…</AppText></Card>
        ) : snapshot?.activeCircle ? (
          <Card tone="accent" style={styles.stageCard}>
            <AppText variant="micro" tone="accent">
              {profile.journey_mode === 'quit'
                ? `YOUR STAGE · DAY ${smokeFreeDays}`
                : 'YOUR JOURNEY CIRCLE'}
            </AppText>
            <AppText variant="title">{snapshot.activeCircle.name}</AppText>
            {snapshot.activeCircle.description ? (
              <AppText tone="secondary">{snapshot.activeCircle.description}</AppText>
            ) : null}
          </Card>
        ) : null}

        {snapshot?.challenge ? (
          <Card tone="raised" style={styles.stack}>
            <AppText variant="micro" tone="accent">CURRENT COMMUNITY CHALLENGE</AppText>
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
          <Card tone="raised" style={styles.composer}>
            <AppText variant="micro" tone="accent">SHARE WITH THIS CIRCLE</AppText>
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
              onChangeText={(value) => {
                postBodyRef.current = value;
                const hasText = value.trim().length > 0;
                if (hasText !== postHasText) setPostHasText(hasText);
              }}
              multiline
              maxLength={1000}
              placeholder="What happened, and what might help someone on the same path?"
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
              disabled={createMutation.isPending || !postHasText}
              onPress={() => createMutation.mutate()}
            />
          </Card>
        ) : null}

        <View style={styles.feedHeader}>
          <AppText variant="micro" tone="tertiary">CIRCLE FEED</AppText>
          <AppText variant="title">Stories, support, small wins.</AppText>
        </View>

        {snapshot && snapshot.posts.length === 0 ? (
          <Card tone="flat"><AppText tone="secondary">No visible stories in this circle yet.</AppText></Card>
        ) : null}

        {snapshot?.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            myUserId={userId}
            showSmokeFreeDays={profile.journey_mode === 'quit'}
            pending={actionMutation.isPending}
            replyOpen={replyPostId === post.id}
            replyHasText={replyPostId === post.id && replyHasText}
            onReplyBodyChange={(value) => {
              replyBodyRef.current = value;
              const hasText = value.trim().length > 0;
              if (hasText !== replyHasText) setReplyHasText(hasText);
            }}
            onToggleReply={() => {
              setReplyPostId((value) => (value === post.id ? null : post.id));
              replyBodyRef.current = '';
              setReplyHasText(false);
            }}
            onSubmitReply={(postId) => actionMutation.mutate({
              type: 'reply',
              postId,
              body: replyBodyRef.current,
            })}
            onAction={(action) => actionMutation.mutate(action)}
            onReport={(target) => {
              setReportTarget(target);
              setReportReason('harmful');
              reportDetailsRef.current = '';
            }}
          />
        ))}

        {reportTarget ? (
          <Card tone="danger" style={styles.stack}>
            <AppText variant="micro" tone="danger">REPORT TO MODERATION</AppText>
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
              onChangeText={(value) => {
                reportDetailsRef.current = value;
              }}
              maxLength={500}
              multiline
              style={styles.reportInput}
            />
            <Button
              label={reportMutation.isPending ? 'Submitting…' : 'Submit report'}
              disabled={reportMutation.isPending}
              onPress={() => reportMutation.mutate()}
            />
            <Pressable
              onPress={() => {
                setReportTarget(null);
                reportDetailsRef.current = '';
              }}
              style={styles.smallAction}
            >
              <AppText tone="secondary">Cancel</AppText>
            </Pressable>
          </Card>
        ) : null}

        {snapshot && snapshot.blockedUsers.length > 0 ? (
          <Card tone="flat" style={styles.stack}>
            <AppText variant="micro" tone="tertiary">BLOCKED COMMUNITY MEMBERS</AppText>
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
  showSmokeFreeDays,
  pending,
  replyOpen,
  replyHasText,
  onReplyBodyChange,
  onToggleReply,
  onSubmitReply,
  onAction,
  onReport,
}: {
  post: CommunityPost;
  myUserId: string;
  showSmokeFreeDays: boolean;
  pending: boolean;
  replyOpen: boolean;
  replyHasText: boolean;
  onReplyBodyChange: (value: string) => void;
  onToggleReply: () => void;
  onSubmitReply: (postId: string) => void;
  onAction: (action: CommunityAction) => void;
  onReport: (target: ReportTarget) => void;
}) {
  const mine = post.userId === myUserId;
  return (
    <Card tone={post.isFeatured ? 'accent' : 'default'} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderCopy}>
          <AppText variant="title">{post.authorName}</AppText>
          <AppText variant="caption" tone="secondary">
            {topicLabels[post.topic]} · {showSmokeFreeDays ? `day ${post.smokeFreeDays} · ` : ''}{formatCommunityAge(post.createdAt)}
          </AppText>
        </View>
        {post.isFeatured ? <AppText variant="micro" tone="accent">FEATURED</AppText> : null}
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
            disabled={pending || !replyHasText}
            onPress={() => onSubmitReply(post.id)}
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
  chipActive: { borderColor: colors.accentMuted, backgroundColor: colors.accentSoft },
  textarea: { minHeight: 112, textAlignVertical: 'top' },
  reportInput: { minHeight: 80, textAlignVertical: 'top' },
  replyInput: { minHeight: 72, textAlignVertical: 'top' },
  checkboxRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  feedHeader: { gap: spacing.xs },
  postCard: { gap: spacing.md, paddingVertical: spacing.lg },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  postHeaderCopy: { flex: 1, gap: spacing.xs },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  smallAction: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
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
