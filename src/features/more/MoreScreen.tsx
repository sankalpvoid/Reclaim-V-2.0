import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { signOut } from '@/features/auth/authService';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

const journeyLabels = {
  quit: 'Quit now',
  reduce: 'Smoke less',
  track: 'Understand my smoking',
} as const;

export function MoreScreen() {
  const { profile } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">MORE</AppText>
          <AppText variant="display">Your Reclaim setup.</AppText>
          <AppText tone="secondary">
            Goals, reminders, and account controls live here so Today can stay focused on the day itself.
          </AppText>
        </View>

        <Card style={styles.card}>
          <AppText variant="caption" tone="secondary">GOALS</AppText>
          <AppText variant="title">What are you reclaiming for?</AppText>
          <AppText tone="secondary">
            Turn money reclaimed from smoking into visible targets without spending or resetting progress.
          </AppText>
          <Button label="Open goals" onPress={() => router.push('/(app)/goals')} />
        </Card>

        <Card style={styles.card}>
          <AppText variant="caption" tone="secondary">REMINDERS</AppText>
          <AppText variant="title">Keep prompts under your control.</AppText>
          <AppText tone="secondary">
            Manage the local daily check-in and weekly reflection reminders on this device.
          </AppText>
          <Button label="Reminder settings" onPress={() => router.push('/(app)/notifications')} />
        </Card>

        <Card style={styles.card}>
          <AppText variant="caption" tone="secondary">ACCOUNT</AppText>
          <AppText variant="title">{profile?.display_name || 'Your Reclaim account'}</AppText>
          {profile?.journey_mode ? (
            <AppText tone="secondary">Journey: {journeyLabels[profile.journey_mode]}</AppText>
          ) : null}
          {signOutError ? <AppText tone="danger">{signOutError}</AppText> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={() => void handleSignOut()}
            style={styles.signOutButton}
          >
            <AppText tone="secondary">{isSigningOut ? 'Signing out…' : 'Sign out'}</AppText>
          </Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  signOutButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
});
