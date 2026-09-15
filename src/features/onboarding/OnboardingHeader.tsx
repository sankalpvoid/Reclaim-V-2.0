import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type OnboardingHeaderProps = {
  step: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  body: string;
  onBack?: () => void;
};

export function OnboardingHeader({ step, eyebrow, title, body, onBack }: OnboardingHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}>
            <AppText>‹</AppText>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.progress} accessibilityLabel={`Onboarding step ${step} of 3`}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.progressSegment, item <= step && styles.progressSegmentActive]} />
          ))}
        </View>
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" tone="secondary">{eyebrow}</AppText>
        <AppText variant="display">{title}</AppText>
        <AppText tone="secondary">{body}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 42,
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressSegment: {
    height: 3,
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.textPrimary,
  },
  copy: {
    gap: spacing.sm,
  },
});
