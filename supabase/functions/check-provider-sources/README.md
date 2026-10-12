# Weekly official-source checks

Deploy this function after applying the provider catalog migration:

```sh
supabase functions deploy check-provider-sources --no-verify-jwt
supabase secrets set SOURCE_CHECKER_TOKEN="<long-random-secret>"
```

The function also uses the project-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. It only reads catalog source URLs, records normalized content hashes, and inserts a review item when a watched page changes. It never edits an account's active rules.

To run weekly, configure a Supabase scheduled Edge Function with this request:

- Method: `POST`
- URL: `https://<project-ref>.supabase.co/functions/v1/check-provider-sources`
- Header: `Authorization: Bearer <SOURCE_CHECKER_TOKEN>`
- Schedule: every Monday at 06:00 UTC

The project has no scheduler configuration or secrets in source control, so deployment must add this schedule in the Supabase project. Confirm that the function responds with `checked`, `changed`, and `failed` counts after setup. Review detected changes against the official source before changing a rule version. See [`docs/OPERATIONS.md`](../../../docs/OPERATIONS.md) for the recovery and setup checklist.
