import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { TodayScreen } from '@/features/today/TodayScreen';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

export default function MainAppRoute() {
  return (
    <View style={styles.root}>
      <TodayScreen />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View personalized insights"
        onPress={() => router.push('/(app)/insights')}
        style={styles.insightsEntry}
      >
        <AppText variant="caption">INSIGHTS</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  insightsEntry: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
