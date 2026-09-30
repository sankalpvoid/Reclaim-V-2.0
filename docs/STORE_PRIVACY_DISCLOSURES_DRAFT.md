# Store privacy / data-safety draft

This document maps the current Reclaim v1 runtime to likely store disclosure categories. It is a preparation aid, not a substitute for checking the exact questions shown by App Store Connect and Google Play at submission time.

## High-level position

- Reclaim does not contain third-party advertising.
- Reclaim does not intentionally track users across other companies' apps or websites for advertising.
- Account-backed product data is used for app functionality and personalization.
- Product analytics use fixed event names and coarse allowlisted properties.
- Free-form health notes, community post text, passwords, and email addresses are not intentionally included in product analytics events.
- Expo-related technical observability is used for diagnostics.
- Account deletion is available in-app and deletes user-owned Reclaim data plus linked product analytics where identifiable by the deletion process.

## Data categories currently processed

### Contact information

**Email address**
- Collected: yes, for authenticated accounts.
- Linked to user: yes.
- Purposes: account creation, authentication, confirmation, recovery, security communications.
- Advertising/tracking: no.

**Display name**
- Collected: yes.
- Linked to user: yes.
- Purposes: account/profile functionality and personalization.
- Advertising/tracking: no.

### Health / wellness-related data

Examples include quit date, smoking events, cigarette counts, reduction targets, cravings, coping-tool feedback, mood/check-ins, and derived progress.

- Collected: yes, when the user chooses to log/use the relevant feature.
- Linked to user: yes for authenticated app data.
- Purposes: app functionality, progress calculations, personalization, insights.
- Advertising/tracking: no.
- Reclaim does not currently read HealthKit or Android Health Connect data.

### User content

Examples include check-in notes and community posts/replies.

- Collected: yes when submitted.
- Linked to user/account internally: yes as required to operate/moderate the feature.
- Purposes: app functionality, community, safety/moderation.
- Product analytics intentionally excludes the free-form text itself.
- Advertising/tracking: no.

### Identifiers

**Authenticated user ID**
- Used to secure and associate account-owned rows.
- Purposes: app functionality, security, analytics association.
- Advertising/tracking: no.

**Anonymous installation analytics ID**
- Used for coarse product analytics before/around authentication.
- Can become associated with an authenticated user for Reclaim analytics.
- Linked anonymous analytics are removed by the account-deletion flow where identifiable.
- Advertising/tracking: no.

### Usage data

Examples: screen viewed, completed actions, coarse engagement events.

- Collected: yes through Reclaim's privacy-limited analytics.
- Purposes: product analytics, reliability, feature improvement.
- Linked to user: can be associated with an authenticated user.
- Advertising/tracking: no.

### Diagnostics

Examples: technical error/crash/performance context through Expo observability.

- Collected: yes as needed for reliability diagnostics.
- Purposes: app functionality, diagnostics.
- Route parameters identified as sensitive are filtered where supported.
- Advertising/tracking: no.

### Other user-provided values

Savings-goal names/amounts and smoking-cost estimates are used to calculate Reclaim progress. They are not bank-account, card, payment, or transaction data.

## Data not currently requested by Reclaim v1

The current app does not intentionally request:
- precise or approximate device location;
- contacts/address book;
- photos or camera library;
- microphone;
- advertising identifier for ad targeting;
- HealthKit / Health Connect;
- payment card or bank credentials.

Recheck this list whenever native permissions or SDKs change.

## Apple privacy-label preparation

Likely disclosure areas to review in App Store Connect:
- Contact Info: Email Address
- Health & Fitness: health/wellness behavior data
- User Content: Other User Content
- Identifiers: User ID
- Usage Data: Product Interaction
- Diagnostics: Crash Data / Performance Data as applicable to the active observability SDK

Purposes are primarily **App Functionality**, **Product Personalization**, and **Analytics**. Reclaim should not select Apple's cross-app **Tracking** purpose unless the runtime changes to perform tracking as Apple defines it.

## Google Play Data safety preparation

Reconfirm every item against the Play Console form. The current architecture should disclose the user/account and health-related information actually collected or processed by Reclaim and its service providers.

Important distinctions for the form:
- Data sent to Supabase / Expo service providers may count as collection/processing even when not sold.
- Reclaim does not sell user data.
- Do not mark health-related data as optional/required without matching the actual UX for the specific field.
- Account deletion is available in-app.
- Use the public privacy policy URL: https://reclaim-app-tawny.vercel.app/privacy/

## Final verification before submission

Compare this draft against:
1. the exact production binary and dependency list;
2. Supabase tables/auth configuration;
3. Expo observability settings;
4. all native permission declarations;
5. the current App Store Connect privacy questionnaire;
6. the current Google Play Data safety and Health apps declaration forms.

If any SDK, permission, analytics property, or data destination changes, update both the policy and store disclosures before submission.
