import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthContext';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

export default function EntryScreen() {
  const {
    isReady,
    isAuthenticated,
    profile,
    authError,
    profileError,
    refreshProfile,
  } = useAuth();

  if (!isReady) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText variant="caption" tone="secondary">
            RECLAIM V2
          </AppText>
          <AppText variant="title">Restoring your session…</AppText>
        </View>
      </Screen>
    );
  }

  if (authError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText variant="title">We couldn’t restore your session.</AppText>
          <AppText tone="secondary">{authError.message}</AppText>
        </View>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  if (profileError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText variant="title">Your profile couldn’t be loaded.</AppText>
          <AppText tone="secondary">{profileError.message}</AppText>
          <Button label="Try again" onPress={() => void refreshProfile()} />
        </View>
      </Screen>
    );
  }

  if (profile?.onboarding_completed === true) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(onboarding)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
});
