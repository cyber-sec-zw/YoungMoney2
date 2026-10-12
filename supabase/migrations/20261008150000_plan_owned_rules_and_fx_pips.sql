-- Plan-owned general rules/checks and explicit FX pip metadata.
CREATE TABLE IF NOT EXISTS public.trading_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL,
  rule_text text NOT NULL,
  category text NOT NULL DEFAULT 'discipline' CHECK (category IN ('risk','entry','exit','discipline','news','position_sizing')),
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  times_broken integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_rules
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;

ALTER TABLE public.pre_trade_checklist
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;

ALTER TABLE public.market_instruments
  ADD COLUMN IF NOT EXISTS pip_size numeric CHECK (pip_size IS NULL OR pip_size > 0);

ALTER TABLE public.strategy_test_trades
  ADD COLUMN IF NOT EXISTS setup_quality smallint CHECK (setup_quality BETWEEN 1 AND 5);

-- Keep the minimum tradable quote increment separate from the conventional FX pip.
UPDATE public.market_instruments
SET price_increment = CASE WHEN symbol LIKE '%JPY' THEN 0.001 ELSE 0.00001 END,
    price_precision = CASE WHEN symbol LIKE '%JPY' THEN 3 ELSE 5 END,
    pip_size = CASE WHEN symbol LIKE '%JPY' THEN 0.01 ELSE 0.0001 END,
    tick_value = CASE WHEN symbol LIKE '%JPY' THEN 0.001 ELSE 0.00001 END * contract_multiplier
WHERE asset_class = 'fx';

CREATE INDEX IF NOT EXISTS idx_trading_rules_plan ON public.trading_rules(user_id, plan_id, priority);
CREATE INDEX IF NOT EXISTS idx_pre_trade_checklist_plan ON public.pre_trade_checklist(user_id, plan_id, sort_order);

ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trading_rules_select_own" ON public.trading_rules;
CREATE POLICY "trading_rules_select_own" ON public.trading_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "trading_rules_insert_own" ON public.trading_rules;
CREATE POLICY "trading_rules_insert_own" ON public.trading_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "trading_rules_update_own" ON public.trading_rules;
CREATE POLICY "trading_rules_update_own" ON public.trading_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "trading_rules_delete_own" ON public.trading_rules;
CREATE POLICY "trading_rules_delete_own" ON public.trading_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Guard plan ownership even when a client submits a foreign plan UUID.
CREATE OR REPLACE FUNCTION public.assert_user_owned_plan_link()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.trading_plans p WHERE p.id = NEW.plan_id AND p.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'The selected trading plan does not belong to this user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trading_rules_plan_owner_check ON public.trading_rules;
CREATE TRIGGER trading_rules_plan_owner_check
  BEFORE INSERT OR UPDATE OF plan_id, user_id ON public.trading_rules
  FOR EACH ROW EXECUTE FUNCTION public.assert_user_owned_plan_link();

DROP TRIGGER IF EXISTS pre_trade_checklist_plan_owner_check ON public.pre_trade_checklist;
CREATE TRIGGER pre_trade_checklist_plan_owner_check
  BEFORE INSERT OR UPDATE OF plan_id, user_id ON public.pre_trade_checklist
  FOR EACH ROW EXECUTE FUNCTION public.assert_user_owned_plan_link();

COMMENT ON COLUMN public.trading_rules.plan_id IS 'Nullable for preserved, unassigned legacy rules; new rules should belong to a plan.';
COMMENT ON COLUMN public.pre_trade_checklist.plan_id IS 'Nullable for preserved, unassigned legacy checks; plan checks are separate from strategy/model entry checks.';
COMMENT ON COLUMN public.market_instruments.pip_size IS 'Conventional FX pip size, distinct from the minimum quote/tick increment.';
