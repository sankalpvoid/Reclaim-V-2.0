import { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/ui/AppText';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({
  label,
  error,
  style,
  accessibilityLabel,
  accessibilityHint,
  value,
  defaultValue,
  onChangeText,
  ...props
}: InputProps) {
  const inputRef = useRef<TextInput>(null);
  const lastEmittedValueRef = useRef<string | undefined>(undefined);
  const initialValueRef = useRef(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value === undefined || value === lastEmittedValueRef.current) {
      return;
    }

    inputRef.current?.setNativeProps({ text: value });
    lastEmittedValueRef.current = value;
  }, [value]);

  const resolvedHint = error
    ? [accessibilityHint, `Error: ${error}`].filter(Boolean).join('. ')
    : accessibilityHint;

  return (
    <View style={styles.field}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <TextInput
        ref={inputRef}
        {...props}
        defaultValue={initialValueRef.current}
        onChangeText={(text) => {
          lastEmittedValueRef.current = text;
          onChangeText?.(text);
        }}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={resolvedHint || undefined}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          variant="caption"
          tone="danger"
        >
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
