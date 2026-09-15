import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/ui/AppText';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, accessibilityLabel, ...props }: InputProps) {
  return (
    <View style={styles.field}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
