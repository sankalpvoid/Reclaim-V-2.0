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

## Update — cross-user RLS isolation test (2026-10-02)

Method: one atomic `DO` block against the live project, two synthetic users (`@example.invalid`,
random UUIDs) inserted into `auth.users`, JWT claims + `SET LOCAL ROLE authenticated/anon` to
impersonate each, finishing with a deliberate `RAISE EXCEPTION` so the whole statement rolled back.
No schema or policy changes. Afterwards: `auth.users` 26 (unchanged), 0 synthetic users, 0 synthetic rows.

Verified (tables: smoking_events, savings_goals, daily_checkins, notification_preferences, profiles):
- User A can insert and read own rows.
- User B sees 0 of A's rows on every table above.
- User B UPDATE / DELETE against A's rows affects 0 rows.
- User B INSERT with `user_id = A` is rejected by RLS (smoking_events, savings_goals, daily_checkins).
- `anon` gets "permission denied" on smoking_events and profiles.
- Trigger `guard_smoking_event` rejects a +2h `smoked_at` and cigarettes = 500 for a signed-in user.
- A's rows were unchanged after B's attempts.

Not covered: community tables (circle_posts, replies, reports, blocks), learning progress, reduction
plans/reviews, analytics_events, the `delete-account` function, storage. Their policies were inspected
but not write-tested.

## Update — second RLS test, delete-account, app-area review, device checklist (2026-10-02)

### Android build
EAS build `fbdee04c-4ab9-4bee-ac42-2b0ab007bfc0`: **finished**. Preview profile (internal distribution APK), v1.0.0,
versionCode 1, commit `ef1ab9a` (includes the contrast and sign-in fixes; later commits are docs plus the mood-history
error state below). **Suitable for physical-device testing; it has not been installed or run by me.**
APK: https://expo.dev/artifacts/eas/3fY9J1lW6vYsY2oVjNtSfb4jDAyhCAXCAuZ-gLjWN-U.apk
Build `a0427447…` is stale (predates those fixes); ignore it. This build does not include the mood-history change; rebuild before the final device pass.

### 1. VERIFIED (executed, with results)
- `npx tsc --noEmit`, `npx eslint . --max-warnings=0`: pass. `npx vitest run`: 25 files / 111 tests pass.
  `node scripts/validate-release-config.mjs`: pass. `node scripts/audit-gate.mjs`: pass (one accepted advisory above).
- **RLS test 2** (same method as test 1: synthetic `@example.invalid` users, impersonated roles, whole run rolled back by a final
  `RAISE EXCEPTION`; afterwards `auth.users` = 26, 0 synthetic users/circles/challenges/posts):
  - User B (non-moderator) saw 0 rows of A's `saved_posts`, `community_reports`, `user_blocks`, `user_learning_progress`,
    `reduction_plans`, `reduction_reviews`; `analytics_events` gave permission denied (no SELECT policy/grant).
  - B's UPDATE/DELETE against A's posts, replies, cheers, saved posts, blocks, challenge completions, reports, learning progress,
    plans and reviews affected 0 rows, including attempts to set a moderation status.
  - B's INSERT with `user_id`/`reporter_id`/`blocker_id` = A was rejected by RLS on all of those tables and `analytics_events`.
  - Legitimate B actions worked: own post, reply to A's post, report A's post, own analytics event. Invalid `event_name` rejected by CHECK.
  - `anon`: can insert analytics only with `user_id IS NULL`; cannot insert as A; cannot read analytics, posts, replies,
    saved posts, blocks, reports, plans, reviews, completions. `user_learning_progress`/`learning_articles` returned 0 rows (policy block, not grant block).
  - Community posts/cheers/circles/challenges are readable across authenticated users by design.
  - Deleting synthetic A from `auth.users` cascaded to 0 remaining rows in every owned table (DB cascade only).
- Privacy policy URL used in-app responds HTTP 200.

### 2. VERIFIED BY INSPECTION ONLY
- **`delete-account` edge function**: `verify_jwt: true`, v2 ACTIVE; deployed source equals repo source; requires `{confirmation:'DELETE'}`;
  admin client uses Supabase-injected service key (never in the app); deletes `analytics_events` (by anonymous_id link, then user_id),
  then `auth.admin.deleteUser`; the rest cascades (verified in DB above). **Not runtime-verified**: it was never executed, because that
  permanently deletes an account. Needs one run against a throwaway account created in the app.
- App-side deletion (`accountService.ts`): re-authenticates with password, calls the function, parses `{deleted:true}`, cancels local reminders, local sign-out.
- Reminders are local notifications only; permission is requested only when enabling or sending a test; routing from tap goes to check-in / insights.
- Privacy copy matches reality: `expo-observe` is installed and wired, analytics uses fixed event names, no free text sent.
- Learning: loading and error states with retry exist; sources are linked per article; no streak mechanics.
- Mood check-in save is idempotent per local day (`user_id,client_id` upsert).
- More screen hides the Support row when `EXPO_PUBLIC_SUPPORT_EMAIL` is unset (by design; no address invented).

### 3. NOT TESTED
- Any behaviour on a physical device or iOS at all (only old 0.1.0 simulator builds exist; no iOS device build).
- Storage policies, Realtime, leaked-password protection (plan-gated, disabled).
- Real email delivery, confirmation and password-reset deep links.
- `delete-account` runtime (see above).

### 4. BLOCKED / NEEDS MANUAL DEVICE TESTING
- **Offline**: no NetInfo / `onlineManager` / offline banner anywhere. Offline writes fail with a generic error and reads show retry cards. Documented V1 limitation, behaviour must be observed on device.
- iOS device build needs the owner's Apple account and registered device.
- Real support email: not created; Support row stays hidden. Only matters if a store listing requires a contact (not required by `eas.json` or `validate-release-config.mjs`).
- Custom SMTP/templates (default mail is rate-limited), store accounts and review timing.

### Defects found in this pass
- **FIXED (small, functional):** Mood check-in history query failure displayed "0/7 days checked in" and zero counts, which reads as real data. It now shows the existing ErrorCard with retry (`MoodCheckinScreen.tsx`). tsc/eslint/vitest re-run clean.
- **Not fixed, documented:**
  - Mood period buttons lack explicit role/selected state and a full 44pt target (accessibility polish).
  - Learning: if the articles query succeeds with zero rows there is no empty message (blank list under the summary card). Saved/complete is read-then-upsert (benign race on double taps; buttons disable while pending).
  - Quit mode: a lapse restarts the clock, so reclaimed money and avoided counts restart (known product behaviour; best streak is kept).
  - Notification screen: if `profile` has not loaded, the suggestion card is simply absent (no error).
- No schema or RLS defect found; none changed.

### Physical-device test checklist (Android: Redmi A4 5G; iOS: any device once a build exists)
Use a throwaway email account for everything involving deletion. Do not use your real account for the delete test.

1. **Install**: install the APK; app icon and adaptive icon look right in the launcher; splash shows; app opens without crash.
2. **Auth**: sign up, receive confirmation email, tap link (opens app); sign in; wrong password shows an error; forgot password email and reset link; kill and relaunch stays signed in; sign out returns to sign-in and a back gesture cannot re-enter.
3. **Onboarding**: each journey (quit / reduce / track) completes; numbers accept sensible values and reject nonsense; relaunch mid-onboarding resumes correctly.
4. **Smoking logging**: log a cigarette; Undo; Log earlier with a past time; future time cannot be chosen; count and ₹ spend correct with Indian grouping (e.g. ₹1,00,000); quit mode "I had a cigarette" restarts the clock, shows the attempt, keeps best streak; before-quit time rejected.
5. **Dashboard**: Today numbers match logs; focus card changes after a check-in or craving; pull/relaunch keeps data; small screen shows no clipped text.
6. **Cravings**: all four tools open and complete; "How strong is the urge now?" step then "Did that help?" saves; history shows on Today/Insights.
7. **Mood**: save a check-in; saving again the same day updates rather than duplicates; period buttons 7/30 switch; airplane mode then open history shows the retry card (new fix; needs a rebuild).
8. **Notifications**: enable daily reminder, Android permission prompt appears only then; test notification arrives in about 3s with the correct icon; deny permission shows "Blocked" and Open settings works; reminder at the chosen time fires; tapping it opens check-in (weekly opens Insights); sign out and confirm reminders no longer fire.
9. **Savings**: create, edit and remove a goal (quit mode); progress matches reclaimed money; invalid amounts rejected.
10. **Learning**: list loads; open an article; source link opens browser; Save and Complete persist after relaunch; unsaved state after sign-out and sign-in as another user is independent.
11. **Offline / reconnect**: airplane mode on each main screen, confirm no crash and an understandable error; attempt to log offline and note what happens; reconnect and confirm retry or refresh recovers; confirm no duplicate logs after reconnect.
12. **Logout / deletion**: sign out cleans state; then with the throwaway account: More, Privacy, Delete requires correct password and DELETE; account is removed and app returns to sign-in; signing in again fails; check in Supabase the user and rows are gone.
13. **Permissions**: only notifications requested; nothing asked at launch; denying keeps every other feature working.
14. **Privacy**: privacy policy button opens the page; screen text matches the app's behaviour; no personal text appears in analytics (spot check events); Support row appears only when the email env var is set.
15. **Community** (two throwaway accounts): post, reply, report, block; the other account cannot see blocked content; cannot edit or delete the other's content.
16. **General**: rotate, background and resume mid-flow; font scale large; dark mode only (brand); low-battery or data-saver does not break launch.
