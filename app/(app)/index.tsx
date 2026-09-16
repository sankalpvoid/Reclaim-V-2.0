import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { TodayScreen } from '@/features/today/TodayScreen';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

export default function MainAppRoute() {
  return (
    <View style={styles.root}>
      <TodayScreen />
      <View style={styles.quickEntries}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open community circles"
          onPress={() => router.push('/(app)/community')}
          style={styles.quickEntry}
        >
          <AppText variant="caption">COMMUNITY</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View savings goals"
          onPress={() => router.push('/(app)/goals')}
          style={styles.quickEntry}
        >
          <AppText variant="caption">GOALS</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View personalized insights"
          onPress={() => router.push('/(app)/insights')}
          style={styles.quickEntry}
        >
          <AppText variant="caption">INSIGHTS</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  quickEntries: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  quickEntry: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
