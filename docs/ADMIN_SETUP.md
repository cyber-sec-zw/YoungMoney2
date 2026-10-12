# Administrator setup

The administrator is created outside the browser so no service key or initial password is shipped with the application.

1. Apply `supabase/migrations/20261010110000_secure_admin_and_private_workspaces.sql` to the connected Supabase project.
2. Deploy `supabase/functions/admin-user-management` with the project’s standard Supabase function deployment workflow. Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present in that function’s server environment.
3. In a private terminal, provide the administrator’s email and initial password only as temporary environment variables together with `SUPABASE_SERVICE_ROLE_KEY`, then run:

   ```powershell
   node scripts/provision-young-money-admin.mjs
   ```

The script confirms the email, grants the administrator role, assigns the `young_money` username, and seeds the private editable **Young_Money 1.0** plan, strategy, entry models, rules, and checklists.

Do not add the service-role key or the initial password to `.env`, frontend variables, source files, deployment settings exposed to the browser, screenshots, or logs.
