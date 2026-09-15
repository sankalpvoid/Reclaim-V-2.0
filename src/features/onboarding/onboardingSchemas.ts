import { z } from 'zod';

import { journeyModeSchema } from '../profile/profile';

export const onboardingPlanSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Enter your name').max(80, 'Keep your name under 80 characters'),
    journeyMode: journeyModeSchema,
    quitDate: z.date().nullable(),
    country: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
    cigarettesPerDay: z.coerce
      .number()
      .int('Use a whole number')
      .min(1, 'Enter at least 1 cigarette per day')
      .max(100, 'Enter 100 or fewer cigarettes per day'),
    pricePerPack: z.coerce
      .number()
      .min(0, 'Price cannot be negative')
      .max(1_000_000, 'Price is too large'),
    cigarettesPerPack: z.coerce
      .number()
      .int('Use a whole number')
      .min(1, 'Enter at least 1 cigarette per pack')
      .max(100, 'Enter 100 or fewer cigarettes per pack'),
  })
  .superRefine((value, context) => {
    if (value.journeyMode === 'quit' && !value.quitDate) {
      context.addIssue({
        code: 'custom',
        path: ['quitDate'],
        message: 'Choose when your quit journey started',
      });
    }

    if (value.quitDate && value.quitDate.getTime() > Date.now() + 60_000) {
      context.addIssue({
        code: 'custom',
        path: ['quitDate'],
        message: 'Quit time cannot be in the future',
      });
    }
  });

export const onboardingMoodSchema = z.enum(['great', 'okay', 'struggling', 'craving']);

export type OnboardingPlanInput = z.infer<typeof onboardingPlanSchema>;
export type OnboardingMood = z.infer<typeof onboardingMoodSchema>;
