import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const signInSchema = emailSchema.extend({
  password: z.string().min(1, 'Enter your password'),
});

export const signUpSchema = emailSchema.extend({
  displayName: z.string().trim().min(1, 'Enter your name').max(80, 'Keep your name under 80 characters'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmation: z.string().min(1, 'Confirm your new password'),
  })
  .refine((value) => value.password === value.confirmation, {
    message: 'Passwords do not match',
    path: ['confirmation'],
  });

export type EmailInput = z.infer<typeof emailSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
