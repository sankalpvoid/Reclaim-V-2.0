# Store account and signing handoff

Reclaim's store accounts should remain owned by the project owner. Do not share Apple Account passwords, Google passwords, 2FA codes, or private signing credentials in source code or chat.

## Apple: iPhone / TestFlight / App Store

1. Enroll the owning Apple Account in the Apple Developer Program if it is not already enrolled.
2. Sign in to App Store Connect and accept any pending agreements.
3. Create the Reclaim app record using bundle identifier `app.reclaim.mobile`.
4. Keep the Account Holder role with the owner.
5. For human collaborators, App Store Connect users are managed under **Users and Access**. Apple allows Account Holder/Admin/App Manager roles to add users; app-level access can be limited for roles such as App Manager or Developer.
6. For Reclaim's EAS workflow, prefer authenticating the Apple account interactively from the owner's Mac when EAS requests it, or configure an App Store Connect API key if automation is desired. Never commit API private keys to GitHub.
7. First distribution target: TestFlight. Public App Store review comes after TestFlight QA.

### What the Reclaim build process will need

- Active Apple Developer Program membership
- App Store Connect app record for Reclaim
- Bundle ID: `app.reclaim.mobile`
- Signing/certificate access through EAS
- A physical iPhone for final notification and real-email deep-link QA

## Google Play: Android internal testing / production

1. Create or verify the owner's Google Play Console developer account and complete all required developer verification/profile information.
2. Create the Reclaim app with package name `app.reclaim.mobile`.
3. Keep account ownership with the owner.
4. If human collaborators are ever needed, Play Console access is managed under **Users and permissions** and can be limited to a specific app.
5. For automated EAS submission, create/configure the Google service-account credentials required by EAS only when the Play app exists and internal testing is ready. Keep the service-account JSON out of GitHub.
6. First distribution target: Play internal testing. Production rollout follows QA.

### What the Reclaim build process will need

- Verified Google Play developer account
- Reclaim Play Console app record
- Package: `app.reclaim.mobile`
- Play submission credential/service account when EAS submission is enabled
- A physical Android device for final notification and real-email deep-link QA

## Recommended ownership model

The owner should remain the only holder of account passwords and recovery methods. Reclaim can be built and submitted by authenticating EAS from the owner's machine; there is no need to transfer ownership or share passwords with an assistant.

## Final pre-submission order

1. Dedicated Reclaim support email.
2. Production SMTP + branded auth emails.
3. Physical-device auth deep-link and notification QA.
4. Set the intended public version.
5. Create/verify App Store Connect and Play Console app records.
6. Create EAS production builds.
7. Submit to TestFlight and Play internal testing.
8. Resolve beta-only issues, then prepare public store review.
