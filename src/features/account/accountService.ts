import { z } from 'zod';

import { supabase } from '@/core/supabase/client';
import { cancelAllReclaimReminders } from '@/features/notifications/notificationService';

const deleteAccountResponseSchema = z.object({
  deleted: z.literal(true),
});

export async function deleteCurrentAccount(password: string): Promise<void> {
  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    throw new Error('Enter your password to confirm account deletion.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    throw new Error('Your account could not be verified. Sign in again and retry.');
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: normalizedPassword,
  });

  if (reauthError) {
    throw new Error('That password did not verify your account.');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: 'DELETE' },
  });

  if (error) {
    throw new Error('Account deletion could not be completed. Please try again.');
  }

  deleteAccountResponseSchema.parse(data);

  try {
    await cancelAllReclaimReminders();
  } catch {
    // Account deletion is already complete. A stale local reminder should not
    // make the app claim the backend deletion failed.
  }

  // The backend user no longer exists. Clear the local session without
  // depending on a server-side sign-out succeeding for the deleted user.
  await supabase.auth.signOut({ scope: 'local' });
}
