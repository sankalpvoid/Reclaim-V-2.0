import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { COUNTRIES, getCountry } from '@/features/onboarding/countries';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type CountrySelectProps = {
  value: string;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
};

export function CountrySelect({ value, onChange, disabled = false }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getCountry(value);

  return (
    <>
      <View style={styles.field}>
        <AppText variant="caption">Country</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Country, ${selected.name}`}
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <View style={styles.triggerCopy}>
            <AppText>{selected.name}</AppText>
            <AppText variant="caption" tone="secondary">
              {selected.currency} · {selected.symbol}
            </AppText>
          </View>
          <AppText tone="secondary">›</AppText>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeading}>
              <AppText variant="micro" tone="accent">RECLAIM</AppText>
              <AppText variant="title">Choose your country</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.done}>
              <AppText tone="accent">Done</AppText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.options}>
            {COUNTRIES.map((country) => {
              const isSelected = country.code === value;
              return (
                <Pressable
                  key={country.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.triggerCopy}>
                    <AppText>{country.name}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {country.currency} · {country.symbol}
                    </AppText>
                  </View>
                  {isSelected ? <AppText tone="accent">✓</AppText> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
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
  triggerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalHeading: {
    flex: 1,
    gap: spacing.xs,
  },
  done: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  options: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    minHeight: 62,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.accentMuted,
    backgroundColor: colors.accentSoft,
  },
});
