import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { trackAnalyticsEvent } from '@/core/observability/analyticsService';
import {
  emailSchema,
  signInSchema,
  signUpSchema,
} from '@/features/auth/authSchemas';
import {
  requestPasswordReset,
  resendSignUpConfirmation,
  signInWithPassword,
  signUpWithPassword,
} from '@/features/auth/authService';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

type AuthMode = 'signIn' | 'signUp' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  const isSignIn = mode === 'signIn';
  const isSignUp = mode === 'signUp';
  const isForgot = mode === 'forgot';

  async function submit() {
    setFormError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (isSignIn) {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
          return;
        }

        void trackAnalyticsEvent({
          eventName: 'auth_submitted',
          authAction: 'sign_in',
        });
        await signInWithPassword(parsed.data);
        return;
      }

      if (isSignUp) {
        const parsed = signUpSchema.safeParse({ displayName, email, password });
        if (!parsed.success) {
          setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
          return;
        }

        void trackAnalyticsEvent({
          eventName: 'auth_submitted',
          authAction: 'sign_up',
        });
        const result = await signUpWithPassword(parsed.data);
        if (!result.session) {
          setPendingConfirmationEmail(parsed.data.email);
          setNotice('Account created. Check your email to confirm it, then return to Reclaim.');
          setMode('signIn');
          setPassword('');
        }
        return;
      }

      const parsed = emailSchema.safeParse({ email });
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
        return;
      }

      void trackAnalyticsEvent({
        eventName: 'auth_submitted',
        authAction: 'password_reset',
      });
      await requestPasswordReset(parsed.data);
      setNotice(
        'If a Reclaim account uses that email, a password-reset link has been sent.',
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendConfirmation() {
    if (!pendingConfirmationEmail || isResending) return;

    setFormError(null);
    setNotice(null);
    setIsResending(true);
    try {
      void trackAnalyticsEvent({
        eventName: 'auth_submitted',
        authAction: 'confirmation_resend',
      });
      await resendSignUpConfirmation({ email: pendingConfirmationEmail });
      setNotice('Confirmation email sent again. Check your inbox.');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Confirmation email could not be resent.',
      );
    } finally {
      setIsResending(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setFormError(null);
    setNotice(null);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="caption" tone="secondary">RECLAIM</AppText>
          <AppText variant="display">
            {isSignIn ? 'Welcome back.' : isSignUp ? 'Your next chapter.' : 'Reset your password.'}
          </AppText>
          <AppText tone="secondary">
            {isSignIn
              ? 'Sign in to restore your Reclaim journey.'
              : isSignUp
                ? 'A private place to reclaim your time, health and money.'
                : 'Enter your account email and Reclaim will send a secure recovery link.'}
          </AppText>
        </View>

        <View style={styles.form}>
          {isSignUp ? (
            <Input
              label="Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              editable={!isSubmitting}
              placeholder="Your name"
            />
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isSubmitting}
          />

          {!isForgot ? (
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              textContentType={isSignIn ? 'password' : 'newPassword'}
              secureTextEntry
              editable={!isSubmitting}
            />
          ) : null}

          {formError ? (
            <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
              {formError}
            </AppText>
          ) : null}
          {notice ? (
            <AppText accessibilityLiveRegion="polite" tone="secondary">{notice}</AppText>
          ) : null}

          <Button
            label={
              isSubmitting
                ? 'Please wait…'
                : isSignIn
                  ? 'Sign in'
                  : isSignUp
                    ? 'Create account'
                    : 'Send reset link'
            }
            disabled={isSubmitting || isResending}
            onPress={() => void submit()}
          />

          {isSignIn ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting || isResending}
              onPress={() => changeMode('forgot')}
              style={styles.textAction}
            >
              <AppText tone="secondary">Forgot password?</AppText>
            </Pressable>
          ) : null}

          {pendingConfirmationEmail && isSignIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isResending ? 'Resending confirmation email' : 'Resend confirmation email'}
              disabled={isSubmitting || isResending}
              onPress={() => void resendConfirmation()}
              style={styles.textAction}
            >
              <AppText tone="secondary">
                {isResending ? 'Resending confirmation…' : 'Resend confirmation email'}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {isForgot ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => changeMode('signIn')}
            style={styles.switchMode}
          >
            <AppText tone="secondary">‹ Back to sign in</AppText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || isResending}
            onPress={() => changeMode(isSignIn ? 'signUp' : 'signIn')}
            style={styles.switchMode}
          >
            <AppText tone="secondary">
              {isSignIn ? 'New to Reclaim? ' : 'Already have an account? '}
              <AppText>{isSignIn ? 'Create account' : 'Sign in'}</AppText>
            </AppText>
          </Pressable>
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
  form: {
    gap: spacing.md,
  },
  textAction: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  switchMode: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
});
