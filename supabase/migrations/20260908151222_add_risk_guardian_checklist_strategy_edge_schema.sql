-- ======================= RISK SETTINGS =======================
CREATE TABLE IF NOT EXISTS risk_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  max_daily_loss_pct numeric NOT NULL DEFAULT 3.0,
  max_daily_trades int NOT NULL DEFAULT 5,
  max_risk_per_trade_pct numeric NOT NULL DEFAULT 1.0,
  account_balance numeric NOT NULL DEFAULT 10000,
  max_drawdown_pct numeric NOT NULL DEFAULT 10.0,
  daily_loss_limit_amount numeric,
  created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_risk_settings" ON risk_settings;
CREATE POLICY "select_own_risk_settings" ON risk_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_risk_settings" ON risk_settings;
CREATE POLICY "insert_own_risk_settings" ON risk_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_risk_settings" ON risk_settings;
CREATE POLICY "update_own_risk_settings" ON risk_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_risk_settings" ON risk_settings;
CREATE POLICY "delete_own_risk_settings" ON risk_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_settings_user_id ON risk_settings(user_id);

-- ======================= PRE-TRADE CHECKLIST =======================
CREATE TABLE IF NOT EXISTS pre_trade_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pre_trade_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checklist" ON pre_trade_checklist;
CREATE POLICY "select_own_checklist" ON pre_trade_checklist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checklist" ON pre_trade_checklist;
CREATE POLICY "insert_own_checklist" ON pre_trade_checklist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checklist" ON pre_trade_checklist;
CREATE POLICY "update_own_checklist" ON pre_trade_checklist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checklist" ON pre_trade_checklist;
CREATE POLICY "delete_own_checklist" ON pre_trade_checklist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON pre_trade_checklist(user_id);

-- ======================= TRADES: ADD CHECKLIST COLUMNS =======================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'checklist_items') THEN
    ALTER TABLE trades ADD COLUMN checklist_items jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'checklist_override_reason') THEN
    ALTER TABLE trades ADD COLUMN checklist_override_reason text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'checklist_completed') THEN
    ALTER TABLE trades ADD COLUMN checklist_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Trigger for updated_at on new tables
DROP TRIGGER IF EXISTS risk_settings_updated_at ON risk_settings;
CREATE TRIGGER risk_settings_updated_at BEFORE UPDATE ON risk_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS pre_trade_checklist_updated_at ON pre_trade_checklist;
CREATE TRIGGER pre_trade_checklist_updated_at BEFORE UPDATE ON pre_trade_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();