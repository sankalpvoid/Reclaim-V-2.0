import { useState } from 'react';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type QuitDatePickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
  label?: string;
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export function QuitDatePicker({
  value,
  onChange,
  disabled = false,
  label = 'Your quit date and time',
}: QuitDatePickerProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.field}>
        <AppText variant="caption">{label}</AppText>
        <View style={styles.iosPicker}>
          <ExpoDateTimePicker
            value={value}
            disabled={disabled}
            display="compact"
            maximumDate={new Date()}
            mode="datetime"
            themeVariant="dark"
            onValueChange={(_event, selectedDate) => onChange(selectedDate)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <AppText variant="caption">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setShowAndroidPicker(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed, disabled && styles.disabled]}
      >
        <View style={styles.copy}>
          <AppText variant="micro" tone="accent">QUIT STARTED</AppText>
          <AppText>{formatDateTime(value)}</AppText>
        </View>
        <AppText tone="accent">›</AppText>
      </Pressable>
      {showAndroidPicker ? (
        <ExpoDateTimePicker
          value={value}
          maximumDate={new Date()}
          mode="datetime"
          presentation="dialog"
          onDismiss={() => setShowAndroidPicker(false)}
          onValueChange={(_event, selectedDate) => {
            setShowAndroidPicker(false);
            onChange(selectedDate);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  iosPicker: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  trigger: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
