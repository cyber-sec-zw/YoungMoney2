import type { TradingPlanInput } from '@/lib/types';

export interface YmFxEntryModelTemplate {
  name: string;
  description: string;
  checklist: { label: string; is_required: boolean }[];
}

export const YM_FX_PLAN_TITLE = 'Young-Money-Fx';
export const YM_FX_STRATEGY_NAME = 'Young-Money-Fx';

export const YM_FX_PLAN: TradingPlanInput = {
  title: YM_FX_PLAN_TITLE,
  philosophy: 'Use higher-timeframe intent to frame the objective, medium-timeframe points of interest to locate the trade, and lower-timeframe models to time execution. Track liquidity, inducement, mitigation, and supply/demand exchange. This is an editable planning framework, not an automated signal.',
  htf_selection: 'Before planning a trade, ask: Where is available liquidity? Who may be induced? What is the higher-timeframe objective? What has already been mitigated? Identify the HTF directional context and liquidity objective before selecting an MTF point of interest. The source discusses HTF BOS followed by a swing pullback to mitigate supply, and HTF CHoCH/i-BOS toward HTF demand. It also describes stacked MTF demand at an HTF extreme as a potentially important area in a bullish swing; define your own risk before applying its suggestion to be more aggressive.',
  ltf_execution: 'Wait for an MTF point of interest to mitigate before using a lower-timeframe entry model. If the expected mitigation does not occur, wait for a suitable MTF CHoCH/i-BOS toward a fresh MTF point of interest. Select one of the linked liquidity entry models and record which conditions apply. When MTF order flow is pro-trend into HTF discount demand, the MTF objective may be the HTF pullback. When all timeframes align, consider targeting a weak HTF high in line with HTF intent.',
  trade_management: 'The source describes quick targets when trading bullish HTF continuation from MTF points of interest while an HTF pullback remains possible. It also says that in bullish order flow, supply may function as a pullback area. These are context notes, not automatic trade instructions. It does not prescribe numeric stops, targets, position sizing, or a fixed risk percentage; set those separately in your account and risk preferences.',
  risk_management: 'Set a maximum risk per trade, daily loss threshold, and maximum drawdown for this plan. Configure these values in the plan risk settings. Avoid buying weak lows, use caution with shorts in HTF discount, and avoid the aggressive MTF counter-swing/counter-internal phase until consistently profitable.',
  mapping_process: '1. Establish the HTF objective and available liquidity. 2. Mark HTF supply/demand and the relevant swing structure. 3. Classify the MTF phase and identify its POI/objective. 4. Wait for POI mitigation or the stated MTF structure shift. 5. Use a matching LTF entry model. 6. Record the context, model, checklist, and outcome for review.',
  entry_models: 'The linked strategy contains seven editable liquidity entry models: LQ EM1 HTF Leg Inducement; LQ EM2a Fake Break; LQ EM2b Equal Lows/Highs; LQ EM3a Flip Inducement (RE); LQ EM3b Flip Inducement (CE); LQ EM4 HTF Leg/POI Sweep; and LQ EM5 Sweep Flip.',
  market_conditions: `MTF phase reference from the supplied intermediate plan:\nA — Pro swing + pro internal: objective is a weak MTF swing high; follow aligned MTF internal structure. The source says an MTF CHoCH at mitigation is not always needed before the LTF model.\nB — Pro swing + counter internal: anticipate a possible end of the swing pullback/internal reversal. The source discusses price beyond MTF swing EQ, adequate room to an internal objective, and optional confirmation; it advises waiting for MTF i-BOS when HTF context suggests an MTF reversal.\nC — Counter swing + pro internal: consider the MTF swing pullback after HTF POI mitigation or MTF swing BOS; MTF CHoCH confirmation is optional in the source.\nD — Counter swing + counter internal: explicitly described as very aggressive and to avoid until consistently profitable; the source suggests at least an i15 CHoCH or sitting out.\nRange: if HTF/MTF intent is unclear, stay out. The source describes longs in the lower third, shorts in the upper third, or waiting for a breakout.\nUse this as a reflection rubric, not a signal.`,
  additional_notes: 'Example timeframe combinations: swing D1/H4/M15 and day H4/M15/M5/M1. Acronyms such as PBID, PBL, SLQ, LID, CE, CHoCH, i-BOS, and BOS can have different meanings across trading communities; define the terms you use in your own plan. Review and customize wording, phase conditions, risk limits, and required checklist flags before relying on this template.',
  adherence_score: null,
  screenshot_url: null,
  voice_note_url: null,
};

export const YM_20_PLAN_TITLE = 'Young Money 2.0';
export const YM_20_STRATEGY_NAME = 'Young Money 2.0';

export const YM_20_PLAN: TradingPlanInput = {
  title: YM_20_PLAN_TITLE,
  philosophy: 'Build a directional narrative from the higher timeframe, use medium-timeframe points of interest that can serve that objective, and execute only after lower-timeframe evidence appears. Prefer trading from strong structure toward weak structure, and distinguish continuation from pullback phases. Liquidity, inducement, mitigation, supply and demand, and price location are context for a discretionary plan, not automatic signals. Review and adapt every rule to the account and current market.',
  htf_selection: 'Start with the swing context (the source examples use D1/H4 for swing trading and H4/M15 for day trading). Map swing and internal ranges, premium/discount, strong and weak highs/lows, supply and demand, and visible liquidity pools. Record the current objective, who may be induced, what has already been mitigated, and whether the narrative is a pro-trend run or counter-trend pullback. Work from HTF to MTF rather than choosing an LTF entry first. After a structural break, allow for a swing pullback into relevant supply/demand; use HTF CHoCH/i-BOS and the next HTF objective to judge whether the pullback may be complete. Stacked MTF demand at an HTF extreme is a context clue, not permission to increase risk.',
  ltf_execution: 'Derive the MTF POI from the HTF objective, mark the level, and wait for price to mitigate it before selecting an LTF model. The source lists engulfing or STB/BTS (pivot or range) as minimum POI methods, followed by a break of structure such as CHoCH, i-BOS, or BOS. In counter-trend or counter-order-flow conditions, prefer waiting for a fresh MTF CHoCH/i-BOS and a newly formed POI. Before entry, confirm the intended liquidity event has occurred, observe decisive momentum away from the zone and the required LTF structure shift, and document the model-specific conditions. If any required condition is absent, wait or pass. The source illustrates entry limits at the edge, 25%, equilibrium, or candle body; these are alternatives to test, not simultaneous requirements.',
  trade_management: 'Define invalidation and stop placement before entry; the source places the stop beyond the entry zone with a spread buffer. Set a target from the HTF/MTF objective and nearby opposing structure, then adjust if a key level is close. The source gives 10R for pro-trend/pro-order-flow and 5R for counter-trend/counter-order-flow as examples only; do not treat them as fixed targets or expected outcomes. It also illustrates moving to breakeven, or trailing behind a lower-timeframe strong high/low, after a lower-timeframe pullback high/low breaks. Record the planned management and any deviation.',
  risk_management: 'Source-derived starting limits for review: risk 0.5% of account equity per trade and stop after three losses in a day. The plan daily-loss guardrail is set to 1.5%, the arithmetic equivalent of three full 0.5% losses before costs; slippage, commissions, and changing equity can alter realized loss, so stop sooner if the account limit is reached. The source states a 2-pip minimum stop for EUR/USD; treat this as a source-specific reference, verify spread/volatility/broker conditions, and skip a setup rather than forcing an invalid stop. No numeric maximum drawdown is specified. Do not raise risk after losses or use the aggressive MTF counter-swing/counter-internal phase until consistently profitable.',
  max_risk_per_trade_pct: 0.5,
  max_daily_loss_pct: 1.5,
  max_drawdown_pct: null,
  mapping_process: '1. Select the intended mode (swing or day) and review the calendar for high-impact news. 2. Map HTF swing/internal ranges, premium/discount, strong/weak structure, supply/demand, and available liquidity. 3. Write the HTF narrative, objective, and mitigation state. 4. Derive and alert the MTF POI; classify the MTF phase A, B, C, D, or range. 5. Check POI quality: location, freshness/mitigation, liquidity, HTF confluence, and room to objective. 6. Wait for mitigation and the appropriate structure shift; select and validate one LQ entry model. 7. Define invalidation, stop plus spread buffer, size at or below the risk cap, and management before entry. 8. Log the chart, checklist, outcome, and rule adherence; review patterns without changing rules mid-trade.',
  entry_models: 'The linked strategy contains seven editable liquidity models: LQ EM1 HTF Leg Inducement; LQ EM2a Fake Break; LQ EM2b Equal Lows/Highs; LQ EM3a Flip Inducement (RE); LQ EM3b Flip Inducement (CE); LQ EM4 HTF Leg/POI Sweep; and LQ EM5 Sweep Flip. Each model checklist captures the conditions shown in the supplied diagrams. Confirm the applicable direction/variant and define any additional terms before use.',
  market_conditions: `MTF phase guide from the supplied intermediate plan; use HTF context to set aggressiveness.\nA — Pro swing + pro internal: objective is a weak MTF swing high and continuation with the aligned MTF internal trend. The source describes the MTF swing pullback as finished and says an extra MTF CHoCH at POI mitigation may not be necessary before the LTF model.\nB — Pro swing + counter internal: anticipate a possible end to the swing pullback and an internal reversal. The source favors a pullback past MTF swing equilibrium with an extreme/POI mitigated and adequate room to an internal objective. Waiting for MTF CHoCH is optional in the example; if HTF context suggests the MTF swing itself may reverse, wait for MTF i-BOS instead.\nC — Counter swing + pro internal: consider the MTF swing pullback, or an HTF-supported MTF swing reversal. The source highlights HTF POI mitigation, MTF swing BOS, or the start of the MTF swing pullback before equilibrium; extra MTF CHoCH confirmation is optional in its example.\nD — Counter swing + counter internal: explicitly very aggressive. Avoid unless consistently profitable; the source recommends sitting out or, at minimum, waiting for an M15 CHoCH. Do not use the phase label alone as an entry.\nRange — If HTF/MTF intent is unclear, stay out of the middle. The source suggests considering longs only in the lower third, shorts only in the upper third, or waiting for a breakout; still require the normal POI, entry, and risk checks.`,
  additional_notes: 'Source instrument is EUR/USD only. Source timing examples are day trading 07:00–10:00 and 12:00–16:00, and swing trading 07:00–17:00, all stated in London time; verify daylight-saving changes and your own schedule. The source says no entry within 30 minutes before high-impact news. Example timeframe stacks are D1/H4/M15 for swing and H4/M15/M5/M1 for day. Define terms such as PT/CT, POF/COF, P&D, PBID, PBL, SLQ, LID, CE, CHoCH, i-BOS, and BOS consistently in your journal. These are editable study notes from supplied 2023 materials, not live market data or guaranteed performance.',
  adherence_score: null,
  screenshot_url: null,
  voice_note_url: null,
};

export const YM_20_PLAN_RULES = [
  { rule_text: 'Trade EUR/USD only under this plan; record the selected swing or day mode before mapping.', category: 'discipline' as const },
  { rule_text: 'Write the HTF narrative, objective, available liquidity, and mitigation state before selecting an MTF POI.', category: 'entry' as const },
  { rule_text: 'Map swing/internal ranges, premium/discount, strong/weak structure, and relevant supply/demand before entry.', category: 'entry' as const },
  { rule_text: 'Wait for the MTF POI to mitigate before using an LTF entry model; in counter-trend/order-flow conditions, prefer a fresh MTF shift and POI.', category: 'entry' as const },
  { rule_text: 'A POI needs a defined method and structural evidence; the source examples include engulfing or STB/BTS and a CHoCH, i-BOS, or BOS.', category: 'entry' as const },
  { rule_text: 'Classify the MTF phase and use HTF alignment to decide whether to proceed, wait for confirmation, or stand aside.', category: 'discipline' as const },
  { rule_text: 'Validate one named liquidity entry model and its required conditions; do not substitute a model name for evidence.', category: 'entry' as const },
  { rule_text: 'Do not buy weak lows; use caution with counter-swing shorts in HTF discount.', category: 'risk' as const },
  { rule_text: 'Treat MTF counter-swing plus counter-internal conditions as very aggressive; avoid them until consistently profitable.', category: 'discipline' as const },
  { rule_text: 'Use the source risk cap of 0.5% per trade; never increase size to recover a loss.', category: 'position_sizing' as const },
  { rule_text: 'Stop for the day after three losses or when the 1.5% plan daily-loss limit is reached, whichever comes first.', category: 'risk' as const },
  { rule_text: 'For EUR/USD, review the source 2-pip minimum stop reference against spread, volatility, and the actual invalidation level; do not force a stop that invalidates the setup.', category: 'risk' as const },
  { rule_text: 'Do not open a new position within 30 minutes before high-impact news; check the calendar before the session.', category: 'news' as const },
  { rule_text: 'Use London-local session windows from the source only as a planning reference and account for daylight-saving changes.', category: 'discipline' as const },
  { rule_text: 'Choose targets from the objective and opposing structure; source 10R/5R examples are not fixed targets or performance promises.', category: 'exit' as const },
];

export const YM_20_PLAN_CHECKS = [
  'EUR/USD and swing/day mode are recorded',
  'High-impact news calendar checked; entry is not within the 30-minute pre-news window',
  'HTF narrative, objective, liquidity, and mitigation state are written down',
  'HTF and MTF structure, premium/discount, and relevant supply/demand are mapped',
  'MTF phase and POI selection method are recorded',
  'POI mitigation and required structure shift are confirmed',
  'One entry model is selected and its required evidence is present',
  'Invalidation, stop plus spread buffer, target, and management are defined',
  'Position risk is at or below 0.5% and the daily loss/loss-count limits are respected',
];

export const YM_20_ENTRY_MODELS: YmFxEntryModelTemplate[] = [
  {
    name: 'LQ EM1 — HTF Leg Inducement',
    description: 'The diagrams show two directional variants: no PBID built to the right, a PBL failure, and a sweep of available SLQ associated with the HTF leg inducement to the left. Identify which variant applies before using it.',
    checklist: [
      { label: 'The HTF leg/POI and its available liquidity are marked', is_required: true },
      { label: 'No PBID is built to the right in the selected variant', is_required: true },
      { label: 'The PBL failure is present in the selected variant', is_required: true },
      { label: 'The relevant available SLQ has been swept', is_required: true },
    ],
  },
  {
    name: 'LQ EM2a — Fake Break',
    description: 'A break induces early buyers or sellers (PBID); available SLQ forms beyond the corresponding strong low/high, followed by a PBL failure. The diagrams show bullish and bearish orientations.',
    checklist: [
      { label: 'The fake break has induced early participants (PBID)', is_required: true },
      { label: 'Available SLQ has formed beyond the corresponding strong low/high', is_required: true },
      { label: 'The PBL failure is present', is_required: true },
      { label: 'The direction agrees with the mapped HTF/MTF context', is_required: true },
    ],
  },
  {
    name: 'LQ EM2b — Equal Lows / Highs',
    description: 'Equal lows or equal highs induce early participants and create available SLQ; the illustrated setup then requires a PBL failure. Apply the corresponding directional variant.',
    checklist: [
      { label: 'Equal lows/highs are clearly identified as inducement', is_required: true },
      { label: 'The resulting available SLQ is marked', is_required: true },
      { label: 'The PBL failure is present', is_required: true },
      { label: 'The sweep and direction fit the selected HTF/MTF POI', is_required: true },
    ],
  },
  {
    name: 'LQ EM3a — Flip Inducement (RE)',
    description: 'The source depicts no PBID and a flip that does not itself sweep liquidity; the flip may act as inducement for an extreme. Entering before PBL failure is identified as riskier.',
    checklist: [
      { label: 'No PBID is built in the illustrated setup', is_required: true },
      { label: 'The flip is not mistaken for a liquidity sweep', is_required: true },
      { label: 'The flip is being used as inducement for a mapped extreme', is_required: true },
      { label: 'If PBL failure has not occurred, the higher-risk exception is deliberately rejected or documented', is_required: false },
    ],
  },
  {
    name: 'LQ EM3b — Flip Inducement (CE)',
    description: 'The diagrams show no PBID, a PBL failure, a CE off the extreme, and a flip that does not sweep liquidity. The source says to wait for the flip to hold as confirmation.',
    checklist: [
      { label: 'No PBID is built and the flip does not sweep liquidity', is_required: true },
      { label: 'PBL failure is present', is_required: true },
      { label: 'CE is taken off the mapped extreme', is_required: true },
      { label: 'The flip has held before entry', is_required: true },
    ],
  },
  {
    name: 'LQ EM4 — HTF Leg / POI Sweep',
    description: 'No PBID is built to the right, PBL fails, and the sweep takes only the available SLQ, which the source depicts as the HTF structural high/low itself.',
    checklist: [
      { label: 'The HTF structural high/low is the available SLQ', is_required: true },
      { label: 'No PBID is built to the right in the selected variant', is_required: true },
      { label: 'The PBL failure is present', is_required: true },
      { label: 'The sweep takes only the identified available SLQ', is_required: true },
    ],
  },
  {
    name: 'LQ EM5 — Sweep Flip',
    description: 'The source diagrams show an HTF liquidity sweep followed by a flip, but provide no written confirmation or invalidation rules. Define and test those rules before relying on this model.',
    checklist: [
      { label: 'The HTF liquidity pool and sweep are documented', is_required: true },
      { label: 'The subsequent flip is documented', is_required: true },
      { label: 'Additional confirmation, invalidation, and entry rules have been defined and reviewed', is_required: true },
    ],
  },
];

export const YM_FX_PLAN_RULES = [
  { rule_text: 'Start with HTF liquidity, intention, and objective before choosing an MTF POI.', category: 'entry' as const },
  { rule_text: 'With bullish HTF context, consider MTF POI continuation in line with internal structure; watch for HTF pullback and use your own target plan.', category: 'entry' as const },
  { rule_text: 'After HTF BOS, account for the possible HTF swing pullback toward HTF supply; the source also maps HTF CHoCH/i-BOS toward HTF demand.', category: 'entry' as const },
  { rule_text: 'Wait for MTF POI mitigation before a lower-timeframe model, or wait for the specified MTF shift to a fresh POI.', category: 'entry' as const },
  { rule_text: 'When MTF order flow is pro-trend into HTF discount demand, record that the MTF objective may be the HTF pullback.', category: 'entry' as const },
  { rule_text: 'Do not buy weak lows.', category: 'entry' as const },
  { rule_text: 'Use caution with shorts in HTF discount.', category: 'risk' as const },
  { rule_text: 'Treat stacked MTF demand at an HTF extreme as context to assess; the source suggests more aggressive longs, but account risk remains your decision.', category: 'risk' as const },
  { rule_text: 'When order flow is bullish, assess supply as a possible pullback area rather than an automatic short.', category: 'entry' as const },
  { rule_text: 'When timeframes align, record the HTF objective and intent before targeting a weak HTF high.', category: 'entry' as const },
  { rule_text: 'Treat MTF counter-swing plus counter-internal phase as very aggressive; avoid it until consistently profitable.', category: 'discipline' as const },
  { rule_text: 'If HTF/MTF intent is unclear in a range, stay out or wait for a breakout.', category: 'discipline' as const },
  { rule_text: 'Do not infer numeric risk, stop, target, or position-size settings from the source documents; configure them for the account.', category: 'risk' as const },
];

export const YM_FX_PLAN_CHECKS = [
  'HTF objective and available liquidity are recorded',
  'MTF phase and relevant point of interest are recorded',
  'The selected lower-timeframe model matches the recorded context',
];

export const YM_FX_ENTRY_MODELS: YmFxEntryModelTemplate[] = [
  {
    name: 'LQ EM1 — HTF Leg Inducement',
    description: 'Two source variants describe no PBID built to the right, a PBL failure, and a sweep of available SLQ from the HTF LID to the left. Review which side/variant applies.',
    checklist: [
      { label: 'The relevant HTF leg/POI liquidity is identified', is_required: true },
      { label: 'The available SLQ sweep matches the selected source variant', is_required: true },
      { label: 'The PBL-failure and no-right-side-PBID conditions match this variant', is_required: true },
    ],
  },
  {
    name: 'LQ EM2a — Fake Break',
    description: 'The break induces early buyers or sellers (PBID), PBL fails, and available SLQ is built below a strong low or above a strong high, according to the side shown.',
    checklist: [
      { label: 'The break has induced early participants (PBID)', is_required: true },
      { label: 'The PBL failure is present', is_required: true },
      { label: 'Available SLQ formed beyond the corresponding strong low/high', is_required: true },
    ],
  },
  {
    name: 'LQ EM2b — Equal Lows / Highs',
    description: 'Equal lows or equal highs induce early participants; the source marks available SLQ and PBL failure as part of the model.',
    checklist: [
      { label: 'Equal lows/highs are inducing early participants', is_required: true },
      { label: 'Available SLQ is identified', is_required: true },
      { label: 'The PBL failure is present', is_required: true },
    ],
  },
  {
    name: 'LQ EM3a — Flip Inducement (RE)',
    description: 'The source says no PBID is built and the flip does not sweep liquidity; it may act as inducement for an extreme. Entering before PBL failure is described as riskier.',
    checklist: [
      { label: 'No PBID is built in the source setup', is_required: true },
      { label: 'The flip is recognized as not sweeping liquidity', is_required: true },
      { label: 'If entering before PBL failure, the higher-risk exception is deliberate', is_required: false },
    ],
  },
  {
    name: 'LQ EM3b — Flip Inducement (CE)',
    description: 'The source shows no PBID, PBL failure, CE off an extreme, and a flip that does not sweep liquidity; it says to wait for the flip to hold.',
    checklist: [
      { label: 'No PBID is built and the flip does not sweep liquidity', is_required: true },
      { label: 'The PBL failure and CE-off-extreme conditions are present', is_required: true },
      { label: 'The flip has held as confirmation', is_required: true },
    ],
  },
  {
    name: 'LQ EM4 — HTF Leg / POI Sweep',
    description: 'The source describes no PBID to the right, PBL failure, and a sweep of only the available SLQ: the HTF structural low/high itself.',
    checklist: [
      { label: 'The relevant HTF structural low/high is the available SLQ', is_required: true },
      { label: 'Only that available SLQ is swept in the selected variant', is_required: true },
      { label: 'The no-right-side-PBID and PBL-failure conditions match', is_required: true },
    ],
  },
  {
    name: 'LQ EM5 — Sweep Flip',
    description: 'The diagram shows an HTF liquidity sweep followed by a flip. The source provides no further written conditions; add your own only after review.',
    checklist: [
      { label: 'The HTF liquidity sweep is marked', is_required: true },
      { label: 'The subsequent flip is documented', is_required: true },
    ],
  },
];
