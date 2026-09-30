import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';

import { createSessionFromAuthUrl } from '@/features/auth/authDeepLink';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
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

  useEffect(() => {
    let active = true;
    let invalidTimer: ReturnType<typeof setTimeout> | null = null;
    const attempted = new Set<string>();

    const verify = async (candidate: string | null | undefined) => {
      if (!candidate || attempted.has(candidate) || !active) return false;
      attempted.add(candidate);

      const result = await createSessionFromAuthUrl(candidate);
      if (!active) return false;
      if (result.kind !== 'session') return false;

      if (invalidTimer) clearTimeout(invalidTimer);
      router.replace('/');
      return true;
    };

    const run = async () => {
      try {
        if (await verify(routeAuthUrl)) return;
        if (await verify(linkingUrl)) return;
        if (await verify(Linking.getLinkingURL())) return;
        if (await verify(await Linking.getInitialURL())) return;

        invalidTimer = setTimeout(() => {
          if (active) setError('This confirmation link is invalid or incomplete.');
        }, 1200);
      } catch {
        if (active) setError('This confirmation link could not be verified.');
      }
    };

    void run();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void verify(url).catch(() => {
        if (active) setError('This confirmation link could not be verified.');
      });
    });

    return () => {
      active = false;
      if (invalidTimer) clearTimeout(invalidTimer);
      subscription.remove();
    };
  }, [linkingUrl, routeAuthUrl]);

  return (
    <Screen>
      <View style={styles.container}>
        <BrandMark />
        <AppText variant="micro" tone={error ? 'danger' : 'accent'}>
          {error ? 'AUTH LINK' : 'SECURE SIGN-IN'}
        </AppText>
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
