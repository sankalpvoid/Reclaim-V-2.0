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
- CI with Expo Doctor, strict TypeScript, lint and tests
- CI guards for native release identifiers/EAS configuration and high/critical production dependency vulnerabilities
- Retryable accessible error states for the main data-heavy product surfaces
- Journey-aware iOS widget data for Quit, Reduce and Track modes
- Account deletion removes linked product analytics, including associated anonymous installation analytics
- EAS preview and production environments configured with client-safe Supabase values
- Android parity smoke test completed on Pixel 9 Pro / Android 16
- Android custom-scheme deep-link routing verified with `reclaim://auth-callback`
- Standalone Android EAS preview APK built, installed, authenticated and verified without Metro
- Standalone iOS EAS simulator preview built, installed, authenticated and verified without Metro
- iOS custom-scheme deep-link routing verified with `reclaim://auth-callback`
- Reclaim iOS widget verified in the release-style simulator build

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

### Auth email delivery

Supabase's built-in email service is suitable for development testing, but production launch should use a custom SMTP provider and branded auth email templates.

### Platform QA

Before public submission:

- verify deep links from real email clients on both platforms
- verify notifications and permissions on a physical device
- decide whether iPad support remains enabled; if yes, include iPad QA and store assets

### Store accounts and signing

Production submission still requires valid Apple Developer / App Store Connect and Google Play Console credentials. EAS can manage signing once those accounts are connected.

## Security status

The current Supabase security advisor has one known warning: leaked-password protection is disabled because the project is on a plan where enabling it requires an upgrade. This is a plan limitation rather than an application-code defect.

The latest Supabase advisor pass (September 29, 2026) reports no RLS or database-policy security findings. The only security warning is leaked-password protection being disabled. The performance advisor reports six informational unused-index notices; do not remove those indexes solely because a low-traffic pre-launch database has not used them yet.

The deployed `delete-account` Edge Function is JWT-protected and currently on version 2.

## Release sequence

1. Finalize app icon and splash assets.
2. Publish privacy and support URLs.
3. Configure production SMTP and branded auth emails.
4. Verify real-email auth deep links on both platforms and notifications on a physical device.
5. Decide iPad support and complete any required iPad QA/store assets.
6. Resolve any release-build-only defects.
7. Set the intended public version (for example 1.0.0 when launch scope is approved).
8. Enroll/connect store accounts and create production builds with EAS.
9. Submit first to TestFlight / Play internal testing before public review.
