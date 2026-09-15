import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import type { OnboardingMood } from '@/features/onboarding/onboardingSchemas';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type MoodStepProps = {
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSelect: (mood: OnboardingMood) => void;
};

const moods: readonly {
  mood: OnboardingMood;
  icon: string;
  title: string;
  body: string;
}[] = [
  { mood: 'great', icon: '🙂', title: 'I’m feeling great', body: 'Let’s keep the streak alive!' },
  { mood: 'okay', icon: '😐', title: 'I’m okay', body: 'Getting there.' },
  { mood: 'struggling', icon: '☹', title: 'I’m struggling', body: 'Need some support.' },
  { mood: 'craving', icon: '✹', title: 'I’m having strong cravings', body: 'Help me get through this!' },
] as const;

export function MoodStep({ isSubmitting, error, onBack, onSelect }: MoodStepProps) {
  return (
    <View style={styles.container}>
      <OnboardingHeader
        step={3}
        eyebrow="RECLAIM"
        title="How are you today?"
        body="Your journey matters. Let’s keep going."
        onBack={onBack}
      />

      <View style={styles.options}>
        {moods.map((item) => (
          <Pressable
            key={item.mood}
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => onSelect(item.mood)}
            style={({ pressed }) => [
              styles.card,
              pressed && !isSubmitting && styles.cardPressed,
              isSubmitting && styles.disabled,
            ]}
          >
            <View style={styles.icon}>
              <AppText variant="title">{item.icon}</AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="title">{item.title}</AppText>
              <AppText tone="secondary">{item.body}</AppText>
            </View>
            <AppText tone="secondary">›</AppText>
          </Pressable>
        ))}
      </View>

      {isSubmitting ? <AppText tone="secondary">Saving your check-in…</AppText> : null}
      {error ? <AppText tone="danger">{error}</AppText> : null}

      <AppText variant="caption" tone="secondary" style={styles.note}>
        You’re not alone. We’ve got you.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  options: {
    gap: spacing.md,
  },
  card: {
    minHeight: 92,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  note: {
    textAlign: 'center',
  },
});
