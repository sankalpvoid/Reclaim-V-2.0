import { z } from 'zod';

const emailSchema = z.string().trim().email();

// Set EXPO_PUBLIC_SUPPORT_EMAIL once a real support address exists. Until then the app shows
// no contact row rather than a made-up address.
export function parseSupportEmail(value: string | undefined): string | null {
  const parsed = emailSchema.safeParse(value ?? '');
  return parsed.success ? parsed.data : null;
}

export const supportEmail = parseSupportEmail(process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
