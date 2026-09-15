# Phase 2: Native onboarding migration

This phase replaces the temporary onboarding shell with the first real V1 product-flow migration.

## V1 behavior preserved

The native flow keeps the same core sequence and language:

1. Choose a pace: `quit`, `reduce`, or `track`.
2. Personalize the plan with name, country, smoking baseline, pack price, and pack size.
3. Quit-now users also choose the date and time their quit journey started.
4. Reduce users receive the same gentle first-target rule as V1: roughly 10% below baseline, at least a one-cigarette step, never automatically below 1/day.
5. Reduce users also get the canonical initial `reduction_plans` snapshot used for later weekly reviews and cross-device restoration.
6. Finish with the "How are you today?" check-in using the existing mood values: `great`, `okay`, `struggling`, or `craving`.
7. Mark `profiles.onboarding_completed` only after the final check-in is stored.

## Native architecture

- `app/(onboarding)/index.tsx` is route-only.
- `OnboardingFlow` owns navigation between onboarding steps.
- Each step is isolated into its own component.
- Validation is centralized in Zod schemas.
- The plan form uses React Hook Form.
- `onboardingService.ts` is the only onboarding module that writes to Supabase.
- The iOS/Android quit-time picker uses Expo UI; web receives a separate lightweight implementation.

## Backend contract

No schema change is required. Phase 2 writes only to existing RLS-protected tables:

- `profiles`
- `reduction_plans` for Reduce users
- `daily_checkins`

The onboarding mood check-in uses the stable UUID client id `00000000-0000-4000-8000-000000000002`. The existing unique index on `(user_id, client_id)` makes retries idempotent; a duplicate insert is treated as an already-completed write.

If the user chooses `quit` or `track` before completing onboarding, any unfinished Reduce-plan snapshot is deleted so the canonical plan matches the selected journey mode.

## Intentional cleanup from V1

For `reduce` and `track`, `quit_date` is stored as `null` rather than inventing a quit timestamp. Quit-specific recovery calculations should only have a quit date when the user chose the quit journey.

The remaining V1 destinations for `struggling` and `craving` moods are not migrated in this phase. The mood is persisted correctly; dedicated support/craving screens will be migrated onto the authenticated shell in a later phase.
