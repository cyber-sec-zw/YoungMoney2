/*
# Multi-Trader Platform: Add User Authentication & Shared Visibility

## Overview
Transforms the single-user trading journal into a multi-trader platform where each user
has their own trades and journal entries, but can view all other traders' stats with
full transparency for analysis and comparison.

## New Tables
- `profiles` — Public trader profiles extending auth.users
  - `id` (uuid, PK, FK to auth.users)
  - `display_name` (text) — trader's display name
  - `avatar_url` (text, nullable) — optional profile picture
  - `bio` (text, nullable) — short bio
  - `trading_style` (text, nullable) — e.g. "Scalper", "Swing Trader"
  - `is_public` (boolean, default true) — whether stats are visible to others
  - `created_at` (timestamptz)

## Modified Tables
- `trades` — Added `user_id uuid` column (nullable initially, set NOT NULL after backfill)
- `journal_entries` — Added `user_id uuid` column (nullable initially, set NOT NULL after backfill)

## Security (RLS)
- `profiles`: All authenticated users can read all profiles. Users can only update/insert their own.
- `trades`: All authenticated users can SELECT all trades. Only owner can INSERT/UPDATE/DELETE.
- `journal_entries`: All authenticated users can SELECT all. Only owner can INSERT/UPDATE/DELETE.

## Important Notes
1. Existing trades/journal_entries will have user_id = NULL until a user signs up
2. After first signup, a migration assigns orphaned trades to that user
3. DEFAULT auth.uid() ensures new inserts get the current user automatically
4. SELECT is shared across all authenticated users (intentional transparency)
5. Write operations are strictly owner-scoped
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text,
  trading_style text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Add user_id to trades (nullable for now)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'user_id') THEN
    ALTER TABLE trades ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Add user_id to journal_entries (nullable for now)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'user_id') THEN
    ALTER TABLE journal_entries ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Set DEFAULT auth.uid() so new rows get the current user
ALTER TABLE trades ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE journal_entries ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add FK constraints (nullable is OK with FK)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'trades_user_id_fkey') THEN
    ALTER TABLE trades ADD CONSTRAINT trades_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'journal_entries_user_id_fkey') THEN
    ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old anon policies and create authenticated-only policies
-- Trades: all authenticated can read (shared visibility)
DROP POLICY IF EXISTS "anon_select_trades" ON trades;
DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
DROP POLICY IF EXISTS "anon_update_trades" ON trades;
DROP POLICY IF EXISTS "anon_delete_trades" ON trades;

DROP POLICY IF EXISTS "read_all_trades" ON trades;
CREATE POLICY "read_all_trades" ON trades FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_trades" ON trades;
CREATE POLICY "insert_own_trades" ON trades FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trades" ON trades;
CREATE POLICY "update_own_trades" ON trades FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trades" ON trades;
CREATE POLICY "delete_own_trades" ON trades FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Journal: all authenticated can read
DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;

DROP POLICY IF EXISTS "read_all_journal" ON journal_entries;
CREATE POLICY "read_all_journal" ON journal_entries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_journal" ON journal_entries;
CREATE POLICY "insert_own_journal" ON journal_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_journal" ON journal_entries;
CREATE POLICY "update_own_journal" ON journal_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_journal" ON journal_entries;
CREATE POLICY "delete_own_journal" ON journal_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
