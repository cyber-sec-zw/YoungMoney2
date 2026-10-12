# Cloudflare pilot operations

This pilot runs as one Cloudflare Worker serving the Vite app and API, with D1 for account and journal records and R2 for private screenshots and voice notes. The `supabase` module in the client is a compatibility adapter to this Worker; this deployment does not use a Supabase project.

## One-time setup

Requirements: a Cloudflare account, Node.js/npm, and Wrangler authenticated to the intended account (`npx wrangler login`).

1. Confirm the D1 database ID in `wrangler.jsonc` belongs to the database named `trade-journal-pro` in your Cloudflare account. If no database exists yet, create one and update the ID in that file before continuing.
2. Create the private-media bucket:

   ```sh
   npx wrangler r2 bucket create trade-journal-media
   ```

3. Apply the D1 schema:

   ```sh
   npm run cf:migrate
   ```

4. Build and deploy the app and API together:

   ```sh
   npm ci
   npm run cf:deploy
   ```

5. Set a private pilot invite code. Use a unique random value and share it only with the invited participants. Wrangler deploys an updated Worker with this secret:

   ```sh
   npx wrangler secret put PILOT_INVITE_CODE
   ```

Do not commit the invite code or any account credentials. New account creation fails closed until `PILOT_INVITE_CODE` is configured. All participants use the deployed site URL; use the same URL for subsequent backups and restores.

## Local development

Run `npm run cf:migrate:local` once, then start `npm run cf:dev -- --var PILOT_INVITE_CODE:local-test-invite` in one terminal and `npm run dev` in another. Vite proxies `/api` requests to the local Worker; Wrangler persists test data under the ignored `.wrangler/` directory. Use only synthetic data locally.

## Pilot verification

Before inviting everyone, create two test accounts and verify:

- Each account can sign in, create and edit a trade, and see its own records after signing out and back in.
- One account cannot read or update the other account's records by using the app.
- A screenshot/voice-note upload is visible only to its owner and can be exported with the backup.
- A downloaded backup can be read, and a restore skips records and attachments that already exist.

The app's static instrument catalog is illustrative. Verify instrument contract details with the broker before using calculator estimates for live decisions.

## Backup and recovery

Open the profile menu and choose **Data Backup & Restore**. Export a backup at least weekly and before any deployment that changes the data model. Keep it outside the hosted app and avoid sending it through public channels: it can contain private notes, trade data, account identifiers, and media.

Restore adds missing rows and attachments; it does not replace existing rows or delete records. Restore requires the same account and deployment hostname. Test one restore before depending on this process. This user-operated export is not a substitute for provider-level backup or point-in-time recovery.

## Pilot boundaries

- This is a small-group information-capture pilot, not a production-grade financial or enterprise system.
- Do not store broker passwords, API keys, payment details, or identity documents.
- Keep access limited to invited participants and review D1, Worker, and R2 usage in the Cloudflare dashboard.
- Cloudflare Free limits apply. Requests can fail once a daily D1 allowance is reached; avoid high-volume attachments and export records regularly.
- The application currently has no automated email verification, password-reset flow, or operational alerting. Participants should use unique passwords and contact the workspace owner if they lose access.
- Supabase Edge Functions, Supabase storage, and the provider-source checker are not part of this Cloudflare pilot deployment.
