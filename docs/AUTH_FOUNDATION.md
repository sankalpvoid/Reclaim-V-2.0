# Authentication foundation

Phase 1 connects Reclaim V2 to the existing production Supabase project without changing its database schema.

## Boundaries

- Supabase Auth remains the identity provider.
- `public.profiles` remains the canonical per-user product profile.
- Existing Row Level Security is the authorization boundary. The client never uses a service-role or secret key.
- The existing `on_auth_user_created` trigger creates the user's profile row.
- V1's manual localStorage access/refresh-token lifecycle is not copied.

## Session persistence

The Supabase client persists sessions through a platform adapter:

- iOS / Android: Expo SecureStore.
- Web: browser localStorage, because the web product is secondary and SecureStore is native-only.

Native SecureStore values are chunked so the auth session does not depend on a single large key-value item. The adapter also reads the former unchunked key as a migration fallback.

Supabase auto-refresh is enabled. On native platforms, token refresh starts while the app is active and stops while it is backgrounded.

## App state

`AuthProvider` owns only authentication/session state. Server-backed profile data stays in TanStack Query.

Navigation rules are:

1. No session → `(auth)`.
2. Session + profile with onboarding incomplete → `(onboarding)`.
3. Session + profile with onboarding complete → `(app)`.

The root entry screen waits until session restoration and the first profile lookup are resolved before redirecting.

## Deferred work

This phase intentionally does not add:

- Apple or Google sign-in.
- Password-reset flows.
- Email-confirmation deep-link handling.
- Full onboarding forms.
- Production app screens.
- Database migrations.

Those are separate migrations built on top of this session/profile foundation.
