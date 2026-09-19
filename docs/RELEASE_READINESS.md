# Release readiness

This document tracks the work required to move Reclaim V2 from a verified development build to store-ready iOS and Android binaries.

## Current release baseline

- App name: Reclaim
- Expo project: @sankalpvoid/reclaim-v2
- EAS project ID: 35a0891e-f3e8-4092-9cc3-75fd929a635f
- iOS bundle identifier: app.reclaim.mobile
- Android package: app.reclaim.mobile
- User-facing version: 0.1.0
- EAS version source: remote
- Production builds: auto-increment developer-facing build numbers
- Native auth deep links: reclaim://**
- Standalone Expo dev client remains the development target.

## Completed foundations

- Authentication, signup confirmation, password recovery and account deletion
- Supabase RLS and pre-launch database hardening
- Privacy-safe analytics and Expo Observe integration
- Accessibility and interaction pass
- Native iOS widget
- Core smoking, cravings, check-ins, insights, goals, community and learning flows
- CI with Expo Doctor, strict TypeScript and tests

## Release blockers

### Branding assets

The repository does not yet contain final release artwork. Before any store build, add and configure:

- 1024x1024 app icon
- Android adaptive-icon foreground artwork
- Android monochrome icon for themed icons
- splash-screen artwork, if Reclaim should show more than the current dark background

Do not use placeholder artwork for a public submission.

### Store and support URLs

Public HTTPS URLs are still required for:

- Privacy Policy
- Support / contact page
- optional product / marketing page

These URLs should be stable before App Store Connect or Play Console metadata is finalized.

### EAS environment variables

Production and preview builds need the existing client-safe Supabase values configured in EAS:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Never place a service-role key in an EAS client environment.

### Auth email delivery

Supabase's built-in email service is suitable for development testing, but production launch should use a custom SMTP provider and branded auth email templates.

### Platform QA

Before public submission:

- run an iOS preview/release build rather than relying only on the dev client
- run Android on an emulator or physical device and complete a parity smoke test
- verify deep links from real email clients on both platforms
- verify notifications and permissions on device
- verify widgets on a release-like iOS build
- decide whether iPad support remains enabled; if yes, include iPad QA and store assets

### Store accounts and signing

Production submission still requires valid Apple Developer / App Store Connect and Google Play Console credentials. EAS can manage signing once those accounts are connected.

## Security status

The current Supabase security advisor has one known warning: leaked-password protection is disabled because the project is on a plan where enabling it requires an upgrade. This is a plan limitation rather than an application-code defect.

The performance advisor currently reports only informational unused-index notices. Do not remove those indexes solely because a low-traffic pre-launch database has not used them yet.

## Release sequence

1. Finalize app icon and splash assets.
2. Publish privacy and support URLs.
3. Configure EAS client-safe environment variables.
4. Configure production SMTP and branded auth emails.
5. Build iOS preview and Android preview binaries.
6. Complete platform parity and deep-link smoke tests.
7. Resolve any release-build-only defects.
8. Set the intended public version (for example 1.0.0 when launch scope is approved).
9. Create production builds with EAS.
10. Submit first to TestFlight / Play internal testing before public review.
