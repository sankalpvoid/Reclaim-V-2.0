# Reclaim v1 physical-device QA

Run this checklist only on release-style standalone builds. Metro should not be required.

## Test devices

- One physical iPhone on a currently supported iOS version.
- One physical Android phone on a currently supported Android version.
- Use dedicated test accounts. Do not use an account whose data must be preserved for the deletion test.

## Installation and launch

- Install the release candidate through TestFlight / EAS internal distribution on iPhone.
- Install the release candidate through Play internal testing / EAS internal distribution on Android.
- Confirm the app launches from the home screen with Terminal/Metro closed.
- Confirm Reclaim icon, name, splash background and initial routing are correct.
- Force-quit and relaunch at least twice.
- Reboot the device and relaunch once.

## Account creation and email confirmation

- Create a new account using an inbox available on the physical device.
- Open the confirmation email in the device's normal email client.
- Tap the confirmation link.
- Confirm the link opens Reclaim through the `reclaim://auth-callback` route.
- Confirm the app lands in the correct authenticated/onboarding state.
- Repeat the confirmation-link test with the app fully killed before tapping.

## Password recovery

- Sign out.
- Request password recovery.
- Open the recovery email on-device.
- Tap the reset link with Reclaim running once, then repeat with Reclaim killed.
- Set a new password and sign in with it.
- Confirm the old password no longer works.

## Core product smoke test

For a new test account, complete enough onboarding to verify each selected journey mode.

### Quit mode

- Confirm Today renders smoke-free time and progress without layout clipping.
- Complete a mood check-in and confirm Today updates.
- Log a craving, use a coping tool, and record feedback.
- Verify Insights can surface an action once sufficient test data exists.
- Create a savings goal.
- Open Health Recovery.
- Open Learn and mark an article/progress item.
- Open Community and exercise a reversible interaction such as cheer/save.

### Reduce mode

- Switch journey to Reduce.
- Log smoking honestly and verify Today count/target state.
- Confirm the iOS widget, if present, does not treat a missing daily log as a successful zero.
- Confirm the widget shows actual reduce progress after logging.

### Track mode

- Switch journey to Track.
- Log smoking and confirm Today + widget context reflect the log.
- Verify no quit-only savings/health claims are surfaced as if the user had quit.

## Notifications

On both physical devices:

- Open Reminder Settings.
- Trigger notification permission through Reclaim.
- Verify allow/deny behavior is understandable.
- Enable the daily check-in reminder.
- Enable the weekly reflection reminder.
- Send/use the in-app test notification if available.
- Tap a daily reminder and confirm it routes to Check-in.
- Tap a weekly reflection reminder and confirm it routes to Insights.
- Test once with the app foregrounded and once with the app killed.
- Disable reminders and confirm Reclaim no longer schedules them.

## iPhone-only checks

- Confirm Reclaim is offered as an iPhone app, not an iPad-targeted release.
- Add the Reclaim widget.
- Verify small, medium, accessory rectangular and inline families that are available on the test device.
- Confirm the widget deep-links/open behavior is sensible.
- Confirm widget text remains legible in normal and tinted/monochrome system appearances where applicable.

## Android-only checks

- Confirm adaptive icon cropping is correct on the device launcher.
- If themed icons are enabled, confirm the monochrome mark is recognizable.
- Confirm back navigation does not exit unexpectedly from nested Reclaim screens.
- Confirm notification channel/permission behavior matches the Android version on the test device.

## Accessibility spot check

- Increase system text size and inspect Today, auth, Check-in, Craving Support and More.
- Turn on VoiceOver (iPhone) / TalkBack (Android) and navigate the main tabs.
- Confirm controls have understandable labels and disabled states.
- Confirm important error/status messages are announced.
- Verify tap targets remain usable.

## Offline and recovery

- Open Today, then disable network access.
- Navigate among cached screens and confirm failures are understandable.
- Use retry actions while still offline.
- Restore network access and confirm retry recovers without restarting.
- Force-quit while offline, reopen, then restore network and verify recovery.

## Account deletion

Use a disposable test account only.

- Open More → Privacy & account.
- Start account deletion.
- Confirm the password + typed DELETE guard works.
- Enter an incorrect password and verify deletion is rejected.
- Enter the correct password and complete deletion.
- Confirm the app returns to unauthenticated state.
- Confirm the deleted credentials cannot sign back in.
- Confirm scheduled Reclaim reminders are removed from the device.

## Pass criteria

A release candidate passes only when:

- no crash, hard lock, blank screen or unrecoverable auth state occurred;
- auth and recovery links work from real device email clients;
- notifications route correctly on both platforms;
- account deletion completes on a disposable account;
- no high-severity layout/accessibility defect blocks a core flow;
- the final icon/splash/widget assets render correctly on real launchers;
- all discovered defects are either fixed and retested or explicitly accepted before beta expansion.
