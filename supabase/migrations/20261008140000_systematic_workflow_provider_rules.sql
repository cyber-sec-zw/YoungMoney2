-- Systematic workflow foundations. All changes are additive; legacy records are retained.

ALTER TABLE public.trader_strategies
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.trading_plans(id) ON DELETE SET NULL;

ALTER TABLE public.market_instruments
  ADD COLUMN IF NOT EXISTS tick_value numeric CHECK (tick_value IS NULL OR tick_value > 0),
  ADD COLUMN IF NOT EXISTS default_stop_ticks integer NOT NULL DEFAULT 20 CHECK (default_stop_ticks > 0),
  ADD COLUMN IF NOT EXISTS default_target_r numeric NOT NULL DEFAULT 2 CHECK (default_target_r > 0);

-- Existing instruments use price_increment * contract_multiplier as their initial
-- per-quantity tick value. It remains editable because contract terms vary by broker.
UPDATE public.market_instruments
SET tick_value = price_increment * contract_multiplier
WHERE tick_value IS NULL AND contract_multiplier IS NOT NULL;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS capture_mode text NOT NULL DEFAULT 'legacy'
    CHECK (capture_mode IN ('live', 'historical', 'legacy')),
  ADD COLUMN IF NOT EXISTS entry_price_confirmed_actual boolean NOT NULL DEFAULT false;

ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS provider_id text;

ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS broker_account_type text,
  ADD COLUMN IF NOT EXISTS prop_firm_id text,
  ADD COLUMN IF NOT EXISTS prop_program_id uuid,
  ADD COLUMN IF NOT EXISTS prop_phase text,
  ADD COLUMN IF NOT EXISTS provider_region text,
  ADD COLUMN IF NOT EXISTS rule_version_id uuid,
  ADD COLUMN IF NOT EXISTS prop_rule_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.provider_catalog (
  id text PRIMARY KEY,
  provider_kind text NOT NULL CHECK (provider_kind IN ('broker', 'prop_firm')),
  name text NOT NULL,
  website_url text NOT NULL,
  market_group text,
  availability jsonb NOT NULL DEFAULT '{"ZA":"unknown","ZW":"unknown"}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_provider_catalog" ON public.provider_catalog;
CREATE POLICY "authenticated_read_provider_catalog" ON public.provider_catalog
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.provider_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL REFERENCES public.provider_catalog(id) ON DELETE CASCADE,
  offering_kind text NOT NULL CHECK (offering_kind IN ('broker_account_type','prop_program')),
  name text NOT NULL,
  market_group text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  region_code text,
  contracting_entity text,
  source_url text,
  verified_at timestamptz,
  source_status text NOT NULL DEFAULT 'needs_verification' CHECK (source_status IN ('verified','needs_verification','archived')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, offering_kind, name, region_code)
);
ALTER TABLE public.brokers
  ADD CONSTRAINT brokers_provider_catalog_fk FOREIGN KEY (provider_id)
    REFERENCES public.provider_catalog(id) ON DELETE SET NULL;
ALTER TABLE public.provider_offerings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_provider_offerings" ON public.provider_offerings;
CREATE POLICY "authenticated_read_provider_offerings" ON public.provider_offerings
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.prop_firm_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.provider_offerings(id) ON DELETE CASCADE,
  program_name text NOT NULL,
  phase text NOT NULL,
  account_size numeric,
  currency text,
  region_code text,
  contracting_entity text,
  purchase_effective_from timestamptz,
  purchase_effective_until timestamptz,
  effective_from date,
  verified_at timestamptz NOT NULL DEFAULT now(),
  source_urls text[] NOT NULL DEFAULT '{}',
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  rule_status text NOT NULL DEFAULT 'needs_verification' CHECK (rule_status IN ('verified','needs_verification','review_required','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prop_firm_rule_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_prop_firm_rule_versions" ON public.prop_firm_rule_versions;
CREATE POLICY "authenticated_read_prop_firm_rule_versions" ON public.prop_firm_rule_versions
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.trading_accounts
  ADD CONSTRAINT trading_accounts_prop_firm_fk FOREIGN KEY (prop_firm_id)
    REFERENCES public.provider_catalog(id) ON DELETE SET NULL,
  ADD CONSTRAINT trading_accounts_prop_program_fk FOREIGN KEY (prop_program_id)
    REFERENCES public.provider_offerings(id) ON DELETE SET NULL,
  ADD CONSTRAINT trading_accounts_rule_version_fk FOREIGN KEY (rule_version_id)
    REFERENCES public.prop_firm_rule_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.provider_source_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL REFERENCES public.provider_catalog(id) ON DELETE CASCADE,
  offering_id uuid REFERENCES public.provider_offerings(id) ON DELETE CASCADE,
  source_url text NOT NULL UNIQUE,
  content_hash text,
  etag text,
  last_modified text,
  last_checked_at timestamptz,
  last_change_detected_at timestamptz,
  check_status text NOT NULL DEFAULT 'pending' CHECK (check_status IN ('pending','ok','changed','error')),
  last_error text
);
ALTER TABLE public.provider_source_watches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_provider_source_watches" ON public.provider_source_watches;
CREATE POLICY "authenticated_read_provider_source_watches" ON public.provider_source_watches
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.provider_change_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_watch_id uuid NOT NULL REFERENCES public.provider_source_watches(id) ON DELETE CASCADE,
  provider_id text NOT NULL REFERENCES public.provider_catalog(id) ON DELETE CASCADE,
  offering_id uuid REFERENCES public.provider_offerings(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  previous_hash text,
  current_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  reviewer_note text,
  reviewed_at timestamptz
);
ALTER TABLE public.provider_change_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_provider_change_reviews" ON public.provider_change_reviews;
CREATE POLICY "authenticated_read_provider_change_reviews" ON public.provider_change_reviews
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_provider_offerings_provider ON public.provider_offerings(provider_id, offering_kind, is_active);
CREATE INDEX IF NOT EXISTS idx_prop_rule_versions_offering ON public.prop_firm_rule_versions(offering_id, verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_trader_strategies_plan_id ON public.trader_strategies(plan_id);

-- Verified account types, limited to official pages available at migration time.
INSERT INTO public.provider_catalog (id, provider_kind, name, website_url, market_group)
VALUES
('exness','broker','Exness','https://www.exness.com/','forex_cfd'),
('deriv','broker','Deriv','https://deriv.com/','multi_asset')
ON CONFLICT (id) DO NOTHING;

UPDATE public.market_instruments SET example_price = 4064.00 WHERE symbol IN ('XAU/USD','XAUUSD');
UPDATE public.market_instruments SET example_price = 29750.0 WHERE symbol IN ('NAS100','USTECH');

INSERT INTO public.provider_offerings (provider_id, offering_kind, name, market_group, details, source_url, verified_at, source_status)
VALUES
('exness','broker_account_type','Standard','forex_cfd','{"execution":"Market","commission":"No commission","min_lot":0.01,"source_note":"Availability and specifications depend on contracting entity and country."}', 'https://www.exness.com/standard-accounts/', '2026-10-08', 'verified'),
('exness','broker_account_type','Standard Cent','forex_cfd','{"execution":"Market","commission":"No commission","source_note":"Availability and specifications depend on contracting entity and country."}', 'https://www.exness.com/standard-accounts/', '2026-10-08', 'verified'),
('exness','broker_account_type','Pro','forex_cfd','{"execution":"Instant for some CFDs; market for crypto","commission":"No commission","min_lot":0.01,"source_note":"Availability and specifications depend on contracting entity and country."}', 'https://www.exness.com/pro-accounts/', '2026-10-08', 'verified'),
('exness','broker_account_type','Zero','forex_cfd','{"execution":"Market","commission":"Variable by instrument","min_lot":0.01,"source_note":"Availability and specifications depend on contracting entity and country."}', 'https://www.exness.com/pro-accounts/', '2026-10-08', 'verified'),
('exness','broker_account_type','Raw Spread','forex_cfd','{"execution":"Market","commission":"Variable by instrument","min_lot":0.01,"source_note":"Availability and specifications depend on contracting entity and country."}', 'https://www.exness.com/pro-accounts/', '2026-10-08', 'verified'),
('deriv','broker_account_type','Standard MT5','forex_cfd','{"commission":"No commission on listed MT5 markets","source_note":"Deriv account types vary by platform, product, country and contracting entity."}', 'https://deriv.com/trading-platforms/deriv-mt5', '2026-10-08', 'verified'),
('deriv','broker_account_type','Zero Spread MT5','forex_cfd','{"source_note":"Confirm availability, symbols and costs for the user's Deriv entity."}', 'https://deriv.com/trading-platforms/deriv-mt5', '2026-10-08', 'verified'),
('deriv','broker_account_type','Swap-Free MT5','forex_cfd','{"source_note":"Confirm eligible instruments and account entity before use."}', 'https://deriv.com/trading-platforms/deriv-mt5', '2026-10-08', 'verified'),
('deriv','broker_account_type','Financial MT5','forex_cfd','{"source_note":"Confirm availability and contract specifications for the user's Deriv entity."}', 'https://deriv.com/trading-platforms/deriv-mt5', '2026-10-08', 'verified'),
('deriv','broker_account_type','Gold MT5','forex_cfd','{"source_note":"Confirm availability and contract specifications for the user's Deriv entity."}', 'https://deriv.com/trading-platforms/deriv-mt5', '2026-10-08', 'verified')
ON CONFLICT (provider_id, offering_kind, name, region_code) DO UPDATE
SET details = EXCLUDED.details, source_url = EXCLUDED.source_url, verified_at = EXCLUDED.verified_at, source_status = EXCLUDED.source_status;

-- Verified official program names. Only the rule versions below carry numeric
-- rules into automatic checks; other offerings remain descriptive until verified.
INSERT INTO public.provider_offerings (provider_id, offering_kind, name, market_group, details, source_url, verified_at, source_status)
VALUES
('ftmo','prop_program','FTMO Challenge 2-Step','forex_cfd','{"phases":["Challenge","Verification","FTMO Account"],"account_sizes":[10000,25000,50000,100000,200000]}','https://ftmo.com/en/trading-objectives/','2026-10-08','verified'),
('ftmo','prop_program','FTMO Challenge 1-Step','forex_cfd','{"source_note":"Rule changes announced for new orders from 2026-10-12; verify the applicable order date."}','https://ftmo.com/en/trading-objectives/','2026-10-08','verified'),
('the5ers','prop_program','High Stakes','forex_cfd','{"rule_parameters":"See official current program page; options may change."}','https://the5ers.com/high-stakes/','2026-10-08','verified'),
('the5ers','prop_program','Bootcamp','forex_cfd','{"rule_parameters":"See official current program page; options may change."}','https://the5ers.com/bootcamp/','2026-10-08','verified'),
('the5ers','prop_program','Hyper Growth / ProGrowth','forex_cfd','{"rule_parameters":"See official current program page; options may change."}','https://the5ers.com/hyper-growth/','2026-10-08','verified'),
('fundednext','prop_program','Stellar 2-Step','forex_cfd','{"phase_targets_pct":[8,5],"source_note":"Purchase date and region can change terms."}','https://help.fundednext.com/en/articles/9434280-what-s-the-difference-between-challenge-and-fundednext-accounts','2026-07-17','verified'),
('fundednext','prop_program','Stellar 1-Step','forex_cfd','{"source_note":"Verify current account-specific targets and loss limits before applying."}','https://fundednext.com/','2026-10-08','needs_verification'),
('fundednext','prop_program','Stellar Lite','forex_cfd','{"source_note":"Verify current account-specific targets and loss limits before applying."}','https://fundednext.com/','2026-10-08','needs_verification'),
('fundednext','prop_program','Stellar Instant','forex_cfd','{"challenge_phase":false,"source_note":"Verify current instant-account rules and region."}','https://help.fundednext.com/en/articles/11641098-how-does-the-stellar-instant-account-differ-from-challenge-based-accounts','2026-02-23','verified'),
('fundednext','prop_program','Futures Rapid Pro / Daily','futures','{"sizes":[25000,50000,100000,150000],"source_note":"Rapid and Bolt products have purchase availability restrictions; only verify currently purchasable offerings."}','https://helpfutures.fundednext.com/en/articles/14255818-what-types-and-sizes-of-challenges-are-available-at-fundednext-futures','2026-07-10','verified'),
('fundednext','prop_program','Futures Legacy','futures','{"sizes":[25000,50000,100000,150000]}','https://helpfutures.fundednext.com/en/articles/14255818-what-types-and-sizes-of-challenges-are-available-at-fundednext-futures','2026-07-10','verified'),
('fundednext','prop_program','Futures Flex','futures','{"sizes":[25000,50000,100000,150000]}','https://helpfutures.fundednext.com/en/articles/14255818-what-types-and-sizes-of-challenges-are-available-at-fundednext-futures','2026-07-10','verified'),
('topstep','prop_program','Trading Combine','futures','{"phases":["Trading Combine","Express Funded Account","Live Funded Account"],"sizes":[50000,100000,150000]}','https://help.topstep.com/en/articles/8284197-trading-combine-parameters','2026-10-08','verified'),
('e8-markets','prop_program','E8 Signature Classic / Futures','forex_cfd_futures','{"sizes":[25000,50000,100000,150000],"purchase_cutoff":"2026-10-01T19:00:00+02:00"}','https://helpfutures.e8markets.com/en/articles/11755943-e8-signature','2026-10-08','verified')
ON CONFLICT (provider_id, offering_kind, name, region_code) DO UPDATE
SET details = EXCLUDED.details, source_url = EXCLUDED.source_url, verified_at = EXCLUDED.verified_at, source_status = EXCLUDED.source_status;

INSERT INTO public.prop_firm_rule_versions
  (offering_id, program_name, phase, currency, region_code, purchase_effective_until, effective_from, verified_at, source_urls, rules, rule_status)
SELECT o.id, 'FTMO Challenge 2-Step', 'Challenge', 'USD', 'global', '2026-10-12 09:00:00+02', '2026-01-01', '2026-10-08',
  ARRAY['https://ftmo.com/en/trading-objectives/'],
  '{"profit_target_pct":10,"daily_loss_pct":5,"daily_loss_basis":"equity","max_loss_pct":10,"max_loss_type":"static","minimum_trading_days":4,"reset_timezone":"Europe/Prague"}'::jsonb, 'verified'
FROM public.provider_offerings o WHERE o.provider_id='ftmo' AND o.name='FTMO Challenge 2-Step'
  AND NOT EXISTS (SELECT 1 FROM public.prop_firm_rule_versions r WHERE r.offering_id=o.id AND r.phase='Challenge' AND r.effective_from='2026-01-01');
INSERT INTO public.prop_firm_rule_versions
  (offering_id, program_name, phase, currency, region_code, purchase_effective_until, effective_from, verified_at, source_urls, rules, rule_status)
SELECT o.id, 'FTMO Challenge 2-Step', 'Verification', 'USD', 'global', '2026-10-12 09:00:00+02', '2026-01-01', '2026-10-08',
  ARRAY['https://ftmo.com/en/trading-objectives/'],
  '{"profit_target_pct":5,"daily_loss_pct":5,"daily_loss_basis":"equity","max_loss_pct":10,"max_loss_type":"static","minimum_trading_days":4,"reset_timezone":"Europe/Prague"}'::jsonb, 'verified'
FROM public.provider_offerings o WHERE o.provider_id='ftmo' AND o.name='FTMO Challenge 2-Step'
  AND NOT EXISTS (SELECT 1 FROM public.prop_firm_rule_versions r WHERE r.offering_id=o.id AND r.phase='Verification' AND r.effective_from='2026-01-01');
INSERT INTO public.prop_firm_rule_versions
  (offering_id, program_name, phase, account_size, currency, region_code, effective_from, verified_at, source_urls, rules, rule_status)
SELECT o.id, 'Trading Combine', 'Trading Combine', s.size, 'USD', 'global', '2026-01-01', '2026-10-08',
  ARRAY['https://help.topstep.com/en/articles/8284197-trading-combine-parameters'],
  jsonb_build_object('profit_target_amount', s.target, 'max_loss_amount', s.mll, 'consistency_best_day_pct_of_target', 55, 'max_contracts', s.contracts, 'daily_loss_limit_pct', null), 'verified'
FROM public.provider_offerings o
CROSS JOIN (VALUES (50000::numeric,3000::numeric,2000::numeric,5),(100000,6000,3000,10),(150000,9000,4500,15)) AS s(size,target,mll,contracts)
WHERE o.provider_id='topstep' AND o.name='Trading Combine'
  AND NOT EXISTS (SELECT 1 FROM public.prop_firm_rule_versions r WHERE r.offering_id=o.id AND r.account_size=s.size AND r.phase='Trading Combine' AND r.effective_from='2026-01-01');
INSERT INTO public.prop_firm_rule_versions
  (offering_id, program_name, phase, account_size, currency, region_code, purchase_effective_from, verified_at, source_urls, rules, rule_status)
SELECT o.id, 'E8 Signature', 'SimFi Challenge', s.size, 'USD', 'global', '2026-10-01 19:00:00+02', '2026-10-08',
  ARRAY['https://helpfutures.e8markets.com/en/articles/11755943-e8-signature'],
  jsonb_build_object('profit_target_pct',6,'max_loss_amount',s.loss,'max_loss_type','eod_dynamic','minimum_trading_days',null,'maximum_position_size_contracts',s.contracts,'payout_best_day_pct',35), 'verified'
FROM public.provider_offerings o
CROSS JOIN (VALUES (25000::numeric,1000::numeric,2),(50000,2000,4),(100000,3000,8),(150000,4500,12)) AS s(size,loss,contracts)
WHERE o.provider_id='e8-markets' AND o.name='E8 Signature Classic / Futures'
  AND NOT EXISTS (SELECT 1 FROM public.prop_firm_rule_versions r WHERE r.offering_id=o.id AND r.account_size=s.size AND r.phase='SimFi Challenge' AND r.purchase_effective_from='2026-10-01 19:00:00+02');
INSERT INTO public.prop_firm_rule_versions
  (offering_id, program_name, phase, account_size, currency, region_code, purchase_effective_from, verified_at, source_urls, rules, rule_status)
SELECT o.id, 'E8 Signature', 'SimFi Performance', s.size, 'USD', 'global', '2026-10-01 19:00:00+02', '2026-10-08',
  ARRAY['https://helpfutures.e8markets.com/en/articles/11755943-e8-signature'],
  jsonb_build_object('daily_pause_pct',2,'daily_pause_basis','starting_balance_of_day','max_loss_amount',s.loss,'max_loss_type','eod_dynamic','best_day_payout_pct',35,'maximum_position_size_contracts',s.contracts), 'verified'
FROM public.provider_offerings o
CROSS JOIN (VALUES (25000::numeric,1000::numeric,2),(50000,2000,4),(100000,3000,8),(150000,4500,12)) AS s(size,loss,contracts)
WHERE o.provider_id='e8-markets' AND o.name='E8 Signature Classic / Futures'
  AND NOT EXISTS (SELECT 1 FROM public.prop_firm_rule_versions r WHERE r.offering_id=o.id AND r.account_size=s.size AND r.phase='SimFi Performance' AND r.purchase_effective_from='2026-10-01 19:00:00+02');

-- Seed the curated provider directory. Unsupported regional availability and
-- account programs are explicitly unknown until verified from official sources.
INSERT INTO public.provider_catalog (id, provider_kind, name, website_url, market_group)
VALUES
('ic-markets','broker','IC Markets','https://www.icmarkets.com/','forex_cfd'),
('pepperstone','broker','Pepperstone','https://pepperstone.com/','forex_cfd'),
('xm','broker','XM','https://www.xm.com/','forex_cfd'),
('hfm','broker','HFM','https://www.hfm.com/','forex_cfd'),
('fxtm','broker','FXTM','https://www.fxtm.com/','forex_cfd'),
('avatrade','broker','AvaTrade','https://www.avatrade.com/','multi_asset'),
('ig','broker','IG','https://www.ig.com/','multi_asset'),
('oanda','broker','OANDA','https://www.oanda.com/','multi_asset'),
('fp-markets','broker','FP Markets','https://www.fpmarkets.com/','forex_cfd'),
('tickmill','broker','Tickmill','https://www.tickmill.com/','forex_cfd'),
('admirals','broker','Admirals','https://admiralmarkets.com/','multi_asset'),
('fxpro','broker','FxPro','https://www.fxpro.com/','multi_asset'),
('vantage','broker','Vantage','https://www.vantagemarkets.com/','forex_cfd'),
('octa','broker','Octa','https://www.octafx.com/','forex_cfd'),
('fbs','broker','FBS','https://fbs.com/','forex_cfd'),
('justmarkets','broker','JustMarkets','https://justmarkets.com/','forex_cfd'),
('xtb','broker','XTB','https://www.xtb.com/','multi_asset'),
('blackbull','broker','BlackBull Markets','https://blackbull.com/','forex_cfd'),
('ftmo','prop_firm','FTMO','https://ftmo.com/','forex_cfd'),
('the5ers','prop_firm','The5ers','https://the5ers.com/','forex_cfd'),
('fundednext','prop_firm','FundedNext','https://fundednext.com/','forex_cfd'),
('fundingpips','prop_firm','FundingPips','https://fundingpips.com/','forex_cfd'),
('e8-markets','prop_firm','E8 Markets','https://e8markets.com/','forex_cfd'),
('alpha-capital','prop_firm','Alpha Capital Group','https://alphacapitalgroup.uk/','forex_cfd'),
('fxify','prop_firm','FXIFY','https://fxify.com/','forex_cfd'),
('funded-trading-plus','prop_firm','Funded Trading Plus','https://www.fundedtradingplus.com/','forex_cfd'),
('blue-guardian','prop_firm','Blue Guardian','https://blueguardian.com/','forex_cfd'),
('brightfunded','prop_firm','BrightFunded','https://brightfunded.com/','forex_cfd'),
('topstep','prop_firm','Topstep','https://www.topstep.com/','futures'),
('apex-trader-funding','prop_firm','Apex Trader Funding','https://apextraderfunding.com/','futures'),
('my-funded-futures','prop_firm','My Funded Futures','https://myfundedfutures.com/','futures'),
('tradeday','prop_firm','TradeDay','https://tradeday.com/','futures'),
('earntotrade','prop_firm','Earn2Trade','https://www.earn2trade.com/','futures'),
('take-profit-trader','prop_firm','Take Profit Trader','https://takeprofittrader.com/','futures'),
('bulenox','prop_firm','Bulenox','https://bulenox.com/','futures'),
('uprofit','prop_firm','UProfit','https://uprofittrader.com/','futures'),
('ticktick-trader','prop_firm','TickTick Trader','https://tickticktrader.com/','futures'),
('oneup-trader','prop_firm','OneUp Trader','https://oneuptrader.com/','futures')
ON CONFLICT (id) DO NOTHING;

-- Official-source watches are tracked separately from rule versions. The scheduled
-- Edge Function only records changes for review and never edits active rules.
INSERT INTO public.provider_source_watches (provider_id, offering_id, source_url)
SELECT provider_id, id, source_url FROM public.provider_offerings WHERE source_url IS NOT NULL
ON CONFLICT (source_url) DO NOTHING;

