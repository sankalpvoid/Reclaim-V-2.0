# Reclaim V2

Reclaim V2 is the native-first rebuild of Reclaim for iOS and Android, with web as a secondary surface.

## Architecture

- React Native + Expo
- TypeScript
- Expo Router
- Supabase
- TanStack Query
- Zustand
- Zod
- React Hook Form

V1 remains the behavioural/product reference. Its monolithic frontend architecture is intentionally not being copied into this repository.

## Current phase

Foundation only. Major feature migration, widgets, community, learning/research automation, AI, and payments are intentionally deferred until the base architecture is verified.

## Local setup

```bash
npm install
cp .env.example .env
npm run start
```

For native development builds later, use Expo/EAS rather than designing around Expo Go limitations.
