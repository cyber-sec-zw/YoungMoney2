import type { TradingPlanInput } from '@/lib/types';

export interface PhotonEntryModelTemplate {
  name: string;
  description: string;
  checklist: { label: string; is_required: boolean }[];
}

export const PHOTON_PLAN_TITLE = 'Photon 2023 · Multi-Timeframe Liquidity Plan';
export const PHOTON_STRATEGY_NAME = 'Photon Liquidity Entry Models';

export const PHOTON_PLAN: TradingPlanInput = {
  title: PHOTON_PLAN_TITLE,
  philosophy: 'Use higher-timeframe intent to frame the objective, medium-timeframe points of interest to locate the trade, and lower-timeframe models to time execution. Track liquidity, inducement, mitigation, and supply/demand exchange. This is an editable transcription of the supplied Photon 2023 references, not an automated signal.',
  htf_selection: 'Before planning a trade, ask: Where is available liquidity? Who may be induced? What is the higher-timeframe objective? What has already been mitigated? Identify the HTF directional context and liquidity objective before selecting an MTF point of interest. The source discusses HTF BOS followed by a swing pullback to mitigate supply, and HTF CHoCH/i-BOS toward HTF demand. It also describes stacked MTF demand at an HTF extreme as a potentially important area in a bullish swing; define your own risk before applying its suggestion to be more aggressive.',
  ltf_execution: 'Wait for an MTF point of interest to mitigate before using a lower-timeframe entry model. If the expected mitigation does not occur, the source suggests waiting for an MTF CHoCH/i-BOS toward a fresh MTF point of interest. Select one of the linked Photon liquidity entry models and record which source conditions apply. When MTF order flow is pro-trend into HTF discount demand, the source frames the MTF objective as the HTF pullback. When all timeframes align, it describes targeting a weak HTF high in line with HTF intent.',
  trade_management: 'The source describes quick targets when trading bullish HTF continuation from MTF points of interest while an HTF pullback remains possible. It also says that in bullish order flow, supply may function as a pullback area. These are context notes, not automatic trade instructions. It does not prescribe numeric stops, targets, position sizing, or a fixed risk percentage; set those separately in your account and risk preferences.',
  risk_management: 'No numeric risk limits or position-sizing formula are specified in the supplied Photon documents. Configure account risk independently. The source cautions against buying weak lows, taking shorts in HTF discount, and using the very aggressive MTF counter-swing/counter-internal phase before consistent profitability.',
  mapping_process: '1. Establish the HTF objective and available liquidity. 2. Mark HTF supply/demand and the relevant swing structure. 3. Classify the MTF phase and identify its POI/objective. 4. Wait for POI mitigation or the stated MTF structure shift. 5. Use a matching LTF entry model. 6. Record the context, model, checklist, and outcome for review.',
  entry_models: 'The linked strategy contains the seven models from Photon_LQ_Entry_Models.pdf: LQ EM1 HTF Leg Inducement; LQ EM2a Fake Break; LQ EM2b Equal Lows/Highs; LQ EM3a Flip Inducement (RE); LQ EM3b Flip Inducement (CE); LQ EM4 HTF Leg/POI Sweep; and LQ EM5 Sweep Flip. Model descriptions and checklists are editable.',
  market_conditions: `MTF phase reference from the supplied intermediate plan:\nA — Pro swing + pro internal: objective is a weak MTF swing high; follow aligned MTF internal structure. The source says an MTF CHoCH at mitigation is not always needed before the LTF model.\nB — Pro swing + counter internal: anticipate a possible end of the swing pullback/internal reversal. The source discusses price beyond MTF swing EQ, adequate room to an internal objective, and optional confirmation; it advises waiting for MTF i-BOS when HTF context suggests an MTF reversal.\nC — Counter swing + pro internal: consider the MTF swing pullback after HTF POI mitigation or MTF swing BOS; MTF CHoCH confirmation is optional in the source.\nD — Counter swing + counter internal: explicitly described as very aggressive and to avoid until consistently profitable; the source suggests at least an i15 CHoCH or sitting out.\nRange: if HTF/MTF intent is unclear, stay out. The source describes longs in the lower third, shorts in the upper third, or waiting for a breakout.\nUse this as a reflection rubric, not a signal.`,
  additional_notes: 'Timeframe examples in the high-level plan: swing D1/H4/M15 and day H4/M15/M5/M1. Sources reviewed: Photon High level Trade Plan @Photon_2023.pdf, Photon_LQ_Entry_Models.pdf, and Photon_trading_Plan @Photon_2023.docx. The documents use PBID, PBL, SLQ, LID, CE, CHoCH, i-BOS, and BOS; several abbreviations are not expanded in the source, so their meanings have deliberately not been guessed. Review and customize wording, phase conditions, and required checklist flags before relying on this template.',
  adherence_score: null,
  screenshot_url: null,
  voice_note_url: null,
};

export const PHOTON_PLAN_RULES = [
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

export const PHOTON_PLAN_CHECKS = [
  'HTF objective and available liquidity are recorded',
  'MTF phase and relevant point of interest are recorded',
  'The selected lower-timeframe model matches the recorded context',
];

export const PHOTON_ENTRY_MODELS: PhotonEntryModelTemplate[] = [
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
