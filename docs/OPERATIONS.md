# Cloudflare pilot operations

This $0 pilot runs as one Cloudflare Worker (`ym-fx`) serving the Vite app and API, with D1 (`trade-journal-pro`) for account and journal records. The default site URL is `https://ym-fx.ethical-hacker263.workers.dev`; a custom domain can be configured in Cloudflare after adding a domain you own. The `supabase` module in the client is a compatibility adapter to this Worker; this deployment does not use a Supabase project. R2 is intentionally not enabled: file attachments are unavailable, while text-based journal capture remains available.

## One-time setup

Requirements: a Cloudflare account, Node.js/npm, and Wrangler authenticated to the intended account (`npx wrangler login`).

1. Confirm the D1 database ID in `wrangler.jsonc` belongs to the database named `trade-journal-pro` in your Cloudflare account. If no database exists yet, create one and update the ID in that file before continuing.
2. Apply the D1 schema:

   ```sh
   npm run cf:migrate
   ```

3. Build and deploy the app and API together:

   ```sh
   npm ci
   npm run cf:deploy
   ```

4. Set a private pilot invite code. Use a unique random value and share it only with the invited participants. Wrangler deploys an updated Worker with this secret:

   ```sh
   npx wrangler secret put PILOT_INVITE_CODE
   ```

Do not commit the invite code or any account credentials. New account creation fails closed until `PILOT_INVITE_CODE` is configured. All participants use the deployed site URL; use the same URL for subsequent backups and restores.

## Administrator account

After deploying and applying the migration, provision the owner account once with `scripts/provision-cloudflare-admin.mjs` using secure environment-variable injection for `ADMIN_EMAIL` and `ADMIN_PASSWORD` (do not type credentials into a command saved in shell history). This writes the initial admin account and its private `Young-Money-Fx` playbook to remote D1, then verifies sign-in against the deployed Worker. The invite code is only for creating participant accounts; use the account password to sign in. Change the administrator's initial password immediately after first login. Member administration is in **Account Settings**.

The app ships with a source-linked provider directory so broker selection works before any catalogue records are seeded into D1. The broker entries are candidates, not regional availability guarantees; verify the provider's legal entity and account type for the trader's location. Prop-firm rule snapshots link to official pages and carry a research date. Unknown or account-specific terms are left unknown, and account snapshots are informational only—not compliance checks or automatic enforcement.

Use `GET /api/health` for a public readiness check; it returns success only while the Worker can query D1.

## Local development

Run `npm run cf:migrate:local` once, then start `npm run cf:dev -- --var PILOT_INVITE_CODE:local-test-invite` in one terminal and `npm run dev` in another. Vite proxies `/api` requests to the local Worker; Wrangler persists test data under the ignored `.wrangler/` directory. Use only synthetic data locally.

## Pilot verification

Before inviting everyone, create two test accounts and verify:

- Each account can sign in, create and edit a trade, and see its own records after signing out and back in.
- One account cannot read or update the other account's records by using the app.
- A downloaded backup can be read, and a restore skips records that already exist.

The app's static instrument catalog is illustrative. Verify instrument contract details with the broker before using calculator estimates for live decisions.

## Backup and recovery

Open the profile menu and choose **Data Backup & Restore**. Export a backup at least weekly and before any deployment that changes the data model. Keep it outside the hosted app and avoid sending it through public channels: it can contain private notes and trade data.

Restore adds missing rows and attachments; it does not replace existing rows or delete records. Restore requires the same account and deployment hostname. Test one restore before depending on this process. This user-operated export is not a substitute for provider-level backup or point-in-time recovery.

## Pilot boundaries

- This is a small-group information-capture pilot, not a production-grade financial or enterprise system.
- Do not store broker passwords, API keys, payment details, or identity documents.
- Keep access limited to invited participants and review D1, Worker, and R2 usage in the Cloudflare dashboard.
- Cloudflare Free limits apply. Requests can fail once a daily D1 allowance is reached. Monitor usage and export records regularly.
- The application currently has no automated email verification, password-reset flow, or operational alerting. Participants should use unique passwords and contact the workspace owner if they lose access.
- Supabase Edge Functions, Supabase storage, and the provider-source checker are not part of this Cloudflare pilot deployment.
