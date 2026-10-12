# Operations and recovery

## Database setup

The client depends on the SQL migrations in `supabase/migrations`. Apply them to the same Supabase project configured by `VITE_SUPABASE_URL` before using connected accounts, instruments, plans, testing, or media. Keep the migration history in order; do not apply a later migration while skipping its prerequisites.

If a table is unavailable, the app now reports the affected data area and can use the built-in illustrative instrument catalog where available. A missing table still prevents syncing or saving that table's records. Apply the missing migration, then use the in-app retry action or reload the workspace.

## Local backup and restore

Open the profile menu and choose **Data Backup & Restore**.

- Download a versioned JSON backup containing the signed-in user's rows and private `trading-media` attachments.
- The export lists tables it could not read. A backup with unavailable tables is partial; resolve those schema or access errors and create a fresh backup.
- Restore is limited to the same account and Supabase project because record IDs are used to preserve relationships.
- Restore adds records whose IDs are missing and skips existing IDs. It does not delete rows or replace existing values. If a restore is interrupted, retry the same file.
- Keep a backup outside the device where the app is hosted. The file contains private notes, trade data, account identifiers, and media.

This is a user-operated recovery copy, not a replacement for Supabase project-level backups or point-in-time recovery.

## Weekly provider-source checks

The provider source checker is present as an Edge Function, but this repository does not contain project credentials or a scheduled deployment. To enable it in the target Supabase project:

1. Apply the provider catalog migrations and deploy `check-provider-sources`.
2. Set a long random `SOURCE_CHECKER_TOKEN` as an Edge Function secret. Supabase supplies the function's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime secrets.
3. Schedule a weekly `POST` to `/functions/v1/check-provider-sources` with `Authorization: Bearer <SOURCE_CHECKER_TOKEN>`; the function README gives a Monday 06:00 UTC example.
4. Confirm the run returns `checked`, `changed`, and `failed` counts. Review any generated source-change item manually. The checker records a review item and does not rewrite account rules.

Never put the service-role key or source-check token in the browser bundle, `.env` file committed to source control, or a public schedule URL.
