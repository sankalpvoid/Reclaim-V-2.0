import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CountrySelect } from '@/features/onboarding/CountrySelect';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { QuitDatePicker } from '@/features/onboarding/QuitDatePicker';
import { calculateInitialReductionTarget } from '@/features/onboarding/onboardingModel';
import { onboardingPlanSchema } from '@/features/onboarding/onboardingSchemas';
import { saveOnboardingPlan } from '@/features/onboarding/onboardingService';
import type { Profile } from '@/features/profile/profile';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';

type JourneyMode = Profile['journey_mode'];

type PlanFormValues = {
  displayName: string;
  country: string;
  cigarettesPerDay: string;
  pricePerPack: string;
  cigarettesPerPack: string;
};

type PlanStepProps = {
  userId: string;
  mode: JourneyMode;
  profile: Profile;
  defaultDisplayName: string;
  onBack: () => void;
  onSaved: () => void;
};

const modeCopy: Record<JourneyMode, { label: string; title: string; body: string }> = {
  quit: {
    label: 'QUIT NOW',
    title: 'Make it yours.',
    body: 'These details power your live Reclaim calculations.',
  },
  reduce: {
    label: 'SMOKE LESS',
    title: 'Make it yours.',
    body: 'A few details turn each quick log into a useful pattern and a gentle target.',
  },
  track: {
    label: 'UNDERSTAND MY SMOKING',
    title: 'Make it yours.',
    body: 'A few details turn each quick log into a useful pattern.',
  },
};

function initialQuitDate(profile: Profile) {
  if (!profile.quit_date) return new Date();
  const parsed = new Date(profile.quit_date);
  if (!Number.isFinite(parsed.getTime()) || parsed.getTime() > Date.now()) return new Date();
  return parsed;
}

export function PlanStep({
  userId,
  mode,
  profile,
  defaultDisplayName,
  onBack,
  onSaved,
}: PlanStepProps) {
  const [quitDate, setQuitDate] = useState(() => initialQuitDate(profile));
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<PlanFormValues>({
    defaultValues: {
      displayName: profile.display_name ?? defaultDisplayName,
      country: profile.country ?? 'IN',
      cigarettesPerDay: String(profile.cigarettes_per_day ?? 20),
      pricePerPack: String(profile.price_per_pack ?? 300),
      cigarettesPerPack: String(profile.cigarettes_per_pack ?? 20),
    },
  });

  const cigarettesPerDay = watch('cigarettesPerDay');
  const targetPreview = useMemo(() => {
    if (mode !== 'reduce') return null;
    const value = Number(cigarettesPerDay);
    return Number.isFinite(value) && value > 0 ? calculateInitialReductionTarget(value) : null;
  }, [cigarettesPerDay, mode]);

  const copy = modeCopy[mode];

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const parsed = onboardingPlanSchema.safeParse({
      ...values,
      journeyMode: mode,
      quitDate: mode === 'quit' ? quitDate : null,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
      return;
    }

    try {
      await saveOnboardingPlan(userId, parsed.data);
      onSaved();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save your plan.');
    }
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <OnboardingHeader
          step={2}
          eyebrow={`YOUR PACE · ${copy.label}`}
          title={copy.title}
          body={copy.body}
          onBack={onBack}
        />

        <Card style={styles.modeCard}>
          <AppText variant="caption" tone="secondary">YOUR PACE</AppText>
          <AppText variant="title">{copy.label}</AppText>
        </Card>

        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Name"
                value={value}
                onChangeText={onChange}
                editable={!isSubmitting}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                placeholder="Your name"
              />
            )}
          />

          {mode === 'quit' ? (
            <QuitDatePicker value={quitDate} onChange={setQuitDate} disabled={isSubmitting} />
          ) : null}

          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, value } }) => (
              <CountrySelect value={value} onChange={onChange} disabled={isSubmitting} />
            )}
          />

          <Controller
            control={control}
            name="cigarettesPerDay"
            render={({ field: { onChange, value } }) => (
              <Input
                label={mode === 'quit' ? 'Cigarettes per day' : 'Your usual cigarettes per day'}
                value={value}
                onChangeText={onChange}
                editable={!isSubmitting}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="20"
              />
            )}
          />

          {mode === 'reduce' && targetPreview !== null ? (
            <Card>
              <AppText variant="caption" tone="secondary">YOUR FIRST GENTLE TARGET</AppText>
              <AppText variant="title">{targetPreview} cigarettes / day</AppText>
              <AppText tone="secondary">
                About 10% below your baseline, with at least a one-cigarette step. Reclaim never automatically pushes the target below 1/day.
              </AppText>
            </Card>
          ) : null}

          <Controller
            control={control}
            name="pricePerPack"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Price per pack"
                value={value}
                onChangeText={onChange}
                editable={!isSubmitting}
                keyboardType="decimal-pad"
                inputMode="decimal"
                placeholder="300"
              />
            )}
          />

          <Controller
            control={control}
            name="cigarettesPerPack"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cigarettes per pack"
                value={value}
                onChangeText={onChange}
                editable={!isSubmitting}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="20"
              />
            )}
          />

          {formError ? <AppText tone="danger">{formError}</AppText> : null}

          <Button
            label={isSubmitting ? 'Saving…' : 'Save & continue'}
            disabled={isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  container: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  modeCard: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
});
