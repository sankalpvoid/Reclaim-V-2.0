import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';

import { createSessionFromAuthUrl } from '@/features/auth/authDeepLink';
import {
  resetPasswordSchema,
} from '@/features/auth/authSchemas';
import { updatePassword } from '@/features/auth/authService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

type AuthRouteParams = {
  '#': string;
  code: string;
  error_description: string;
};

export default function ResetPasswordScreen() {
  const linkingUrl = Linking.useLinkingURL();
  const params = useLocalSearchParams<AuthRouteParams>();
  const [isReady, setIsReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return `reclaim://reset-password${search}${hash}`;
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
      setLinkError(null);
      setIsReady(true);
      return true;
    };

    const fail = () => {
      if (!active || isReady) return;
      setLinkError('This recovery link is invalid or incomplete. Request a new one.');
    };

    const run = async () => {
      try {
        if (await verify(routeAuthUrl)) return;
        if (await verify(linkingUrl)) return;
        if (await verify(Linking.getLinkingURL())) return;
        if (await verify(await Linking.getInitialURL())) return;

        invalidTimer = setTimeout(fail, 1200);
      } catch {
        if (active) {
          setLinkError('This recovery link could not be verified. Request a new one.');
        }
      }
    };

    void run();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void verify(url).catch(() => {
        if (active) {
          setLinkError('This recovery link could not be verified. Request a new one.');
        }
      });
    });

    return () => {
      active = false;
      if (invalidTimer) clearTimeout(invalidTimer);
      subscription.remove();
    };
  }, [isReady, linkingUrl, routeAuthUrl]);

  async function submit() {
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ password, confirmation });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the new password and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(parsed.data.password);
      router.replace('/');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Password could not be updated.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <BrandMark />
          <AppText variant="micro" tone="accent">ACCOUNT RECOVERY</AppText>
          <AppText variant="display">Choose a new password.</AppText>
          <AppText tone="secondary">
            This screen only works from a valid Reclaim password-recovery email.
          </AppText>
        </View>

        {linkError ? (
          <View style={styles.formPanel}>
            <View style={styles.form}>
              <AppText accessibilityRole="alert" tone="danger">{linkError}</AppText>
              <Button
                label="Back to sign in"
                onPress={() => router.replace('/(auth)')}
              />
            </View>
          </View>
        ) : isReady ? (
          <View style={styles.formPanel}>
            <View style={styles.form}>
              <Input
                label="New password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                secureTextEntry
                editable={!isSubmitting}
              />
              <Input
                label="Confirm new password"
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                secureTextEntry
                editable={!isSubmitting}
              />
              {formError ? (
                <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
                  {formError}
                </AppText>
              ) : null}
              <Button
                label={isSubmitting ? 'Updating password…' : 'Update password'}
                disabled={isSubmitting}
                onPress={() => void submit()}
              />
            </View>
          </View>
        ) : (
          <View style={styles.verifying}>
            <AppText variant="headline">Checking your link…</AppText>
            <AppText tone="secondary">This should only take a moment.</AppText>
          </View>
        )}
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
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  verifying: {
    gap: spacing.sm,
  },
});
