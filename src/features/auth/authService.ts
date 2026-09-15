import { supabase } from '@/core/supabase/client';
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from '@/features/auth/authSchemas';

export async function signInWithPassword(input: SignInInput) {
  const credentials = signInSchema.parse(input);
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data;
}

export async function signUpWithPassword(input: SignUpInput) {
  const credentials = signUpSchema.parse(input);
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
