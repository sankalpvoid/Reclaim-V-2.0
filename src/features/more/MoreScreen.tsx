import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { signOut } from '@/features/auth/authService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BrandMark } from '@/ui/BrandMark';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';

const journeyLabels = {
  quit: 'Quit now',
  reduce: 'Smoke less',
  track: 'Understand my smoking',
} as const;

function SettingsRow({
  eyebrow,
  title,
  detail,
  onPress,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed ? styles.settingsRowPressed : null]}
    >
      <View style={styles.settingsCopy}>
        <AppText variant="micro" tone="tertiary">{eyebrow}</AppText>
        <AppText variant="title">{title}</AppText>
        <AppText variant="caption" tone="secondary">{detail}</AppText>
      </View>
      <AppText variant="title" tone="accent">↗</AppText>
    </Pressable>
  );
}

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
          <BrandMark compact />
          <AppText variant="micro" tone="accent">YOUR SPACE</AppText>
          <AppText variant="display">Reclaim, your way.</AppText>
          <AppText tone="secondary">
            Keep the daily experience focused. Your pace, reminders, privacy and account live here.
          </AppText>
        </View>

        <Card tone="accent" style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText variant="headline" tone="accent">
              {(profile?.display_name || 'R').slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="headline">{profile?.display_name || 'Your Reclaim account'}</AppText>
            <AppText tone="secondary">
              {profile?.journey_mode ? journeyLabels[profile.journey_mode] : 'Choose your own pace'}
            </AppText>
          </View>
        </Card>

        <View style={styles.section}>
          <AppText variant="micro" tone="tertiary">YOUR RECLAIM</AppText>
          <Card style={styles.settingsCard}>
            <SettingsRow
              eyebrow="JOURNEY"
              title={profile?.journey_mode ? journeyLabels[profile.journey_mode] : 'Your pace'}
              detail="Change direction without erasing your history."
              onPress={() => router.push('/(app)/journey')}
            />
            {profile?.journey_mode === 'quit' ? (
              <SettingsRow
                eyebrow="GOALS"
                title="What are you reclaiming for?"
                detail="Turn reclaimed money into visible targets."
                onPress={() => router.push('/(app)/goals')}
              />
            ) : null}
            <SettingsRow
              eyebrow="REMINDERS"
              title="Prompts on your terms"
              detail="Manage daily and weekly reminders on this device."
              onPress={() => router.push('/(app)/notifications')}
            />
            <SettingsRow
              eyebrow="PRIVACY"
              title="Data & account"
              detail="See what Reclaim stores and access permanent deletion."
              onPress={() => router.push('/(app)/privacy')}
            />
          </Card>
        </View>

        <View style={styles.accountSection}>
          <AppText variant="micro" tone="tertiary">ACCOUNT</AppText>
          {signOutError ? (
            <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
              {signOutError}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSigningOut ? 'Signing out' : 'Sign out'}
            accessibilityState={{ disabled: isSigningOut }}
            disabled={isSigningOut}
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && !isSigningOut ? styles.signOutPressed : null,
            ]}
          >
            <AppText tone="secondary">{isSigningOut ? 'Signing out…' : 'Sign out of Reclaim'}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heading: {
    gap: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  settingsCard: {
    paddingVertical: 0,
    paddingHorizontal: spacing.lg,
    gap: 0,
    overflow: 'hidden',
  },
  settingsRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  settingsRowPressed: {
    opacity: 0.72,
  },
  settingsCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  accountSection: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  signOutButton: {
    minHeight: 52,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  signOutPressed: {
    backgroundColor: colors.surfaceRaised,
  },
});
