import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import {
  buildGoalProgress,
  calculateDailyAutomaticFunding,
  goalDraftSchema,
  type GoalDraft,
  type SavingsGoal,
} from '@/features/goals/goalModel';
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  goalKeys,
  updateSavingsGoal,
} from '@/features/goals/goalService';
import { buildQuitTodaySummary, formatMoney } from '@/features/today/todayModel';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

function draftFromInputs(name: string, target: string) {
  return goalDraftSchema.safeParse({
    name,
    targetAmount: Number(target.trim().replace(',', '.')),
  });
}

function GoalCard({
  goal,
  moneyReclaimed,
  dailyFunding,
  currencySymbol,
  deleting,
  onDelete,
  onUpdated,
}: {
  goal: SavingsGoal;
  moneyReclaimed: number;
  dailyFunding: number;
  currencySymbol: string;
  deleting: boolean;
  onDelete: () => void;
  onUpdated: () => void;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.target_amount));
  const [formError, setFormError] = useState<string | null>(null);
  const progress = useMemo(
    () => buildGoalProgress(goal.target_amount, moneyReclaimed, dailyFunding),
    [dailyFunding, goal.target_amount, moneyReclaimed],
  );

  const updateMutation = useMutation({
    mutationFn: async (draft: GoalDraft) => {
      if (!user?.id) throw new Error('Your session is not ready yet.');
      return updateSavingsGoal(user.id, goal.id, draft);
    },
    onSuccess: () => {
      setEditing(false);
      setFormError(null);
      onUpdated();
    },
  });

  function saveEdit() {
    const parsed = draftFromInputs(name, target);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the goal details.');
      return;
    }
    setFormError(null);
    updateMutation.mutate(parsed.data);
  }

  return (
    <Card tone={progress.achieved ? 'success' : 'raised'} style={styles.goalCard}>
      {editing ? (
        <>
          <Input
            label="Goal name"
            value={name}
            onChangeText={setName}
            maxLength={80}
            autoCorrect={false}
          />
          <Input
            label="Target amount"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
          />
          {formError ? <AppText tone="danger">{formError}</AppText> : null}
          {updateMutation.error ? (
            <AppText tone="danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : 'Could not update goal.'}
            </AppText>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={updateMutation.isPending}
              onPress={() => {
                setEditing(false);
                setName(goal.name);
                setTarget(String(goal.target_amount));
                setFormError(null);
              }}
              style={styles.textAction}
            >
              <AppText tone="secondary">Cancel</AppText>
            </Pressable>
            <Button
              label={updateMutation.isPending ? 'Saving…' : 'Save changes'}
              disabled={updateMutation.isPending}
              onPress={saveEdit}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.goalHeading}>
            <View style={styles.goalHeadingCopy}>
              <AppText variant="micro" tone={progress.achieved ? 'success' : 'tertiary'}>
                {progress.achieved ? 'GOAL REACHED' : 'SAVINGS GOAL'}
              </AppText>
              <AppText variant="title">{goal.name}</AppText>
            </View>
            <AppText variant="caption" tone="secondary">
              {Math.round(progress.progressPercent)}%
            </AppText>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress.progressPercent)}%` }]} />
          </View>

          <AppText>
            {formatMoney(currencySymbol, progress.fundedAmount)} of {formatMoney(currencySymbol, goal.target_amount)}
          </AppText>

          {progress.achieved ? (
            <AppText tone="secondary">
              Your reclaimed total has reached this target. The goal does not spend or reset your savings.
            </AppText>
          ) : (
            <>
              <AppText tone="secondary">
                {formatMoney(currencySymbol, progress.remainingAmount)} remaining
                {progress.estimatedDaysRemaining !== null
                  ? ` · about ${progress.estimatedDaysRemaining} smoke-free day${progress.estimatedDaysRemaining === 1 ? '' : 's'} at your current baseline`
                  : ''}
              </AppText>
              {progress.nextCheckpointPercent !== null ? (
                <AppText variant="caption" tone="secondary">
                  Next checkpoint: {progress.nextCheckpointPercent}% · {formatMoney(currencySymbol, progress.amountToNextCheckpoint)} away
                </AppText>
              ) : null}
            </>
          )}

          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.textAction}>
              <AppText tone="secondary">Edit</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onDelete}
              style={styles.textAction}
            >
              <AppText tone="danger">{deleting ? 'Deleting…' : 'Delete'}</AppText>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}

export function GoalsScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const userId = user?.id ?? '';
  const goalsQuery = useQuery({
    queryKey: goalKeys.list(userId),
    queryFn: () => getSavingsGoals(userId),
    enabled: Boolean(userId),
  });

  const quitSummary = profile?.journey_mode === 'quit' ? buildQuitTodaySummary(profile, now) : null;
  const moneyReclaimed = quitSummary?.moneyReclaimed ?? 0;
  const dailyFunding = profile
    ? calculateDailyAutomaticFunding(
        profile.cigarettes_per_day ?? 0,
        profile.price_per_pack ?? 0,
        profile.cigarettes_per_pack ?? 0,
      )
    : 0;
  const canAutoFund = Boolean(profile?.journey_mode === 'quit' && profile.quit_date);
  const currencySymbol = profile?.currency_symbol ?? '₹';

  const createMutation = useMutation({
    mutationFn: async (draft: GoalDraft) => {
      if (!userId) throw new Error('Your session is not ready yet.');
      return createSavingsGoal(userId, draft);
    },
    onSuccess: async () => {
      setName('');
      setTarget('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: goalKeys.list(userId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!userId) throw new Error('Your session is not ready yet.');
      await deleteSavingsGoal(userId, goalId);
      return goalId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: goalKeys.list(userId) });
    },
  });

  function createGoal() {
    const parsed = draftFromInputs(name, target);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the goal details.');
      return;
    }
    setFormError(null);
    createMutation.mutate(parsed.data);
  }

  function confirmDelete(goal: SavingsGoal) {
    Alert.alert(
      `Delete “${goal.name}”?`,
      'This removes the goal only. Your reclaimed-money calculation will not change.',
      [
        { text: 'Keep goal', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(goal.id) },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <AppText tone="secondary">‹ Back</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="micro" tone="accent">SAVINGS GOALS</AppText>
          <AppText variant="display">Make room for more.</AppText>
          <AppText tone="secondary">
            Turn money reclaimed from smoking into visible targets. Goals never spend or reset your progress.
          </AppText>
        </View>

        {canAutoFund ? (
          <Card tone="accent" style={styles.fundingCard}>
            <AppText variant="micro" tone="accent">AUTOMATIC FUNDING</AppText>
            <AppText style={styles.reclaimedValue}>{formatMoney(currencySymbol, moneyReclaimed)}</AppText>
            <AppText tone="secondary">reclaimed since your quit date</AppText>
            <AppText variant="caption" tone="secondary">
              Current baseline: about {formatMoney(currencySymbol, dailyFunding)} per smoke-free day
            </AppText>
          </Card>
        ) : (
          <Card style={styles.fundingCard}>
            <AppText variant="title">Automatic funding needs a quit timeline.</AppText>
            <AppText tone="secondary">
              Reclaim will not infer savings from missing Reduce or Track logs. Your saved goals remain intact if your journey changes.
            </AppText>
          </Card>
        )}

        <View style={styles.sectionHeading}>
          <AppText variant="micro" tone="tertiary">YOUR GOALS</AppText>
          <AppText variant="title">What are you reclaiming for?</AppText>
        </View>

        {goalsQuery.isLoading ? (
          <Card><AppText tone="secondary">Loading goals…</AppText></Card>
        ) : goalsQuery.error ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">
              {goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Could not load your goals.'}
            </AppText>
          </Card>
        ) : goalsQuery.data?.length ? (
          <View style={styles.stack}>
            {goalsQuery.data.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                moneyReclaimed={canAutoFund ? moneyReclaimed : 0}
                dailyFunding={canAutoFund ? dailyFunding : 0}
                currencySymbol={currencySymbol}
                deleting={deleteMutation.isPending && deleteMutation.variables === goal.id}
                onDelete={() => confirmDelete(goal)}
                onUpdated={() => void queryClient.invalidateQueries({ queryKey: goalKeys.list(userId) })}
              />
            ))}
          </View>
        ) : (
          <Card tone="raised" style={styles.emptyCard}>
            <AppText variant="title">No goal yet.</AppText>
            <AppText tone="secondary">
              Add something meaningful. Reclaim will compare your reclaimed total with that target automatically.
            </AppText>
          </Card>
        )}

        <Card tone="raised" style={styles.createCard}>
          <AppText variant="micro" tone="accent">ADD A GOAL</AppText>
          <Input
            label="What are you saving for?"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setFormError(null);
            }}
            placeholder="Weekend away"
            maxLength={80}
            autoCorrect={false}
          />
          <Input
            label={`Target amount (${currencySymbol})`}
            value={target}
            onChangeText={(value) => {
              setTarget(value);
              setFormError(null);
            }}
            placeholder="15000"
            keyboardType="decimal-pad"
          />
          {formError ? <AppText tone="danger">{formError}</AppText> : null}
          {createMutation.error ? (
            <AppText tone="danger">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Could not create goal.'}
            </AppText>
          ) : null}
          {deleteMutation.error ? (
            <AppText tone="danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : 'Could not delete goal.'}
            </AppText>
          ) : null}
          <Button
            label={createMutation.isPending ? 'Creating…' : 'Create goal'}
            disabled={createMutation.isPending}
            onPress={createGoal}
          />
        </Card>

        <Card tone="flat" style={styles.noteCard}>
          <AppText variant="micro" tone="tertiary">HOW FUNDING WORKS</AppText>
          <AppText tone="secondary">
            Every goal is compared with the same total money Reclaim calculates as reclaimed. Multiple goals do not duplicate, allocate, or spend money; they are progress targets, not a wallet.
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
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
  backButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  heading: {
    gap: spacing.sm,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  fundingCard: {
    gap: spacing.sm,
  },
  reclaimedValue: {
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '800',
    letterSpacing: -2,
    color: colors.accentLight,
  },
  stack: {
    gap: spacing.md,
  },
  goalCard: {
    gap: spacing.md,
  },
  goalHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  goalHeadingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  textAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  emptyCard: {
    gap: spacing.sm,
  },
  createCard: {
    gap: spacing.md,
  },
  noteCard: {
    gap: spacing.sm,
  },
  errorCard: {
    borderColor: colors.danger,
  },
});
