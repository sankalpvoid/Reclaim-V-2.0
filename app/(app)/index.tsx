import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthContext';
import { signOut } from '@/features/auth/authService';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

export default function MainAppShell() {
  const { user, profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Could not sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="caption" tone="secondary">
          RECLAIM V2 · AUTHENTICATED
        </AppText>
        <AppText variant="display">
          {profile?.display_name ? `Namaste, ${profile.display_name}.` : 'Namaste.'}
        </AppText>
        <AppText tone="secondary">
          The native session and profile layer are active. Product screens will migrate onto this shell feature by feature.
        </AppText>
        {user?.email ? <AppText tone="secondary">Signed in as {user.email}</AppText> : null}
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <Button
          label={isSigningOut ? 'Signing out…' : 'Sign out'}
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
