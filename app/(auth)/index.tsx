import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  signInWithPassword,
  signUpWithPassword,
} from '@/features/auth/authService';
import { signInSchema, signUpSchema } from '@/features/auth/authSchemas';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

type AuthMode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignIn = mode === 'signIn';

  async function submit() {
    setFormError(null);
    setNotice(null);

    const schema = isSignIn ? signInSchema : signUpSchema;
    const parsed = schema.safeParse({ email, password });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignIn) {
        await signInWithPassword(parsed.data);
      } else {
        const result = await signUpWithPassword(parsed.data);
        if (!result.session) {
          setNotice('Account created. Check your email to confirm it, then sign in.');
          setMode('signIn');
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
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
          <AppText variant="caption" tone="secondary">
            RECLAIM
          </AppText>
          <AppText variant="display">{isSignIn ? 'Welcome back.' : 'Begin again.'}</AppText>
          <AppText tone="secondary">
            {isSignIn
              ? 'Sign in to restore your Reclaim journey.'
              : 'Create your account. Your journey details come next.'}
          </AppText>
        </View>

        <View style={styles.form}>
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

          {formError ? <AppText tone="danger">{formError}</AppText> : null}
          {notice ? <AppText tone="secondary">{notice}</AppText> : null}

          <Button
            label={isSubmitting ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
            disabled={isSubmitting}
            onPress={() => void submit()}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => changeMode(isSignIn ? 'signUp' : 'signIn')}
          style={styles.switchMode}
        >
          <AppText tone="secondary">
            {isSignIn ? 'New to Reclaim? ' : 'Already have an account? '}
            <AppText>{isSignIn ? 'Create account' : 'Sign in'}</AppText>
          </AppText>
        </Pressable>
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
  switchMode: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
});
