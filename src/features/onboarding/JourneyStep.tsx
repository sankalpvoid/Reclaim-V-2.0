import { Pressable, StyleSheet, View } from 'react-native';

import type { Profile } from '@/features/profile/profile';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type JourneyMode = Profile['journey_mode'];

type JourneyStepProps = {
  value: JourneyMode;
  onSelect: (mode: JourneyMode) => void;
};

const options: readonly {
  mode: JourneyMode;
  icon: string;
  title: string;
  body: string;
}[] = [
  {
    mode: 'quit',
    icon: '⚑',
    title: 'QUIT NOW',
    body: 'Build a smoke-free streak and see what you reclaim.',
  },
  {
    mode: 'reduce',
    icon: '↘',
    title: 'SMOKE LESS',
    body: 'Track each cigarette and work toward a gentler daily target.',
  },
  {
    mode: 'track',
    icon: '◎',
    title: 'UNDERSTAND MY SMOKING',
    body: 'Notice your pattern without committing to quitting yet.',
  },
] as const;

export function JourneyStep({ value, onSelect }: JourneyStepProps) {
  return (
    <View style={styles.container}>
      <OnboardingHeader
        step={1}
        eyebrow="NO PRESSURE · YOU CAN CHANGE THIS LATER"
        title="Find your own pace."
        body="Reclaim will shape the experience around where you are—not where you think you should be."
      />

      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.mode === value;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.mode)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.icon, selected && styles.iconSelected]}>
                <AppText variant="title">{option.icon}</AppText>
              </View>
              <View style={styles.copy}>
                <AppText variant="title">{option.title}</AppText>
                <AppText tone="secondary">{option.body}</AppText>
              </View>
              <AppText tone="secondary">{selected ? '✓' : '›'}</AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="caption" tone="secondary" style={styles.note}>
        Every path is private. Every honest log counts as useful information.
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
    minHeight: 116,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.surfaceRaised,
  },
  cardPressed: {
    opacity: 0.84,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  note: {
    textAlign: 'center',
  },
});
