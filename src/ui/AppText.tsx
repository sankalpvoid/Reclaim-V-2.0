import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type TextVariant = 'display' | 'headline' | 'title' | 'body' | 'caption' | 'micro';
type TextTone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'danger';

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    tone?: TextTone;
  }
>;

export function AppText({
  children,
  variant = 'body',
  tone = 'primary',
  style,
  accessibilityRole,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      accessibilityRole={accessibilityRole ?? (variant === 'display' || variant === 'headline' ? 'header' : undefined)}
      style={[styles.base, variantStyles[variant], toneStyles[tone], style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});

const variantStyles = StyleSheet.create({
  display: {
    fontSize: typography.display,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  headline: {
    fontSize: typography.headline,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  title: {
    fontSize: typography.title,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 17,
    letterSpacing: 0.15,
  },
  micro: {
    fontSize: typography.micro,
    lineHeight: 15,
    letterSpacing: 0.55,
    fontWeight: '700',
  },
});

const toneStyles = StyleSheet.create({
  primary: {
    color: colors.textPrimary,
  },
  secondary: {
    color: colors.textSecondary,
  },
  tertiary: {
    color: colors.textTertiary,
  },
  accent: {
    color: colors.accentLight,
  },
  success: {
    color: colors.success,
  },
  danger: {
    color: colors.danger,
  },
});
