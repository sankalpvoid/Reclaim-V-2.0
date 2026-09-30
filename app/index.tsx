import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthContext';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
import { Button } from '@/ui/Button';
import { ErrorCard } from '@/ui/ErrorCard';
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
          <BrandMark />
          <AppText variant="micro" tone="accent">RETURNING TO YOUR SPACE</AppText>
          <AppText variant="headline">Restoring your session…</AppText>
        </View>
      </Screen>
    );
  }

  if (authError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <BrandMark />
          <AppText variant="headline">We couldn’t restore your session.</AppText>
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
          <BrandMark />
          <AppText variant="headline">Your profile couldn’t be loaded.</AppText>
          <ErrorCard message={profileError.message} />
          <Button variant="secondary" label="Try again" onPress={() => void refreshProfile()} />
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
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
