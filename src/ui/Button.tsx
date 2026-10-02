import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  icon,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accentStrong,
    borderWidth: 1,
    borderColor: colors.accentStrong,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
});

const variantStyles = StyleSheet.create({
  primary: {},
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: colors.textPrimary,
  },
  ghost: {
    color: colors.textSecondary,
  },
  danger: {
    color: colors.danger,
  },
});
