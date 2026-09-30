# App review notes draft

Use this as the basis for App Store Connect review notes and Google Play App Access instructions. Replace placeholders immediately before beta/public submission. Never commit a real reviewer password to this repository.

## Review account

**Email:** `<REVIEW_ACCOUNT_EMAIL>`

**Password:** Provide securely in the relevant store console only. Do not commit it to GitHub.

The review account should:
- have email confirmation completed;
- have onboarding completed;
- contain enough non-sensitive sample activity to make the main Today screen useful;
- not contain real personal/health information;
- be disposable after review.

## What Reclaim does

Reclaim is a smoking behavior-support and tracking app for adults who want to quit smoking, reduce smoking, or understand their smoking patterns.

It supports three journey modes:
1. Quit now
2. Smoke less
3. Understand my smoking

Reclaim is not a medical provider and does not diagnose or treat medical conditions.

## Main review path

1. Sign in with the provided review account.
2. **Today** is the main dashboard.
3. **Insights** shows patterns only when the account has sufficient logged data.
4. **Community** contains user-created posts/replies plus reporting and blocking controls.
5. **Learn** contains educational/supportive content and learning progress.
6. **More** contains journey settings, reminders, privacy/account controls and sign out.

## Craving support

From Today, choose **Craving support**. The reviewer can:
- start a short coping tool;
- log a craving;
- mark whether it was resisted;
- provide simple tool feedback.

The app may use previous tool feedback to prioritize relevant support. It does not generate a diagnosis or treatment recommendation.

## Notifications

Notifications are optional and require device permission.

Reminder Settings is available under:

**More → Reminder settings**

Reclaim currently supports local daily check-in and weekly reflection reminders. Notification taps route back into the relevant Reclaim screen.

## iOS widget

The iPhone build includes a Reclaim widget. Its content depends on journey mode and available log data.

- Quit: glanceable quit progress.
- Reduce: target/logging context when known.
- Track: recent logging context when known.

Missing logging data is not represented as successful progress.

## Account deletion

Permanent in-app account deletion is available at:

**More → Privacy & account → Delete my account**

The flow requires:
1. the current password; and
2. typing `DELETE`.

Deletion removes the Auth account and associated Reclaim user data through the backend deletion flow.

## Privacy policy

Public URL:

https://reclaim-app-tawny.vercel.app/privacy/

The same policy is linked inside **More → Privacy & account**.

## Community moderation

Community content supports:
- reporting;
- blocking;
- reversible engagement actions;
- server-enforced row-level access controls.

If the review account has no community content, the reviewer can still inspect the Community surface after authentication.

## Health-related positioning

Reclaim is a behavior-support and tracking product. Health-recovery milestones are informational and source-backed. The product does not claim to diagnose disease, provide clinical treatment, replace healthcare professionals, or guarantee smoking cessation.

## No payment requirement

The current v1 review scope does not require a purchase, subscription, or external payment to access the core review flows.

## Deep links

Auth uses the native custom scheme:

`reclaim://`

Important routes include email confirmation and password recovery. Real-email client deep-link behavior should be validated on the release candidate before submission.

## Reviewer-contact placeholder

**Support email:** `<RECLAIM_SUPPORT_EMAIL>`

Replace this placeholder in store-console review/contact fields after the dedicated Reclaim support address is created.
