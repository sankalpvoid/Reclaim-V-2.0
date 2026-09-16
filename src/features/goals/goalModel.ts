import { z } from 'zod';

export const savingsGoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  target_amount: z.coerce.number(),
  current_amount: z.coerce.number(),
  achieved: z.boolean(),
  created_at: z.string(),
});

export type SavingsGoal = z.infer<typeof savingsGoalSchema>;

export const goalDraftSchema = z.object({
  name: z.string().trim().min(1, 'Give your goal a name.').max(80, 'Keep the goal name under 80 characters.'),
  targetAmount: z
    .number()
    .finite()
    .positive('Target amount must be greater than zero.')
    .max(1_000_000_000, 'Target amount is too large.'),
});

export type GoalDraft = z.infer<typeof goalDraftSchema>;

export type GoalProgress = {
  fundedAmount: number;
  progressPercent: number;
  remainingAmount: number;
  achieved: boolean;
  nextCheckpointPercent: number | null;
  amountToNextCheckpoint: number;
  estimatedDaysRemaining: number | null;
};

const checkpoints = [25, 50, 75, 100] as const;

export function calculateDailyAutomaticFunding(
  cigarettesPerDay: number,
  pricePerPack: number,
  cigarettesPerPack: number,
): number {
  if (
    !Number.isFinite(cigarettesPerDay) ||
    !Number.isFinite(pricePerPack) ||
    !Number.isFinite(cigarettesPerPack) ||
    cigarettesPerDay <= 0 ||
    pricePerPack < 0 ||
    cigarettesPerPack <= 0
  ) {
    return 0;
  }

  return cigarettesPerDay * (pricePerPack / cigarettesPerPack);
}

export function buildGoalProgress(
  targetAmount: number,
  moneyReclaimed: number,
  dailyAutomaticFunding = 0,
): GoalProgress {
  const target = Math.max(0, Number.isFinite(targetAmount) ? targetAmount : 0);
  const reclaimed = Math.max(0, Number.isFinite(moneyReclaimed) ? moneyReclaimed : 0);
  const daily = Math.max(0, Number.isFinite(dailyAutomaticFunding) ? dailyAutomaticFunding : 0);

  if (target === 0) {
    return {
      fundedAmount: 0,
      progressPercent: 0,
      remainingAmount: 0,
      achieved: false,
      nextCheckpointPercent: null,
      amountToNextCheckpoint: 0,
      estimatedDaysRemaining: null,
    };
  }

  const fundedAmount = Math.min(target, reclaimed);
  const progressPercent = Math.min(100, (reclaimed / target) * 100);
  const remainingAmount = Math.max(0, target - reclaimed);
  const achieved = reclaimed >= target;
  const nextCheckpointPercent = achieved
    ? null
    : checkpoints.find((checkpoint) => progressPercent < checkpoint) ?? 100;
  const nextCheckpointAmount = nextCheckpointPercent === null ? target : (target * nextCheckpointPercent) / 100;
  const amountToNextCheckpoint = achieved ? 0 : Math.max(0, nextCheckpointAmount - reclaimed);
  const estimatedDaysRemaining = achieved || daily <= 0 ? (achieved ? 0 : null) : Math.ceil(remainingAmount / daily);

  return {
    fundedAmount,
    progressPercent,
    remainingAmount,
    achieved,
    nextCheckpointPercent,
    amountToNextCheckpoint,
    estimatedDaysRemaining,
  };
}
