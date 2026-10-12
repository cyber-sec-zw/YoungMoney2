/*
# Add strategy-specific checklists and entry/closure media to trades

## What this does

This migration makes the trading journal more logical by:

1. **Strategy-specific checklists** — Instead of one generic pre-trade checklist, each strategy now has its own checklist items. When a trader logs a trade, the checklist that appears is the one attached to the selected strategy.

2. **Separate entry and closure media** — Trades now distinguish between "setup" media (uploaded at entry) and "closure" media (uploaded when the trade is closed). This supports the workflow where a trader records their thought process at entry, then uploads closure screenshots and observations later.

3. **Closure review fields** — What went wrong, observations, and lessons are now specifically tied to the closure phase, since reviewing only makes sense after a trade is closed.

## New Tables
- `strategy_checklist_items` — Checklist items attached to a specific trading strategy
  - `id` (uuid, PK)
  - `strategy_id` (uuid, FK to trader_strategies, ON DELETE CASCADE)
  - `label` (text, not null) — The checklist question/item text
  - `is_required` (boolean, default true) — Whether this item must be checked before proceeding
  - `sort_order` (int, default 0) — Display order
  - `is_active` (boolean, default true) — Soft delete / deactivate
  - `created_at`, `updated_at` (timestamps)

## Modified Tables
- `trades`:
  - `strategy_id` (uuid, nullable, FK to trader_strategies) — Links trade to specific strategy (in addition to the existing `strategy` text field for backward compat)
  - `entry_screenshot_url` (text, nullable) — Setup screenshot uploaded at entry
  - `entry_voice_note_url` (text, nullable) — Voice recording of thought process at entry
  - `closure_screenshot_url` (text, nullable) — Screenshot uploaded at trade closure
  - `closure_voice_note_url` (text, nullable) — Voice note recorded at closure
  - `what_went_wrong` (text, nullable) — Reflection on what went wrong (closure phase)
  - `observations` (text, nullable) — General observations (closure phase)
  
  The existing `screenshot_url`, `voice_note_url`, `lessons`, `notes` columns are preserved for backward compatibility. The new columns are additive.

## Security
- RLS enabled on `strategy_checklist_items`
- Owner-scoped policies: users can only CRUD checklist items for strategies they own (verified through trader_strategies.user_id)
- The existing trades RLS policies cover the new columns automatically

## Important Notes
1. The existing `pre_trade_checklist` table is NOT dropped — it remains for backward compatibility. New strategy-specific checklists live in `strategy_checklist_items`.
2. The existing `screenshot_url` and `voice_note_url` columns on trades are preserved. The UI will use the new columns going forward.
3. All new columns are nullable so existing trades are unaffected.
*/

-- ═══════════════════════════════════════════════════════════════
-- 1. New table: strategy_checklist_items
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS strategy_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES trader_strategies(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE strategy_checklist_items ENABLE ROW LEVEL SECURITY;

-- Index for fetching checklist items by strategy
CREATE INDEX IF NOT EXISTS idx_strategy_checklist_strategy_id ON strategy_checklist_items(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_checklist_active ON strategy_checklist_items(strategy_id, is_active);

-- Policies: owner-scoped through trader_strategies
DROP POLICY IF EXISTS "select_own_strategy_checklist" ON strategy_checklist_items;
CREATE POLICY "select_own_strategy_checklist"
ON strategy_checklist_items FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM trader_strategies WHERE trader_strategies.id = strategy_checklist_items.strategy_id AND trader_strategies.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_strategy_checklist" ON strategy_checklist_items;
CREATE POLICY "insert_own_strategy_checklist"
ON strategy_checklist_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM trader_strategies WHERE trader_strategies.id = strategy_checklist_items.strategy_id AND trader_strategies.user_id = auth.uid())
);

DROP POLICY IF EXISTS "update_own_strategy_checklist" ON strategy_checklist_items;
CREATE POLICY "update_own_strategy_checklist"
ON strategy_checklist_items FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM trader_strategies WHERE trader_strategies.id = strategy_checklist_items.strategy_id AND trader_strategies.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM trader_strategies WHERE trader_strategies.id = strategy_checklist_items.strategy_id AND trader_strategies.user_id = auth.uid())
);

DROP POLICY IF EXISTS "delete_own_strategy_checklist" ON strategy_checklist_items;
CREATE POLICY "delete_own_strategy_checklist"
ON strategy_checklist_items FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM trader_strategies WHERE trader_strategies.id = strategy_checklist_items.strategy_id AND trader_strategies.user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════
-- 2. Add new columns to trades
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'strategy_id') THEN
    ALTER TABLE trades ADD COLUMN strategy_id uuid REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_screenshot_url') THEN
    ALTER TABLE trades ADD COLUMN entry_screenshot_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_voice_note_url') THEN
    ALTER TABLE trades ADD COLUMN entry_voice_note_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'closure_screenshot_url') THEN
    ALTER TABLE trades ADD COLUMN closure_screenshot_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'closure_voice_note_url') THEN
    ALTER TABLE trades ADD COLUMN closure_voice_note_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'what_went_wrong') THEN
    ALTER TABLE trades ADD COLUMN what_went_wrong text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'observations') THEN
    ALTER TABLE trades ADD COLUMN observations text;
  END IF;
END $$;

-- Backfill strategy_id from strategy text field where possible
UPDATE trades t
SET strategy_id = ts.id
FROM trader_strategies ts
WHERE t.strategy = ts.name
  AND t.strategy_id IS NULL
  AND ts.user_id = t.user_id;
