import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';

import { createSessionFromAuthUrl } from '@/features/auth/authDeepLink';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

type AuthRouteParams = {
  '#': string;
  code: string;
  error_description: string;
};

export default function AuthCallbackScreen() {
  const linkingUrl = Linking.useLinkingURL();
  const params = useLocalSearchParams<AuthRouteParams>();
  const [error, setError] = useState<string | null>(null);

  const routeAuthUrl = useMemo(() => {
    const query = new URLSearchParams();

    if (typeof params.code === 'string' && params.code) {
      query.set('code', params.code);
    }
    if (typeof params.error_description === 'string' && params.error_description) {
      query.set('error_description', params.error_description);
    }

    const hash = typeof params['#'] === 'string' && params['#'] ? `#${params['#']}` : '';
    if (!hash && query.size === 0) return null;

    const search = query.size > 0 ? `?${query.toString()}` : '';
    return `reclaim://auth-callback${search}${hash}`;
  }, [params]);

  const authUrl = routeAuthUrl ?? linkingUrl;

  useEffect(() => {
    if (!authUrl) return;

    let active = true;
    void createSessionFromAuthUrl(authUrl)
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
  }, [authUrl]);

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
