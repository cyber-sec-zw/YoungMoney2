# Cloudflare pilot owner checklist

The short-term pilot uses the Cloudflare Worker and D1 configuration in `wrangler.jsonc`. The Supabase administrator function and Supabase provisioning script are legacy and are not used by this deployment.

1. Follow the one-time deployment steps in [OPERATIONS.md](./OPERATIONS.md).
2. Keep the value of `PILOT_INVITE_CODE` private. Only share it with the fewer-than-10 participants in this pilot.
3. Review account and service usage in the Cloudflare dashboard. Export the app's data backup at least weekly and store it encrypted somewhere separate from the deployment. The downloaded JSON backup is not encrypted by the app and may contain private trade notes and attachments.
4. Before the pilot ends, export a final backup and decide where to migrate the data if you move to another backend.

Account Settings includes D1-backed member listing, suspension, restoration, and deletion for non-admin members. Deletion removes the member's D1 records and private media; it is irreversible, so export and verify backups before use. The UI does not promote members to admin. Do not change roles by editing D1 unless you understand the schema and have a verified backup.
