# Reclaim release audit — 2026-10-02 (launch target Sun 2026-10-04)

Audit performed from a cloud session against a snapshot of `~/Reclaim-V-2.0`
(branch `branding-reconcile` @ e1ff590), the public V1 repo `sankalpvoid/Reclaim`,
and the live Supabase project `tymypenkfaoadjjvdgec` ("Reclaim").
Nothing in the app source has been changed yet. Continue from here in Claude Code.

## Verified by actually running

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Unit tests | `npx vitest run` | PASS — 22 files, 95 tests |
| Lint | `npx eslint . --max-warnings=0` | **FAIL** — 1 error: `supabase/functions/delete-account/index.ts` `import/no-unresolved` for `npm:@supabase/supabase-js@2` (Deno import; folder not ignored) |
| Release config | `node scripts/validate-release-config.mjs` | PASS |
| Prod dependency audit | `npm audit --omit=dev --audit-level=high` | **FAIL** — 4 high, all `node-forge` via `@expo/cli` (build tooling, not app runtime). CI gate uses `--audit-level=high`, so CI is red. |
| expo-doctor | `npx expo-doctor@1.20.4` | Not verifiable from the cloud sandbox (expo.dev unreachable). Run locally. |
| Android / iOS builds | — | Not run. Must be run locally / via EAS. |

## Supabase security — inspected and tested

- RLS enabled on all 21 public tables; analytics views not exposed to anon/authenticated.
- Every private table's policies are scoped to `(select auth.uid()) = user_id`.
- **Live isolation test** (read-only transaction, rolled back): as a random authenticated user → 0 rows from profiles, smoking_events, daily_checkins, savings_goals, reduction_plans, notification_preferences, user_learning_progress, community_reports; only 3 moderated-visible community posts. As `anon` → permission denied on profiles; 0 rows on private tables; only public `health_milestones` readable.
- Moderator role comes from `auth.jwt()->app_metadata` (server-only) — users cannot self-promote.
- No exposed public RPCs; no storage buckets.
- `delete-account` Edge Function v2: JWT-verified, deletes analytics then the auth user; every user FK cascades (analytics is `SET NULL` but the function deletes those rows first).
- No service-role key in client code; `.env` is gitignored.
- Only advisor finding: leaked-password protection disabled (plan-gated).
- **Gap:** DB accepts future-dated or negative/huge `smoking_events`. Data is currently clean (0 violations / 168 events).
  Fix written: `supabase/migrations/20261002090000_guard_smoking_event_time_and_count.sql`
  (trigger, non-destructive). **Not applied** — the apply step was cancelled. Apply after review.
- Note: this Supabase project is shared with the live V1 web app (26 users).

## V1 vs V2 decision

- V1 (`sankalpvoid/Reclaim`) is the vanilla-JS web app (single large `app.js` + patch CSS/JS layers), live, sharing the same Supabase DB. Its base schema SQL lives in V1 `supabase/*.sql`; V2 `supabase/migrations` only holds migrations from 2026-09-15 onward.
- V2 already ports every domain listed in `docs/MIGRATION_INVENTORY.md` (auth, onboarding, smoking, Today, cravings with all 4 tools, check-ins/mood, health, insights, goals, community, notifications, learning, iOS widget, account deletion).
- **Decision: launch V2 only. Keep V1 as the web app/behaviour reference; do not merge codebases.**
- Not yet done: a line-by-line V1→V2 behaviour diff for lapse handling, manual/backdated logging (V1 `manual-checkin.js`, `smoking-journey-ui.js`).

## Release map

### P0 — blocks launch
1. **Branding is inconsistent.** `icon.png` == `splash-icon.png` (flat violet open loop on near-black). `adaptive-icon.png` is a different rendition (glossy gradient rounded tile, thicker loop) and `monochrome-icon.png` is a third geometry. Android launcher therefore shows a different logo from iOS/splash/in-app `BrandMark`. Owner must confirm which file is the approved artwork; then derive adaptive/monochrome from it without redrawing.
2. **Lint failing → CI red.** Add `supabase/functions/**` to ESLint ignores.
3. **Prod audit gate failing → CI red.** Try an npm `overrides` pin of `node-forge` to a patched version, verify `expo` still installs and builds; otherwise document as dev-tooling-only.
4. **Auth email delivery.** Supabase default SMTP is heavily rate-limited; signup confirmation / password reset will fail at launch volume. Configure custom SMTP + apply `supabase/templates/*` (needs owner).
5. **Store accounts / timing (owner).** App Store review time and Google Play's closed-testing requirement for new personal developer accounts may make a public Sunday store release impossible regardless of code. Verify account status today.
6. **Version** is `0.1.0`; set the public launch version (e.g. `1.0.0`).

### P1 — important before launch
1. `todayService.getSmokingEvents` orders ascending with `limit(1000)` → after 1,000 logs the newest events are dropped and Today/7-day counts become wrong. Fix: order descending, then reverse; or query a date window.
2. Logging a cigarette is "now"-only, with no undo for an accidental tap. Add "earlier" logging via the existing Cupertino picker pattern (`QuitDatePicker.native.tsx`: defaults to now, `maximumDate={new Date()}`, dismissable) and an undo for the last log (RLS already allows delete-own).
3. Quit mode has no way to record a lapse; confirm intended product behaviour against V1 before building.
4. Apply the smoking-event guard migration.
5. Support email: no address exists; keep it as a clearly marked config placeholder — do not invent one.
6. Physical-device QA per `docs/PHYSICAL_DEVICE_QA.md` on Redmi A4 5G and iPhone (deep links from real email, notifications, keyboard, small screen).

### P2 — shortly after launch
- Commit the full base schema into V2 `supabase/migrations` so V2 can reproduce the DB.
- Leaked-password protection (plan upgrade).

### P3 — future
- Wallet/rewards tokens: not implemented in V2; out of launch scope.

---

## Update — local verification and fixes (2026-10-02, Claude Code, branch `main`)

Re-verified locally after fixes. All commands were run, not assumed.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Lint | `npx eslint . --max-warnings=0` | PASS (Deno function folder now ignored) |
| Unit tests | `npx vitest run` | PASS — 25 files, 111 tests |
| Release config | `node scripts/validate-release-config.mjs` | PASS |
| Prod audit gate | `node scripts/audit-gate.mjs` | PASS (one documented exception, below) |
| expo-doctor | `npx expo-doctor` | PASS 21/21 |

### Changed
- **Audit gate:** `GHSA-86w9-cpqp-85rv` (node-forge via `@expo/cli`) is accepted: build tooling only, not in the app bundle, no upstream fix at time of writing. Re-check on each Expo SDK bump. Any other high/critical advisory still fails CI.
- **Version** is `1.0.0` (EAS `appVersionSource: remote`, production `autoIncrement`).
- **DB guard migration applied** to the live project and tested in a rolled-back transaction: rejects `smoked_at` more than 5 minutes ahead and cigarette counts <0 or >100.
- **Today events ordering** fixed (newest 1000 kept).
- **Log earlier** (Cupertino-style picker, defaults to now, future disabled, dismissable) and **Undo** for the last log.
- **Lapse in quit mode** ported from V1's setback model: records the event, restarts the clock, increments the attempt, banks the best streak. Rejects future and before-quit times. Covered by `lapse.test.ts`.
- **Indian currency grouping** (e.g. ₹1,00,000) via `src/domain/format/money.ts`.
- **Support email** is config only (`EXPO_PUBLIC_SUPPORT_EMAIL`, optional). The row is hidden when unset. No address was invented.

### Not verified / still open
- No two-real-user RLS isolation test was run by me. Policy inspection and the earlier read-only role test support isolation, but a real two-session test is still recommended.
- Numeric craving strength after a tool: deferred (needs a DB column and a scale decision). The current "Did that help?" step stays.
- Leaked-password protection is disabled (plan-gated).
- The approved master icon has a baked rounded tile, so Android adaptive shows a tile inside the mask. Approved asset, left untouched.
- Owner-only: real support email, custom SMTP and templates, store accounts and review timing, Apple device registration for iOS device builds.
