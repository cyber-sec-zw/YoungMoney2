/*
# Trading Journal Schema (single-tenant, no auth)

1. Overview
This migration creates the core tables for a forex trading journal.
The app has no sign-in screen, so it is single-tenant: all data is
shared/local and accessible via the anon key. RLS is enabled on every
table with permissive policies for anon + authenticated.

2. New Tables
- `trades`: the central record of every trade entered.
  - id (uuid PK)
  - pair (text, e.g. EUR/USD) — required
  - direction (text: long/short) — required
  - entry_price (numeric)
  - exit_price (numeric)
  - lot_size (numeric)
  - outcome (text: win/loss/breakeven) — required
  - pnl (numeric, profit/loss in account currency)
  - pips (numeric, result in pips)
  - strategy (text, tag for strategy type)
  - session (text: asian/london/new york/overlap)
  - broker (text, which broker or prop firm)
  - account_type (text: personal/propfirm)
  - entry_time (timestamptz) — required
  - exit_time (timestamptz)
  - risk_percent (numeric)
  - risk_reward_ratio (numeric)
  - emotional_state (text: calm/confident/rushed/frustrated/focused/anxious)
  - setup_quality (int 1-5)
  - mistakes (text[], checklist of mistakes)
  - lessons (text, "what I learned")
  - notes (text, freeform notes)
  - screenshot_url (text, path to uploaded screenshot in storage)
  - voice_note_url (text, path to uploaded voice recording)
  - created_at, updated_at (timestamps)
- `journal_entries`: daily/weekly planning and review notes.
  - id (uuid PK)
  - entry_date (date) — required
  - entry_type (text: daily/weekly/monthly) — required
  - daily_goals (text)
  - weekly_focus (text)
  - pre_market_notes (text)
  - post_session_review (text)
  - trading_plan_checklist (jsonb, array of {label, checked})
  - review_prompts (jsonb, array of {question, answer})
  - mood (text)
  - notes (text)
  - created_at, updated_at
- `ai_summaries`: cached AI-generated summaries so we don't regenerate on every view.
  - id (uuid PK)
  - period_type (text: daily/weekly/monthly)
  - period_start (date)
  - period_end (date)
  - summary (text)
  - suggestions (jsonb, array of strings)
  - patterns (jsonb)
  - comparison (jsonb)
  - trade_count (int)
  - created_at

3. Storage
- A public storage bucket `trade-screenshots` is created for screenshot uploads.
- A public storage bucket `voice-notes` is created for voice recordings.

4. Security
- RLS enabled on trades, journal_entries, ai_summaries.
- Permissive CRUD policies for anon + authenticated (single-tenant, no auth).
- Storage buckets are public for read; inserts allowed for anon + authenticated.
*/

-- ======================= TRADES =======================
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price numeric,
  exit_price numeric,
  lot_size numeric,
  outcome text NOT NULL CHECK (outcome IN ('win', 'loss', 'breakeven')),
  pnl numeric DEFAULT 0,
  pips numeric DEFAULT 0,
  strategy text,
  session text CHECK (session IS NULL OR session IN ('asian', 'london', 'new_york', 'overlap', 'sydney')),
  broker text,
  account_type text CHECK (account_type IS NULL OR account_type IN ('personal', 'propfirm')),
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  risk_percent numeric,
  risk_reward_ratio numeric,
  emotional_state text CHECK (emotional_state IS NULL OR emotional_state IN ('calm', 'confident', 'rushed', 'frustrated', 'focused', 'anxious', 'greedy', 'fearful')),
  setup_quality int CHECK (setup_quality IS NULL OR setup_quality BETWEEN 1 AND 5),
  mistakes text[] DEFAULT '{}',
  lessons text,
  notes text,
  screenshot_url text,
  voice_note_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trades" ON trades;
CREATE POLICY "anon_select_trades" ON trades FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
CREATE POLICY "anon_insert_trades" ON trades FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trades" ON trades;
CREATE POLICY "anon_update_trades" ON trades FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "anon_delete_trades" ON trades FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades (entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades (pair);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON trades (outcome);

-- ======================= JOURNAL ENTRIES =======================
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('daily', 'weekly', 'monthly')),
  daily_goals text,
  weekly_focus text,
  pre_market_notes text,
  post_session_review text,
  trading_plan_checklist jsonb DEFAULT '[]'::jsonb,
  review_prompts jsonb DEFAULT '[]'::jsonb,
  mood text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
CREATE POLICY "anon_select_journal" ON journal_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
CREATE POLICY "anon_insert_journal" ON journal_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
CREATE POLICY "anon_update_journal" ON journal_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;
CREATE POLICY "anon_delete_journal" ON journal_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries (entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries (entry_type);

-- ======================= AI SUMMARIES =======================
CREATE TABLE IF NOT EXISTS ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  summary text,
  suggestions jsonb DEFAULT '[]'::jsonb,
  patterns jsonb DEFAULT '[]'::jsonb,
  comparison jsonb DEFAULT '{}'::jsonb,
  trade_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ai_summaries" ON ai_summaries;
CREATE POLICY "anon_select_ai_summaries" ON ai_summaries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_summaries" ON ai_summaries;
CREATE POLICY "anon_insert_ai_summaries" ON ai_summaries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_summaries" ON ai_summaries;
CREATE POLICY "anon_update_ai_summaries" ON ai_summaries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_summaries" ON ai_summaries;
CREATE POLICY "anon_delete_ai_summaries" ON ai_summaries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_period ON ai_summaries (period_type, period_start DESC);

-- ======================= UPDATED_AT TRIGGER =======================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS journal_entries_updated_at ON journal_entries;
CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================= STORAGE BUCKETS =======================
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to read and upload
DROP POLICY IF EXISTS "anon_read_screenshots" ON storage.objects;
CREATE POLICY "anon_read_screenshots" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'trade-screenshots');

DROP POLICY IF EXISTS "anon_write_screenshots" ON storage.objects;
CREATE POLICY "anon_write_screenshots" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'trade-screenshots');

DROP POLICY IF EXISTS "anon_delete_screenshots" ON storage.objects;
CREATE POLICY "anon_delete_screenshots" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'trade-screenshots');

DROP POLICY IF EXISTS "anon_read_voice_notes" ON storage.objects;
CREATE POLICY "anon_read_voice_notes" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "anon_write_voice_notes" ON storage.objects;
CREATE POLICY "anon_write_voice_notes" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "anon_delete_voice_notes" ON storage.objects;
CREATE POLICY "anon_delete_voice_notes" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'voice-notes');