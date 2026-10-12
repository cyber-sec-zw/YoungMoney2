# Cloudflare pilot owner checklist

The short-term pilot uses the Cloudflare Worker, D1, and R2 configuration in `wrangler.jsonc`. It does not use the Supabase administrator function or provisioning script.

1. Follow the one-time deployment steps in [OPERATIONS.md](./OPERATIONS.md).
2. Keep the value of `PILOT_INVITE_CODE` private. Only share it with the fewer-than-10 participants in this pilot.
3. Review account and service usage in the Cloudflare dashboard. Export the app's data backup at least weekly and store it somewhere separate from the deployment.
4. Before the pilot ends, export a final backup and decide where to migrate the data if you move to another backend.

The in-app administrator/member-management functions are not enabled for this D1 pilot. Do not promote accounts by editing D1 rows unless you understand the application schema and have a verified backup.
