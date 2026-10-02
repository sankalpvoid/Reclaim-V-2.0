import { supabase } from '@/core/supabase/client';
import { cancelAllReclaimReminders } from '@/features/notifications/notificationService';
import {
  emailSchema,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  type EmailInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from '@/features/auth/authSchemas';

const authRedirects = {
  confirmation: 'reclaim://auth-callback',
  passwordRecovery: 'reclaim://reset-password',
} as const;

export async function signInWithPassword(input: SignInInput) {
  const credentials = signInSchema.parse(input);
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data;
}

export async function signUpWithPassword(input: SignUpInput) {
  const { displayName, email, password } = signUpSchema.parse(input);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirects.confirmation,
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function requestPasswordReset(input: EmailInput): Promise<void> {
  const { email } = emailSchema.parse(input);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirects.passwordRecovery,
  });

  if (error) throw error;
}

export async function resendSignUpConfirmation(input: EmailInput): Promise<void> {
  const { email } = emailSchema.parse(input);
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: authRedirects.confirmation,
    },
  });

  if (error) throw error;
}

export async function updatePassword(password: ResetPasswordInput['password']): Promise<void> {
  const parsedPassword = newPasswordSchema.parse(password);
  const { error } = await supabase.auth.updateUser({ password: parsedPassword });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Reminders belong to the signed-in person; best-effort so a notification failure never blocks logout.
  await cancelAllReclaimReminders().catch(() => undefined);
}
