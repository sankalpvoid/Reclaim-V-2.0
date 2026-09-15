import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type TextVariant = 'display' | 'title' | 'body' | 'caption';
type TextTone = 'primary' | 'secondary' | 'danger';

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
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
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
    fontWeight: '800',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
});

const toneStyles = StyleSheet.create({
  primary: {
    color: colors.textPrimary,
  },
  secondary: {
    color: colors.textSecondary,
  },
  danger: {
    color: colors.danger,
  },
});
