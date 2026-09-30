import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type CardTone = 'default' | 'raised' | 'accent' | 'success' | 'danger' | 'flat';

type CardProps = PropsWithChildren<ViewProps> & {
  tone?: CardTone;
};

export function Card({ children, style, tone = 'default', ...props }: CardProps) {
  return (
    <View {...props} style={[styles.card, toneStyles[tone], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});

const toneStyles = StyleSheet.create({
  default: {},
  raised: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  accent: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.accentMuted,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  flat: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
});
