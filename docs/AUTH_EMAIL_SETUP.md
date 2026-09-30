# Production auth email setup

Reclaim's hosted Supabase project must use a custom SMTP provider before public release. The built-in Supabase SMTP service is for development, not production.

## Prepared templates

The repository contains branded templates for:

- Confirm signup: `supabase/templates/confirmation.html`
- Password recovery: `supabase/templates/recovery.html`
- Email change: `supabase/templates/email-change.html`
- Reauthentication: `supabase/templates/reauthentication.html`

They use Supabase's supported Go-template variables such as `{{ .ConfirmationURL }}` and `{{ .Token }}`.

## What is still needed from the account owner

1. Choose an SMTP provider and create the sending account.
2. Prefer a dedicated sender on a domain controlled by Reclaim, for example `auth@your-domain` or `hello@your-domain`.
3. Verify the sending domain and configure the provider's SPF/DKIM/DMARC records.
4. Obtain SMTP host, port, username, password, sender email and sender name.
5. In Supabase Dashboard, configure **Authentication → Emails → SMTP Settings**.
6. In **Authentication → Email Templates**, paste the matching templates from this repository.
7. Disable link/click tracking in the email provider so auth links are not rewritten.
8. Send real confirmation and password-reset emails to test accounts on both iPhone and Android and verify that `reclaim://auth-callback` / password recovery deep links return to the installed app.

Do not commit SMTP credentials to GitHub and do not paste the SMTP password into source code.
