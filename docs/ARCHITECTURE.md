# Reclaim V2 Architecture

## Product boundary

Reclaim V2 is native-first. iOS and Android are Tier 1 products. Web is a secondary authenticated surface. A separate public/SEO content site can be introduced later without making the mobile application depend on a web-first architecture.

## Mandatory stack

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- Supabase
- TanStack Query for server state
- Zustand for genuinely shared client state only
- Zod for runtime validation at important boundaries
- React Hook Form for substantial forms
- GitHub Actions for CI
- EAS for future native build/release workflows

Do not substitute Flutter, Firebase, a PWA-first architecture, or Next.js as the primary application framework without an explicit architecture decision.

## Dependency ownership

Use the smallest correct owner for each kind of state:

- component state: temporary screen/component UI
- React Hook Form: form state
- TanStack Query: server/cloud data and mutations
- Zustand: cross-screen client state that is not server state
- Supabase/Postgres: authoritative persisted product data
- pure domain modules: calculations and behavioural rules

Avoid mirroring the same state into multiple layers.

## Route layer

The `app/` directory is a routing/composition layer, not a business-logic layer.

Route files may:

- compose feature screens
- define navigation/layout
- bind route params
- attach route-level providers when genuinely required

Route files should not contain substantial domain calculations, database query construction, or large reusable UI implementations.

## Feature and domain boundaries

Product functionality should be grouped by coherent capabilities such as:

- auth
- onboarding
- profile
- smoking
- cravings
- mood
- check-ins
- progress
- health
- insights
- goals
- community
- learning
- notifications

A feature should expose a small public surface instead of other features importing its internals freely.

Pure behavioural rules should live under domain modules and must not depend on React Native UI APIs.

## Supabase boundary

Client-safe Supabase configuration may exist in the application. Service-role credentials must never be included in the client.

Authorization remains enforced by RLS and server-side policy, not by hiding controls in the UI.

The V2 client should use supported React Native session persistence rather than V1's browser-oriented manual token lifecycle.

Database changes must eventually be captured as ordered migrations. Production data must not be reset to simplify migration.

## Native boundary

Use React Native/Expo for the application by default. Use native Swift/SwiftUI or Kotlin APIs when a platform capability genuinely requires them, including future widgets or OS integrations.

Bridge custom native behaviour through Expo Modules or another deliberate native boundary. Do not implement native OS features through fragile JavaScript workarounds.

## Learning/research boundary

The mobile application must not crawl the internet or run autonomous research jobs.

Future learning architecture:

trusted sources → discovery → verification → extraction → classification → safety/quality review → Reclaim content store → personalization → client

The client renders processed content and records interactions. Backend services own source verification, scheduled research, transcript/article processing, AI summarization, and ranking logic that should not be exposed to the client.

## File-size guardrail

File size is not a performance metric by itself, but unusually large hand-written modules signal mixed responsibilities.

Guideline:

- common module: 2–10 KB
- complex screen/service: 10–25 KB
- occasional complex module: 25–40 KB
- approaching 50 KB: review responsibilities
- approaching 100 KB: strong architecture smell

No equivalent of V1's ~417 KB `app.js` is acceptable.

## Testing rule

Business rules should be testable without rendering a screen.

Every migrated behavioural area should prefer:

1. pure domain tests
2. integration/query tests where needed
3. component tests for UI behaviour
4. end-to-end tests for critical user journeys

V1 tests are references, not files to copy blindly.

## Privacy rule

Do not casually send free-form behavioural/health-adjacent data to logs, crash reporting, or analytics.

Never log auth tokens or sensitive session material.

Analytics should use an explicit allowlist of structured events/properties.

## Definition of a healthy V2 module

A module is healthy when:

- its purpose is obvious from its path/name
- its inputs and outputs are typed
- it does not reach into unrelated feature internals
- persistent/server state has one clear owner
- important behavioural rules are testable outside UI
- native/platform-specific behaviour is isolated
- it can be changed without understanding the entire application
