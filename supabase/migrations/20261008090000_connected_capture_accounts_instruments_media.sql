-- Additive foundation for connected capture. Existing rows remain readable and
-- newly introduced relationships are nullable so legacy records are preserved.

CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL,
  name text NOT NULL,
  account_number text,
  account_type text,
  base_currency text NOT NULL DEFAULT 'USD',
  balance numeric NOT NULL DEFAULT 10000,
  risk_per_trade_pct numeric NOT NULL DEFAULT 1 CHECK (risk_per_trade_pct > 0 AND risk_per_trade_pct <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_trading_accounts" ON public.trading_accounts;
CREATE POLICY "read_own_trading_accounts" ON public.trading_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trading_accounts" ON public.trading_accounts;
CREATE POLICY "insert_own_trading_accounts" ON public.trading_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trading_accounts" ON public.trading_accounts;
CREATE POLICY "update_own_trading_accounts" ON public.trading_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trading_accounts" ON public.trading_accounts;
CREATE POLICY "delete_own_trading_accounts" ON public.trading_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_broker ON public.trading_accounts(user_id, broker_id);

-- Each account row already present in the old broker screen becomes an account
-- under that broker. Preserve its visible account number and type.
INSERT INTO public.trading_accounts (user_id, broker_id, name, account_number, account_type, base_currency, balance, risk_per_trade_pct)
SELECT b.user_id, b.id, COALESCE(NULLIF(b.account_type, ''), 'Trading account'), b.account_number,
       b.account_type, 'USD', COALESCE(rs.account_balance, 10000), COALESCE(rs.max_risk_per_trade_pct, 1)
FROM public.brokers b
LEFT JOIN public.risk_settings rs ON rs.user_id = b.user_id
WHERE b.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.trading_accounts a WHERE a.broker_id = b.id);

INSERT INTO public.trading_accounts (user_id, broker_id, name, base_currency, balance, risk_per_trade_pct)
SELECT p.id, NULL, 'Primary account', 'USD', COALESCE(rs.account_balance, 10000), COALESCE(rs.max_risk_per_trade_pct, 1)
FROM public.profiles p
LEFT JOIN public.risk_settings rs ON rs.user_id = p.id
WHERE NOT EXISTS (SELECT 1 FROM public.trading_accounts a WHERE a.user_id = p.id);

CREATE TABLE IF NOT EXISTS public.market_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  display_name text NOT NULL,
  asset_class text NOT NULL CHECK (asset_class IN ('fx', 'metal', 'index', 'crypto', 'stock', 'future', 'energy', 'agriculture', 'custom')),
  chart_symbol text,
  base_currency text,
  quote_currency text NOT NULL DEFAULT 'USD',
  price_increment numeric NOT NULL DEFAULT 0.0001 CHECK (price_increment > 0),
  price_precision integer NOT NULL DEFAULT 5 CHECK (price_precision BETWEEN 0 AND 10),
  contract_multiplier numeric NOT NULL DEFAULT 1 CHECK (contract_multiplier > 0),
  quantity_unit text NOT NULL DEFAULT 'units',
  example_price numeric,
  example_size numeric NOT NULL DEFAULT 1 CHECK (example_size > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_instruments_user_symbol_key UNIQUE (user_id, symbol)
);
CREATE UNIQUE INDEX IF NOT EXISTS market_instruments_system_symbol_key ON public.market_instruments(symbol) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_market_instruments_owner ON public.market_instruments(user_id, asset_class);
ALTER TABLE public.market_instruments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_market_instruments" ON public.market_instruments;
CREATE POLICY "read_market_instruments" ON public.market_instruments FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_market_instruments" ON public.market_instruments;
CREATE POLICY "insert_own_market_instruments" ON public.market_instruments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_market_instruments" ON public.market_instruments;
CREATE POLICY "update_own_market_instruments" ON public.market_instruments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_market_instruments" ON public.market_instruments;
CREATE POLICY "delete_own_market_instruments" ON public.market_instruments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.instrument_favorites (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.market_instruments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, instrument_id)
);
ALTER TABLE public.instrument_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_own_instrument_favorites" ON public.instrument_favorites;
CREATE POLICY "manage_own_instrument_favorites" ON public.instrument_favorites FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Starter values are deliberately marked as examples in the UI; these are not quotes.
INSERT INTO public.market_instruments
  (symbol, display_name, asset_class, chart_symbol, base_currency, quote_currency, price_increment, price_precision, contract_multiplier, quantity_unit, example_price, example_size)
VALUES
  ('EUR/USD','Euro / US Dollar','fx','FX:EURUSD','EUR','USD',0.0001,5,100000,'lots',1.08500,0.10),
  ('GBP/USD','British Pound / US Dollar','fx','FX:GBPUSD','GBP','USD',0.0001,5,100000,'lots',1.27000,0.10),
  ('USD/JPY','US Dollar / Japanese Yen','fx','FX:USDJPY','USD','JPY',0.01,3,100000,'lots',150.000,0.10),
  ('USD/ZAR','US Dollar / South African Rand','fx','FX:USDZAR','USD','ZAR',0.0001,5,100000,'lots',18.5000,0.10),
  ('AUD/USD','Australian Dollar / US Dollar','fx','FX:AUDUSD','AUD','USD',0.0001,5,100000,'lots',0.66000,0.10),
  ('USD/CAD','US Dollar / Canadian Dollar','fx','FX:USDCAD','USD','CAD',0.0001,5,100000,'lots',1.36000,0.10),
  ('USD/CHF','US Dollar / Swiss Franc','fx','FX:USDCHF','USD','CHF',0.0001,5,100000,'lots',0.90000,0.10),
  ('NZD/USD','New Zealand Dollar / US Dollar','fx','FX:NZDUSD','NZD','USD',0.0001,5,100000,'lots',0.61000,0.10),
  ('EUR/GBP','Euro / British Pound','fx','FX:EURGBP','EUR','GBP',0.0001,5,100000,'lots',0.85000,0.10),
  ('EUR/JPY','Euro / Japanese Yen','fx','FX:EURJPY','EUR','JPY',0.01,3,100000,'lots',162.000,0.10),
  ('GBP/JPY','British Pound / Japanese Yen','fx','FX:GBPJPY','GBP','JPY',0.01,3,100000,'lots',190.000,0.10),
  ('XAU/USD','Gold / US Dollar','metal','OANDA:XAUUSD','XAU','USD',0.01,2,100,'lots',2300.00,0.01),
  ('XAG/USD','Silver / US Dollar','metal','OANDA:XAGUSD','XAG','USD',0.001,3,5000,'lots',28.000,0.01),
  ('US30','Dow Jones CFD','index','CAPITALCOM:US30','USD','USD',1,0,1,'contracts',39000,1),
  ('NAS100','Nasdaq 100 CFD','index','CAPITALCOM:US100','USD','USD',0.1,1,1,'contracts',18000,1),
  ('SPX500','S&P 500 CFD','index','CAPITALCOM:US500','USD','USD',0.1,1,1,'contracts',5200,1),
  ('BTC/USD','Bitcoin / US Dollar','crypto','COINBASE:BTCUSD','BTC','USD',0.01,2,1,'units',65000,0.01),
  ('ETH/USD','Ether / US Dollar','crypto','COINBASE:ETHUSD','ETH','USD',0.01,2,1,'units',3500,0.10),
  ('AAPL','Apple Inc.','stock','NASDAQ:AAPL',NULL,'USD',0.01,2,1,'shares',190,1),
  ('MSFT','Microsoft Corp.','stock','NASDAQ:MSFT',NULL,'USD',0.01,2,1,'shares',420,1),
  ('NVDA','NVIDIA Corp.','stock','NASDAQ:NVDA',NULL,'USD',0.01,2,1,'shares',120,1),
  ('ES','E-mini S&P 500 Futures','future','CME_MINI:ES1!',NULL,'USD',0.25,2,50,'contracts',5200,1),
  ('MES','Micro E-mini S&P 500 Futures','future','CME_MINI:MES1!',NULL,'USD',0.25,2,5,'contracts',5200,1),
  ('NQ','E-mini Nasdaq-100 Futures','future','CME_MINI:NQ1!',NULL,'USD',0.25,2,20,'contracts',18000,1),
  ('CL','WTI Crude Oil Futures','energy','NYMEX:CL1!',NULL,'USD',0.01,2,1000,'contracts',75,1),
  ('GC','Gold Futures','future','COMEX:GC1!',NULL,'USD',0.1,1,100,'contracts',2300,1),
  ('ZC','Corn Futures','agriculture','CBOT:ZC1!',NULL,'USD',0.25,2,50,'contracts',450,1)
ON CONFLICT DO NOTHING;

ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS stop_loss numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS conversion_rate numeric CHECK (conversion_rate IS NULL OR conversion_rate > 0);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS example_values_confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS conversion_rate numeric CHECK (conversion_rate IS NULL OR conversion_rate > 0);
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS example_values_confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public.forward_trades ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS setup_id uuid REFERENCES public.trading_setups(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS setup_id uuid REFERENCES public.trading_setups(id) ON DELETE SET NULL;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS conversion_rate numeric CHECK (conversion_rate IS NULL OR conversion_rate > 0);
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS setup_id uuid REFERENCES public.trading_setups(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.backtest_results ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS setup_id uuid REFERENCES public.trading_setups(id) ON DELETE SET NULL;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS setup_id uuid REFERENCES public.trading_setups(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES public.market_instruments(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE IF EXISTS public.trading_plans ADD COLUMN IF NOT EXISTS screenshot_url text;
ALTER TABLE IF EXISTS public.trading_plans ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.trading_setups ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.strategy_test_sessions ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.strategy_test_trades ADD COLUMN IF NOT EXISTS voice_note_url text;
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS voice_note_url text;

CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_instrument_id ON public.trades(instrument_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_account_id ON public.strategy_test_sessions(account_id);

-- Link legacy symbols to the catalog where the match is unambiguous.
UPDATE public.trades t SET instrument_id = i.id FROM public.market_instruments i
WHERE t.instrument_id IS NULL AND upper(replace(t.pair, ' ', '')) = upper(replace(i.symbol, '/', ''));
UPDATE public.trades t SET instrument_id = i.id FROM public.market_instruments i
WHERE t.instrument_id IS NULL AND upper(t.pair) = upper(i.symbol);

DO $$
BEGIN
  IF to_regclass('public.forward_trades') IS NOT NULL THEN
    EXECUTE $sql$UPDATE public.forward_trades t SET instrument_id = i.id FROM public.market_instruments i
      WHERE t.instrument_id IS NULL AND upper(replace(t.instrument, '/', '')) = upper(replace(i.symbol, '/', ''))$sql$;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_forward_trades_account_id ON public.forward_trades(account_id)';
  END IF;
  IF to_regclass('public.backtest_results') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_backtest_results_account_id ON public.backtest_results(account_id)';
    EXECUTE $sql$UPDATE public.backtest_results t SET instrument_id = i.id FROM public.market_instruments i
      WHERE t.instrument_id IS NULL AND upper(replace(t.instrument, '/', '')) = upper(replace(i.symbol, '/', ''))$sql$;
  END IF;
  IF to_regclass('public.strategy_test_sessions') IS NOT NULL THEN
    EXECUTE $sql$UPDATE public.strategy_test_sessions t SET instrument_id = i.id FROM public.market_instruments i
      WHERE t.instrument_id IS NULL AND t.instrument IS NOT NULL AND upper(replace(t.instrument, '/', '')) = upper(replace(i.symbol, '/', ''))$sql$;
  END IF;
END $$;

-- Private storage for new captures. Existing public media remains available for
-- backward compatibility; new objects are always stored under the owner's UUID.
INSERT INTO storage.buckets (id, name, public)
VALUES ('trading-media', 'trading-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;
DROP POLICY IF EXISTS "read_own_trading_media" ON storage.objects;
CREATE POLICY "read_own_trading_media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trading-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "insert_own_trading_media" ON storage.objects;
CREATE POLICY "insert_own_trading_media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trading-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "update_own_trading_media" ON storage.objects;
CREATE POLICY "update_own_trading_media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'trading-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'trading-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "delete_own_trading_media" ON storage.objects;
CREATE POLICY "delete_own_trading_media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trading-media' AND (storage.foldername(name))[1] = auth.uid()::text);

