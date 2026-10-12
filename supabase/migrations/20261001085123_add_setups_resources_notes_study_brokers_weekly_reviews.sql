/*
# Add tables for Setups, Strategy Testing, Resources, Notes, Study Materials, Brokers, Charting, Weekly Reviews, and Goal Templates

## Overview
This migration creates the following new tables to support the expanded Trading Dashboard:
- `trading_setups` — Documented trading setups with categories, entry/exit criteria, win rate tracking
- `strategy_test_sessions` — Backtesting/forward-testing sessions with metadata
- `strategy_test_trades` — Individual trades within a test session
- `resources` — Resource library (books, videos, articles, courses, tools)
- `notes` — Freeform user notes with tags and pinning
- `study_materials` — Structured study tracker with progress
- `brokers` — Broker account information
- `charting_tools` — Charting tool subscriptions
- `weekly_reviews` — Structured weekly performance reviews
- `goal_templates` — Pre-built goal templates users can clone

## Modifications to existing tables
- `goals` — Add `goal_type` (trading/personal), `priority` (high/medium/low), `progress_notes`, `year` columns
- `goals` — Add `is_template` boolean to support goal templates

## Security
- All tables use RLS with `auth.uid() = user_id` ownership checks
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`
- All `user_id` columns default to `auth.uid()` so inserts work without explicit user_id
*/

-- ═══════════════════════════════════════════════════
-- 1. TRADING SETUPS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trading_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'breakout',
  market_conditions text,
  timeframes text,
  entry_criteria text,
  exit_criteria text,
  example_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trading_setups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_setups" ON trading_setups;
CREATE POLICY "select_own_setups" ON trading_setups FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_setups" ON trading_setups;
CREATE POLICY "insert_own_setups" ON trading_setups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_setups" ON trading_setups;
CREATE POLICY "update_own_setups" ON trading_setups FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_setups" ON trading_setups;
CREATE POLICY "delete_own_setups" ON trading_setups FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 2. STRATEGY TEST SESSIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS strategy_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  strategy_name text,
  instrument text,
  timeframe text,
  test_type text NOT NULL DEFAULT 'backtest',
  start_date date,
  end_date date,
  initial_balance numeric NOT NULL DEFAULT 10000,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_test_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_test_sessions" ON strategy_test_sessions;
CREATE POLICY "select_own_test_sessions" ON strategy_test_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_test_sessions" ON strategy_test_sessions;
CREATE POLICY "insert_own_test_sessions" ON strategy_test_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_test_sessions" ON strategy_test_sessions;
CREATE POLICY "update_own_test_sessions" ON strategy_test_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_test_sessions" ON strategy_test_sessions;
CREATE POLICY "delete_own_test_sessions" ON strategy_test_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 3. STRATEGY TEST TRADES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS strategy_test_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES strategy_test_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'long',
  entry_price numeric NOT NULL,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  position_size numeric,
  pnl numeric NOT NULL DEFAULT 0,
  r_multiple numeric,
  outcome text NOT NULL DEFAULT 'win',
  entry_time timestamptz,
  exit_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_test_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_test_trades" ON strategy_test_trades;
CREATE POLICY "select_own_test_trades" ON strategy_test_trades FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_test_trades" ON strategy_test_trades;
CREATE POLICY "insert_own_test_trades" ON strategy_test_trades FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_test_trades" ON strategy_test_trades;
CREATE POLICY "update_own_test_trades" ON strategy_test_trades FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_test_trades" ON strategy_test_trades;
CREATE POLICY "delete_own_test_trades" ON strategy_test_trades FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategy_test_trades_session ON strategy_test_trades(session_id);

-- ═══════════════════════════════════════════════════
-- 4. RESOURCES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  category text NOT NULL DEFAULT 'article',
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resources" ON resources;
CREATE POLICY "select_own_resources" ON resources FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resources" ON resources;
CREATE POLICY "insert_own_resources" ON resources FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resources" ON resources;
CREATE POLICY "update_own_resources" ON resources FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resources" ON resources;
CREATE POLICY "delete_own_resources" ON resources FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 5. NOTES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  tags text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 6. STUDY MATERIALS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'book',
  status text NOT NULL DEFAULT 'not_started',
  progress integer NOT NULL DEFAULT 0,
  total_units integer,
  completed_units integer NOT NULL DEFAULT 0,
  notes text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_study_materials" ON study_materials;
CREATE POLICY "select_own_study_materials" ON study_materials FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_materials" ON study_materials;
CREATE POLICY "insert_own_study_materials" ON study_materials FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_materials" ON study_materials;
CREATE POLICY "update_own_study_materials" ON study_materials FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_materials" ON study_materials;
CREATE POLICY "delete_own_study_materials" ON study_materials FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 7. BROKERS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_type text,
  account_number text,
  leverage text,
  commission text,
  spread text,
  funding_method text,
  login_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_brokers" ON brokers;
CREATE POLICY "select_own_brokers" ON brokers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_brokers" ON brokers;
CREATE POLICY "insert_own_brokers" ON brokers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_brokers" ON brokers;
CREATE POLICY "update_own_brokers" ON brokers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_brokers" ON brokers;
CREATE POLICY "delete_own_brokers" ON brokers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 8. CHARTING TOOLS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS charting_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  subscription_status text NOT NULL DEFAULT 'active',
  renewal_date date,
  price numeric,
  features text,
  url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE charting_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_charting_tools" ON charting_tools;
CREATE POLICY "select_own_charting_tools" ON charting_tools FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_charting_tools" ON charting_tools;
CREATE POLICY "insert_own_charting_tools" ON charting_tools FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_charting_tools" ON charting_tools;
CREATE POLICY "update_own_charting_tools" ON charting_tools FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_charting_tools" ON charting_tools;
CREATE POLICY "delete_own_charting_tools" ON charting_tools FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 9. WEEKLY REVIEWS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  trades_taken integer NOT NULL DEFAULT 0,
  trades_planned integer NOT NULL DEFAULT 0,
  pnl numeric NOT NULL DEFAULT 0,
  what_went_well text,
  what_went_wrong text,
  lessons_learned text,
  focus_next_week text,
  psychological_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "select_own_weekly_reviews" ON weekly_reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "insert_own_weekly_reviews" ON weekly_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "update_own_weekly_reviews" ON weekly_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "delete_own_weekly_reviews" ON weekly_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 10. GOAL TEMPLATES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS goal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'trading',
  target_metric text,
  target_value numeric,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goal_templates" ON goal_templates;
CREATE POLICY "select_own_goal_templates" ON goal_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goal_templates" ON goal_templates;
CREATE POLICY "insert_own_goal_templates" ON goal_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goal_templates" ON goal_templates;
CREATE POLICY "update_own_goal_templates" ON goal_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goal_templates" ON goal_templates;
CREATE POLICY "delete_own_goal_templates" ON goal_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 11. MODIFY GOALS TABLE — Add new columns
-- ═══════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'goal_type') THEN
    ALTER TABLE goals ADD COLUMN goal_type text NOT NULL DEFAULT 'trading';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'priority') THEN
    ALTER TABLE goals ADD COLUMN priority text NOT NULL DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'progress_notes') THEN
    ALTER TABLE goals ADD COLUMN progress_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'year') THEN
    ALTER TABLE goals ADD COLUMN year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'is_template') THEN
    ALTER TABLE goals ADD COLUMN is_template boolean NOT NULL DEFAULT false;
  END IF;
END $$;
