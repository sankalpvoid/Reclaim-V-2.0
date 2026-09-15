# Reclaim V2

Reclaim V2 is the native-first rebuild of Reclaim for iOS and Android, with web as a secondary product surface.

V1 remains available as the behavioural and product reference. Its monolithic frontend architecture is intentionally not being copied into this repository.

## Stack

- React Native + Expo SDK 57
- TypeScript
- Expo Router
- Supabase
- TanStack Query
- Zustand
- Zod
- React Hook Form
- Vitest for domain/unit tests
- GitHub Actions and EAS as the intended CI/release path

See `docs/ARCHITECTURE.md` and `docs/MIGRATION_INVENTORY.md` before making architectural changes.

## Requirements

Expo SDK 57 requires Node.js 22.13.x or newer.

Check:

```bash
node -v
```

## First local setup

```bash
npm install
npx expo install --fix
npx expo-doctor
npm run typecheck
npm test
```

After dependencies are verified, create local environment configuration:

```bash
cp .env.example .env
```

Populate `.env` with the existing Reclaim Supabase project's client-safe URL and publishable/anon key. Never place a Supabase service-role key in the mobile application.

Then start with a clean Metro cache:

```bash
npx expo start --clear
```

## Current phase

Foundation only.

Major feature migration, auth migration, widgets, community, learning/research automation, AI, payments, and full visual redesign remain intentionally deferred until the foundation passes local verification.

## Current architecture

- `app/` — routing/composition only
- `src/core/` — infrastructure providers and clients
- `src/domain/` — pure product/business rules
- `src/theme/` — semantic design tokens
- `src/ui/` — reusable UI primitives
- `docs/` — architecture and migration decisions

Do not allow product behaviour to accumulate in route files or a replacement monolithic `app.js`.
