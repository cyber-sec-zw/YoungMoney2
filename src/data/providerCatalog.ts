import type { PropFirmRuleVersion, ProviderCatalogEntry, ProviderOffering } from '@/lib/types';

export const PROVIDER_CATALOG_RESEARCH_DATE = '2026-10-13';

const brokerRows = [
  ['exness', 'Exness', 'https://www.exness.com/'],
  ['deriv', 'Deriv', 'https://deriv.com/'],
  ['ig', 'IG', 'https://www.ig.com/'],
  ['cmc-markets', 'CMC Markets', 'https://www.cmcmarkets.com/'],
  ['pepperstone', 'Pepperstone', 'https://pepperstone.com/'],
  ['oanda', 'OANDA', 'https://www.oanda.com/'],
  ['forex-com', 'FOREX.com', 'https://www.forex.com/'],
  ['xtb', 'XTB', 'https://www.xtb.com/'],
  ['plus500', 'Plus500', 'https://www.plus500.com/'],
  ['avatrade', 'AvaTrade', 'https://www.avatrade.com/'],
  ['xm', 'XM', 'https://www.xm.com/'],
  ['ic-markets', 'IC Markets', 'https://www.icmarkets.com/'],
  ['fp-markets', 'FP Markets', 'https://www.fpmarkets.com/'],
  ['tickmill', 'Tickmill', 'https://www.tickmill.com/'],
  ['admirals', 'Admirals', 'https://admiralmarkets.com/'],
  ['eightcap', 'Eightcap', 'https://www.eightcap.com/'],
  ['hfm', 'HFM', 'https://www.hfm.com/'],
  ['fxpro', 'FxPro', 'https://www.fxpro.com/'],
  ['vantage', 'Vantage', 'https://www.vantagemarkets.com/'],
  ['fbs', 'FBS', 'https://fbs.com/'],
] as const;

const propFirmRows = [
  ['ftmo', 'FTMO', 'https://ftmo.com/en/'],
  ['fundednext', 'FundedNext', 'https://fundednext.com/'],
  ['e8-markets', 'E8 Markets', 'https://e8markets.com/'],
  ['topstep', 'Topstep', 'https://topstep.com/'],
  ['my-funded-futures', 'MyFundedFutures', 'https://myfundedfutures.com/'],
  ['the5ers', 'The5ers', 'https://the5ers.com/'],
  ['earn2trade', 'Earn2Trade', 'https://www.earn2trade.com/'],
  ['fxify', 'FXIFY', 'https://fxify.com/'],
] as const;

export const DEFAULT_PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  ...brokerRows.map(([id, name, website_url]) => ({
    id: `catalog-broker-${id}`,
    provider_kind: 'broker' as const,
    name,
    website_url,
    market_group: 'retail_fx_cfd',
    availability: { ZA: 'unknown' as const, ZW: 'unknown' as const },
    is_active: true,
  })),
  ...propFirmRows.map(([id, name, website_url]) => ({
    id: `catalog-prop-${id}`,
    provider_kind: 'prop_firm' as const,
    name,
    website_url,
    market_group: id === 'topstep' || id === 'my-funded-futures' || id === 'earn2trade' ? 'futures' : 'fx_cfd',
    availability: { ZA: 'unknown' as const, ZW: 'unknown' as const },
    is_active: true,
  })),
];

const programRows = [
  {
    id: 'ftmo-2-step',
    provider: 'catalog-prop-ftmo',
    name: '2-Step CFD Challenge',
    source: 'https://ftmo.com/en/trading-objectives/',
    details: { phases: ['Challenge', 'Verification'], time_limit: 'unknown', source_note: 'Official objective page; region and account-size variations not assessed.' },
    rules: {
      maximum_loss: { value_pct: 10, basis: 'initial simulated capital', method: 'static' },
      daily_loss: { value_pct: 5, basis: 'initial simulated capital', reset: '00:00 CE(S)T balance recalculation' },
      profit_targets_pct: { challenge: 10, verification: 5 },
      minimum_trading_days_per_phase: 4,
      time_limit: 'unknown',
    },
  },
  {
    id: 'fundednext-stellar-2-step',
    provider: 'catalog-prop-fundednext',
    name: 'Stellar 2-Step Challenge',
    source: 'https://help.fundednext.com/en/articles/17255124-stellar-2-step-challenge',
    source_urls: ['https://help.fundednext.com/en/articles/17255124-stellar-2-step-challenge', 'https://help.fundednext.com/en/articles/8019811-how-can-i-calculate-the-daily-loss-limit'],
    details: { phases: ['Phase 1', 'Phase 2'], time_limit: 'none', source_note: 'Official help center; region and account-size variations not assessed.' },
    rules: {
      maximum_loss: { value_pct: 10, basis: 'initial balance', method: 'balance or equity must not fall below 90% of initial balance' },
      daily_loss: { value_pct: 5, basis: 'initial balance', reset: '00:00 server time', notes: 'Daily allowance adjusts with day profit/loss; fees and floating P/L count.' },
      profit_targets_pct: { phase_1: 8, phase_2: 5 },
      minimum_calendar_days_per_phase: 5,
      time_limit: 'none',
    },
  },
  {
    id: 'e8-one',
    provider: 'catalog-prop-e8-markets',
    name: 'E8 One',
    source: 'https://help.e8markets.com/en/articles/11775980-e8-one',
    source_urls: ['https://help.e8markets.com/en/articles/11775980-e8-one', 'https://help.e8markets.com/en/articles/11769446-daily-drawdown', 'https://help.e8markets.com/en/articles/11782996-dynamic-drawdown'],
    details: { phases: ['One-step'], customizable: true, source_note: 'Official help center; exact account settings, limits, and target require customer-specific verification.' },
    rules: {
      maximum_loss: { method: 'dynamic from highest closed balance', lock_condition: 'provider describes a lock at a specified profit threshold', value_pct: 'unknown' },
      daily_loss: { method: 'new-day starting balance less fixed daily-drawdown amount', value_pct: 'account-specific; unknown' },
      profit_target: 'unknown',
      minimum_trade_activity: 'at least one trade closed every 60 days',
      time_limit: 'unknown',
    },
  },
  {
    id: 'topstep-trading-combine',
    provider: 'catalog-prop-topstep',
    name: 'Trading Combine',
    source: 'https://help.topstep.com/en/articles/8284197-trading-combine-parameters',
    source_urls: ['https://help.topstep.com/en/articles/8284197-trading-combine-parameters', 'https://help.topstep.com/en/articles/8284204-what-is-the-maximum-loss-limit', 'https://help.topstep.com/en/articles/10490293-daily-loss-limit-in-the-trading-combine-and-express-funded-account', 'https://help.topstep.com/en/articles/8284208-consistency-at-topstep'],
    details: { phases: ['Trading Combine', 'funded-account paths'], source_note: 'Official help center; values vary by account size and selected options.' },
    rules: {
      maximum_loss: { name: 'Maximum Loss Limit (MLL)', method: 'account-specific; exact calculation not verified', value: 'unknown' },
      daily_loss: { optional: true, value: 'selected by user; account-specific' },
      profit_target: { value: 'varies by account size', example: '$3,000 for a $50,000 Combine' },
      minimum_days: 2,
      consistency: { best_day_below_pct_of_profit_target: 55 },
    },
  },
  {
    id: 'myfundedfutures-builder-100k',
    provider: 'catalog-prop-my-funded-futures',
    name: 'Builder Plan 100K',
    source: 'https://help.myfundedfutures.com/en/articles/17005296-builder-plan-100k-comprehensive-guide',
    source_urls: ['https://help.myfundedfutures.com/en/articles/17005296-builder-plan-100k-comprehensive-guide', 'https://help.myfundedfutures.com/en/articles/11802636-traders-evaluation-simplified'],
    details: { phases: ['Evaluation', 'Sim Funded'], source_note: 'Official help center; values apply to the cited 100K Builder plan only.' },
    rules: {
      maximum_loss: { amount: 3000, currency: 'USD', method: 'end-of-day trailing' },
      daily_loss: { method: 'soft daily loss limit', amount: 'unknown' },
      profit_target: { amount: 6000, currency: 'USD', value_pct: 6 },
      minimum_days: 1,
      time_limit: 'unknown',
    },
  },
  {
    id: 'the5ers-high-stakes',
    provider: 'catalog-prop-the5ers',
    name: 'High Stakes',
    source: 'https://the5ers.com/high-stakes/',
    details: { source_note: 'Official page checked; programme rule values were not available in the retrieved material and are intentionally unknown.' },
    rules: { maximum_loss: 'unknown', daily_loss: 'unknown', profit_target: 'unknown', time_limit: 'unknown' },
    status: 'needs_verification' as const,
  },
  {
    id: 'earn2trade-gauntlet-mini',
    provider: 'catalog-prop-earn2trade',
    name: 'Gauntlet Mini',
    source: 'https://www.earn2trade.com/gauntlet-mini',
    details: { market: 'futures', source_note: 'Official page checked; rule values were not available in the retrieved material and are intentionally unknown.' },
    rules: { maximum_loss: 'unknown', daily_loss: 'unknown', profit_target: 'unknown', time_limit: 'unknown' },
    status: 'needs_verification' as const,
  },
  {
    id: 'fxify-programmes',
    provider: 'catalog-prop-fxify',
    name: 'Evaluation and Instant Funding (programme selection required)',
    source: 'https://fxify.com/',
    details: { source_note: 'Official homepage identifies programme families; specific programme rules were not verified.' },
    rules: { maximum_loss: 'unknown', daily_loss: 'unknown', profit_target: 'unknown', time_limit: 'unknown' },
    status: 'needs_verification' as const,
  },
] as const;

export const DEFAULT_PROVIDER_OFFERINGS: ProviderOffering[] = programRows.map(program => ({
  id: `catalog-offering-${program.id}`,
  provider_id: program.provider,
  offering_kind: 'prop_program',
  name: program.name,
  market_group: program.provider === 'catalog-prop-topstep' || program.provider === 'catalog-prop-my-funded-futures' || program.provider === 'catalog-prop-earn2trade' ? 'futures' : 'fx_cfd',
  details: program.details,
  region_code: null,
  contracting_entity: null,
  source_url: program.source,
  verified_at: PROVIDER_CATALOG_RESEARCH_DATE,
  source_status: 'status' in program && program.status === 'needs_verification' ? 'needs_verification' : 'verified',
  is_active: true,
}));

export const DEFAULT_PROP_FIRM_RULE_VERSIONS: PropFirmRuleVersion[] = programRows.flatMap(program => {
  const phases = program.id === 'ftmo-2-step'
    ? [{ name: 'Challenge', target: 10 }, { name: 'Verification', target: 5 }]
    : program.id === 'fundednext-stellar-2-step'
      ? [{ name: 'Phase 1', target: 8 }, { name: 'Phase 2', target: 5 }]
      : [{ name: 'Programme rules', target: null }];
  return phases.map(phase => {
    const baseRules = program.rules as Record<string, unknown>;
    const maximumLoss = baseRules.maximum_loss as { value_pct?: number } | undefined;
    const dailyLoss = baseRules.daily_loss as { value_pct?: number; reset?: string } | undefined;
    return {
      id: `catalog-rule-${program.id}-${phase.name.toLowerCase().replace(/ /g, '-')}`,
      offering_id: `catalog-offering-${program.id}`,
      program_name: program.name,
      phase: phase.name,
      account_size: program.id === 'myfundedfutures-builder-100k' ? 100000 : null,
      currency: program.id === 'myfundedfutures-builder-100k' ? 'USD' : null,
      region_code: null,
      contracting_entity: null,
      purchase_effective_from: null,
      purchase_effective_until: null,
      effective_from: null,
      verified_at: PROVIDER_CATALOG_RESEARCH_DATE,
      source_urls: 'source_urls' in program ? [...program.source_urls] : [program.source],
      rules: {
        ...baseRules,
        profit_target_pct: phase.target ?? undefined,
        daily_loss_pct: dailyLoss?.value_pct,
        max_loss_pct: maximumLoss?.value_pct,
        reset_timezone: undefined,
      },
      rule_status: 'status' in program && program.status === 'needs_verification' ? 'needs_verification' : 'verified',
    };
  });
});
