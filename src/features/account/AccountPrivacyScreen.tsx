import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { deleteCurrentAccount } from '@/features/account/accountService';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Screen } from '@/ui/Screen';

export function AccountPrivacyScreen() {
  const passwordRef = useRef('');
  const confirmationRef = useRef('');
  const [passwordPresent, setPasswordPresent] = useState(false);
  const [confirmationMatches, setConfirmationMatches] = useState(false);
  const [showDeletion, setShowDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (!passwordPresent || !confirmationMatches || isDeleting) return;

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteCurrentAccount(passwordRef.current);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Account deletion could not be completed.',
      );
      setIsDeleting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to More"
          onPress={() => router.back()}
          style={styles.backAction}
        >
          <AppText tone="secondary">‹ More</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="caption" tone="secondary">PRIVACY & ACCOUNT</AppText>
          <AppText variant="display">Your data stays under your control.</AppText>
          <AppText tone="secondary">
            Reclaim uses your account data to power your quit journey. Account deletion permanently
            removes your account and associated Reclaim data.
          </AppText>
        </View>

        <Card style={styles.card}>
          <AppText variant="title">What Reclaim stores</AppText>
          <AppText tone="secondary">
            Your profile, smoking and craving logs, check-ins, goals, learning progress,
            reminder preferences, and community activity are stored in Supabase so your
            experience can work across sessions.
          </AppText>
        </Card>

        <Card style={styles.card}>
          <AppText variant="title">Analytics & crash diagnostics</AppText>
          <AppText tone="secondary">
            V2 product analytics uses fixed event names such as screen views and completed
            actions. It does not send your note text, community post text, email address,
            password, or free-form health content. Technical crash diagnostics are handled
            separately through Expo Observe.
          </AppText>
        </Card>

        <Card style={styles.card}>
          <AppText variant="caption" tone="danger">DANGER ZONE</AppText>
          <AppText variant="title">Delete account</AppText>
          <AppText tone="secondary">
            This is permanent. Your Reclaim account and associated user data will be deleted.
            This cannot be undone.
          </AppText>

          {!showDeletion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start account deletion"
              accessibilityHint="Shows the permanent account deletion confirmation"
              onPress={() => setShowDeletion(true)}
              style={styles.dangerButton}
            >
              <AppText tone="danger">Delete my account</AppText>
            </Pressable>
          ) : (
            <View style={styles.deletionForm}>
              <Input
                label="Current password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                onChangeText={(text) => {
                  passwordRef.current = text;
                  const hasText = text.trim().length > 0;
                  if (hasText !== passwordPresent) setPasswordPresent(hasText);
                }}
              />

              <Input
                label='Type DELETE to confirm'
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={(text) => {
                  confirmationRef.current = text;
                  const matches = text.trim() === 'DELETE';
                  if (matches !== confirmationMatches) setConfirmationMatches(matches);
                }}
              />

              {deleteError ? (
                <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
                  {deleteError}
                </AppText>
              ) : null}

              <Button
                label={isDeleting ? 'Deleting account…' : 'Permanently delete account'}
                accessibilityHint="Permanently deletes this Reclaim account and associated data"
                disabled={!passwordPresent || !confirmationMatches || isDeleting}
                onPress={() => void handleDeleteAccount()}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel account deletion"
                disabled={isDeleting}
                onPress={() => {
                  passwordRef.current = '';
                  confirmationRef.current = '';
                  setPasswordPresent(false);
                  setConfirmationMatches(false);
                  setDeleteError(null);
                  setShowDeletion(false);
                }}
                style={styles.cancelAction}
              >
                <AppText tone="secondary">Cancel</AppText>
              </Pressable>
            </View>
          )}
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
  backAction: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  dangerButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  deletionForm: {
    gap: spacing.md,
  },
  cancelAction: {
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
