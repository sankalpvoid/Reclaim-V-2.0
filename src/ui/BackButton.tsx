import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type BackButtonProps = {
  label?: string;
  onPress: () => void;
};

export function BackButton({ label = 'Back', onPress }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <AppText variant="title" tone="accent">‹</AppText>
      <AppText variant="caption" tone="secondary">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.backgroundRaised,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
});
