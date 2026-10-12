CREATE TABLE IF NOT EXISTS public.strategy_entry_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.trader_strategies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_entry_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_own_strategy_entry_models" ON public.strategy_entry_models;
CREATE POLICY "manage_own_strategy_entry_models" ON public.strategy_entry_models FOR ALL TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trader_strategies s WHERE s.id = strategy_id AND s.user_id = auth.uid()))
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trader_strategies s WHERE s.id = strategy_id AND s.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_strategy_entry_models_strategy ON public.strategy_entry_models(strategy_id, created_at);

ALTER TABLE public.strategy_checklist_items
  ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE CASCADE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS checklist_items jsonb;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS entry_model_id uuid REFERENCES public.strategy_entry_models(id) ON DELETE SET NULL;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;
