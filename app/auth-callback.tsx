import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { createSessionFromAuthUrl } from '@/features/auth/authDeepLink';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

export default function AuthCallbackScreen() {
  const url = Linking.useURL();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    let active = true;
    void createSessionFromAuthUrl(url)
      .then((result) => {
        if (!active) return;
        if (result.kind === 'invalid') {
          setError('This confirmation link is invalid or incomplete.');
          return;
        }
        router.replace('/');
      })
      .catch(() => {
        if (active) setError('This confirmation link could not be verified.');
      });

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="caption" tone="secondary">RECLAIM</AppText>
        <AppText variant="display">{error ? 'Link not verified.' : 'Confirming your account…'}</AppText>
        <AppText tone={error ? 'danger' : 'secondary'}>
          {error ?? 'You will continue automatically when confirmation is complete.'}
        </AppText>
        {error ? (
          <Button label="Back to sign in" onPress={() => router.replace('/(auth)')} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
