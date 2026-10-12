/*
# Add Trader Strategies + Trade Status

1. New Tables
- `trader_strategies` — Stores each trader's custom strategies collected during onboarding
  - id (uuid PK)
  - user_id (uuid FK to auth.users, NOT NULL DEFAULT auth.uid())
  - name (text, NOT NULL) — strategy name e.g. "London Breakout"
  - description (text, nullable) — optional description
  - is_active (boolean, default true)
  - created_at, updated_at (timestamps)

2. Modified Tables
- `trades` — Added `status` column (text: 'open' | 'closed', default 'closed')
  - Added `take_profit` column (numeric, nullable) — TP price for open trades
  - `outcome` is now nullable (open trades don't have an outcome yet)

3. Security
- `trader_strategies`: RLS enabled. Authenticated users can read all strategies (shared visibility).
  Only owner can insert/update/delete their own strategies.
- Existing trades policies updated to remain compatible.

4. Important Notes
- `status` defaults to 'closed' so existing trades remain unchanged
- `outcome` constraint relaxed to allow NULL for open trades
- `take_profit` allows pre-setting TP when entering a trade
*/

-- ======================= TRADER STRATEGIES =======================
CREATE TABLE IF NOT EXISTS trader_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trader_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_strategies" ON trader_strategies;
CREATE POLICY "read_all_strategies" ON trader_strategies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_strategies" ON trader_strategies;
CREATE POLICY "insert_own_strategies" ON trader_strategies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_strategies" ON trader_strategies;
CREATE POLICY "update_own_strategies" ON trader_strategies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_strategies" ON trader_strategies;
CREATE POLICY "delete_own_strategies" ON trader_strategies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON trader_strategies(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trader_strategies_updated_at ON trader_strategies;
CREATE TRIGGER trader_strategies_updated_at BEFORE UPDATE ON trader_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================= TRADES: ADD STATUS + TP =======================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'status') THEN
    ALTER TABLE trades ADD COLUMN status text NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'take_profit') THEN
    ALTER TABLE trades ADD COLUMN take_profit numeric;
  END IF;
END $$;

-- Relax outcome constraint to allow NULL (for open trades)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'outcome') THEN
    ALTER TABLE trades ALTER COLUMN outcome DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);
