# Fast design preview workflow

Reclaim's native UI should be visually reviewed in development clients before creating another standalone release candidate.

Both development-client profiles use the EAS `preview` environment so they receive the same client-safe Supabase values as preview builds.

## iOS Simulator

Build the simulator development client once:

```bash
npx eas-cli@latest build --platform ios --profile development-simulator
```

Install the completed build in the iOS Simulator when EAS offers to do so. If needed later:

```bash
npx eas-cli@latest build:run --platform ios --profile development-simulator --latest
```

For normal design iteration after the client is installed:

```bash
npx expo start --dev-client
```

Open Reclaim in the simulator. JavaScript, copy, spacing, color and most React Native UI changes can then reload without another native build.

Create a new development-client build only when native configuration/plugins/assets change.

## Android physical device

The standard `development` profile creates the Android development client:

```bash
npx eas-cli@latest build --platform android --profile development
```

Install the resulting APK on the test phone.

Then, with the Mac and phone on the same network:

```bash
npx expo start --dev-client
```

If LAN discovery is unreliable, use an Expo-supported tunnel option for the development server rather than changing app code.

## What to review after design changes

Capture screenshots of at least:

1. Sign in / create account
2. Journey choice onboarding
3. Today
4. Craving support
5. Check-in
6. Insights
7. Community
8. Learn
9. More
10. Privacy & account

Also inspect:
- keyboard-open states;
- large text;
- bottom-tab safe area;
- modal/date selector presentation;
- Android back navigation;
- iOS widget separately in a native build.

## Release-style verification

A development client is for fast iteration, not final release validation. Before beta distribution, create the standalone preview/release candidate and repeat the physical-device checklist in `docs/PHYSICAL_DEVICE_QA.md`.
