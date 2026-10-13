import type { TradingPlanInput } from '@/lib/types';

export const DEFAULT_USER_TRADING_PLAN: TradingPlanInput = {
  title: 'My Trading Plan',
  philosophy: 'Write the principles that guide your decisions. Keep them specific enough to review after each session.',
  htf_selection: 'Describe how you establish higher-timeframe context and identify relevant market levels.',
  ltf_execution: 'Describe the conditions required before an entry and the evidence that invalidates the setup.',
  trade_management: 'Document how you manage open positions, exits, and changes to the original thesis.',
  risk_management: 'Set risk limits that fit your account and circumstances. Numeric guardrails can be configured below.',
  max_risk_per_trade_pct: null,
  max_daily_loss_pct: null,
  max_drawdown_pct: null,
  mapping_process: '1. Review context. 2. Define a setup. 3. Set risk before entry. 4. Record the decision and review the outcome.',
  entry_models: null,
  market_conditions: null,
  additional_notes: null,
  adherence_score: null,
  screenshot_url: null,
  voice_note_url: null,
};

export const DEFAULT_USER_STRATEGY = {
  name: 'My Strategy',
  description: 'Describe the market conditions, entry evidence, invalidation, and management rules that make this strategy valid.',
};

export const DEFAULT_USER_ENTRY_MODEL = {
  name: 'My Entry Model',
  description: 'Describe the specific confirmation and execution criteria for this entry model.',
};
