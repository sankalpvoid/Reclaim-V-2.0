import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/ui/Screen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function FoundationScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>RECLAIM V2</Text>
        <Text style={styles.title}>The new foundation is alive.</Text>
        <Text style={styles.body}>
          Native-first architecture is now separated from the legacy V1 frontend.
        </Text>
        <View style={styles.links}>
          <Link href="/(auth)" style={styles.link}>Auth shell</Link>
          <Link href="/(onboarding)" style={styles.link}>Onboarding shell</Link>
          <Link href="/(app)" style={styles.link}>Main app shell</Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '800',
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  links: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  link: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
