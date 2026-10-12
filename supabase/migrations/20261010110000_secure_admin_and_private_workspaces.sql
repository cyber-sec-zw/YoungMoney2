-- Private workspaces and protected administration. This migration is additive
-- and intentionally keeps privileged changes outside the browser client.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_expires_at timestamptz;

UPDATE public.profiles
SET username = lower(regexp_replace(COALESCE(NULLIF(display_name, ''), 'trader'), '[^a-zA-Z0-9_]+', '_', 'g')) || '_' || substring(replace(id::text, '-', '') from 1 for 8)
WHERE username IS NULL OR btrim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  initial_name text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    initial_name,
    lower(regexp_replace(initial_name, '[^a-zA-Z0-9_]+', '_', 'g')) || '_' || substring(replace(NEW.id::text, '-', '') from 1 for 8)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A normal session can edit its profile but cannot grant itself privileges or
  -- reactivate itself. Service-role administration has no auth.uid() and is
  -- deliberately permitted to make these controlled changes.
  IF auth.uid() = OLD.id AND (
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.account_status IS DISTINCT FROM OLD.account_status OR
    NEW.suspended_at IS DISTINCT FROM OLD.suspended_at OR
    NEW.suspension_expires_at IS DISTINCT FROM OLD.suspension_expires_at
  ) THEN
    RAISE EXCEPTION 'Profile privilege fields can only be changed by administration.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_changes();

-- Replace the historical shared-accountability read policies with owner-only
-- access. Other user-owned tables already use auth.uid() ownership policies.
DROP POLICY IF EXISTS "read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "read_all_trades" ON public.trades;
DROP POLICY IF EXISTS "read_all_journal" ON public.journal_entries;
DROP POLICY IF EXISTS "read_all_strategies" ON public.trader_strategies;

DROP POLICY IF EXISTS "read_own_profile" ON public.profiles;
CREATE POLICY "read_own_profile" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND role = 'member' AND account_status = 'active');

DROP POLICY IF EXISTS "read_own_trades" ON public.trades;
CREATE POLICY "read_own_trades" ON public.trades FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "read_own_journal_entries" ON public.journal_entries;
CREATE POLICY "read_own_journal_entries" ON public.journal_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "read_own_strategies" ON public.trader_strategies;
CREATE POLICY "read_own_strategies" ON public.trader_strategies FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Apply one owner-only policy set to every workspace table that carries a
-- user_id. Catalog tables are excluded because they intentionally include
-- system records (with a NULL owner) shared by every workspace.
DO $$
DECLARE
  workspace_table text;
  policy_name text;
BEGIN
  FOR workspace_table IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND c.table_name NOT IN ('profiles', 'market_instruments')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', workspace_table);
    FOR policy_name IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = workspace_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, workspace_table);
    END LOOP;
    EXECUTE format('CREATE POLICY private_read ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', workspace_table);
    EXECUTE format('CREATE POLICY private_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', workspace_table);
    EXECUTE format('CREATE POLICY private_update ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', workspace_table);
    EXECUTE format('CREATE POLICY private_delete ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', workspace_table);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid,
  action text NOT NULL CHECK (action IN ('suspend', 'restore', 'delete', 'delete_failed', 'provision')),
  outcome text NOT NULL CHECK (outcome IN ('success', 'failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_admin_audit_log" ON public.admin_audit_log;
CREATE POLICY "read_admin_audit_log" ON public.admin_audit_log FOR SELECT TO authenticated
USING (public.is_admin());
CREATE INDEX IF NOT EXISTS admin_audit_log_target_created_at_idx ON public.admin_audit_log(target_user_id, created_at DESC);
