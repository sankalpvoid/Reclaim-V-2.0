# Reclaim V1 → V2 Migration Inventory

This document controls what moves from the existing `sankalpvoid/Reclaim` application into Reclaim V2.

The rule is simple: preserve proven product behaviour and backend protections, not V1 frontend architecture.

## Reuse with minimal change

These assets should remain authoritative unless a migration review finds a concrete defect:

- Supabase PostgreSQL project and production data model
- Row Level Security strategy and existing user-scoped authorization intent
- existing production data
- health-source citations and evidence metadata
- analytics event taxonomy where events remain relevant
- community moderation concepts and server-side authorization rules

Production Supabase must never be reset or destructively rebuilt as part of the frontend migration.

## Port or rewrite cleanly

These concepts are valuable, but their V1 implementation should be moved into typed, testable V2 modules rather than copied wholesale:

- authentication/session lifecycle
- user profile handling
- smoking-event logic
- quit journey calculations
- reduction journey and target calculations
- track journey behaviour
- cravings and coping-tool logic
- check-ins
- mood tracking
- smoke-free elapsed-time calculations
- cigarettes-avoided calculations
- money-reclaimed calculations
- health milestone selection
- goals/dream-goal logic
- personalized insights
- Today/home recommendation logic
- notification decision logic
- analytics client
- cloud synchronization and bootstrap behaviour

Migration pattern for each domain:

1. identify intended V1 behaviour
2. inspect existing tests and data contracts
3. define typed V2 inputs/outputs
4. add/port tests
5. implement the domain module independently of UI
6. build the V2 UI on top of the verified domain/API layer

## Keep as behavioural and UX reference

These areas should inform V2 without forcing the old implementation into the new codebase:

- onboarding sequence and successful copy
- current visual identity and black-first aesthetic
- current navigation concepts
- Today/dashboard presentation ideas
- craving support flows
- health-recovery presentation
- community interactions
- accessibility work and known responsive fixes
- V1 regression and Playwright tests

Where V1 tests encode correct product behaviour, they should become migration specifications.

## Do not carry forward

The following V1 architecture is intentionally retired:

- the ~417 KB handwritten `app.js`
- one global mutable application state object
- manual DOM rendering
- patch-style `*-fix.js`, `*-polish.js`, and equivalent CSS layering
- browser `localStorage` as the primary mobile state/session architecture
- manually owned access/refresh-token lifecycle where the Supabase React Native client can own it safely
- UI accessibility that depends primarily on runtime DOM repair
- feature logic embedded directly in screen rendering code
- direct internet crawling/research logic in the client

## New-only V2 domains

These should be designed natively for V2 rather than backported into V1 first:

- native iOS/Android widgets
- native notification infrastructure
- Live Activities where justified
- `learning` / `understand` content experience
- backend content-research pipeline
- content-source verification and provenance
- personalized educational intervention ranking
- future native platform integrations

## Migration order

Tentative order, subject to verification after the foundation passes locally:

1. foundation + tooling
2. authentication/session persistence
3. profile and onboarding contracts
4. smoking domain and core progress metrics
5. Today/home shell
6. cravings and support tools
7. check-ins and mood
8. health recovery
9. insights/personalization
10. goals
11. community
12. notifications
13. learning/content system
14. widgets/native extensions

Each phase must remain small enough that V1 stays available as the behaviour reference until the equivalent V2 functionality is verified.
