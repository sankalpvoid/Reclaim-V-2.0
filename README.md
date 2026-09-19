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
- GitHub Actions and EAS for CI and release builds

See `docs/ARCHITECTURE.md`, `docs/MIGRATION_INVENTORY.md`, and `docs/RELEASE_READINESS.md` before making architectural or release changes.

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

Populate `.env` with the existing Reclaim Supabase project's client-safe URL and publishable key. Never place a Supabase service-role key in the mobile application.

The native development target is the standalone Expo dev client, not Expo Go:

```bash
npx expo start --dev-client --clear
```

## Current phase

Phase 19 — release readiness and store/build foundations.

The core product, auth recovery, security/privacy hardening, accessibility, analytics and observability foundations are in place. Current work focuses on production build configuration, store assets and metadata, release-like QA, and iOS/Android parity before any public submission.

## Current architecture

- `app/` — routing/composition only
- `src/core/` — infrastructure providers and clients
- `src/domain/` — pure product/business rules
- `src/theme/` — semantic design tokens
- `src/ui/` — reusable UI primitives
- `docs/` — architecture, migration and release decisions

Do not allow product behaviour to accumulate in route files or a replacement monolithic `app.js`.
