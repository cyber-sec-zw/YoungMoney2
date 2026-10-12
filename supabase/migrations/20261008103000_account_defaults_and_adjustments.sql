ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS default_strategy_id uuid REFERENCES public.trader_strategies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS challenge_target_pct numeric CHECK (challenge_target_pct IS NULL OR challenge_target_pct >= 0),
  ADD COLUMN IF NOT EXISTS daily_loss_limit_pct numeric CHECK (daily_loss_limit_pct IS NULL OR daily_loss_limit_pct >= 0),
  ADD COLUMN IF NOT EXISTS max_loss_limit_pct numeric CHECK (max_loss_limit_pct IS NULL OR max_loss_limit_pct >= 0),
  ADD COLUMN IF NOT EXISTS challenge_reset_timezone text NOT NULL DEFAULT 'UTC';

CREATE TABLE IF NOT EXISTS public.trading_account_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_account_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_own_account_adjustments" ON public.trading_account_adjustments;
CREATE POLICY "manage_own_account_adjustments" ON public.trading_account_adjustments FOR ALL TO authenticated
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.trading_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
))
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.trading_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
));
CREATE INDEX IF NOT EXISTS idx_account_adjustments_account_date
  ON public.trading_account_adjustments(account_id, created_at DESC);
