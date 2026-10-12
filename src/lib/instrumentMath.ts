import type { MarketInstrument } from '@/lib/types';

export const SIZE_PRESETS: Record<string, number[]> = {
  fx: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  metal: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  index: [0.1, 0.5, 1, 2, 5],
  crypto: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  stock: [1, 5, 10, 25, 50, 100],
  future: [1, 2, 3, 5, 10],
  energy: [1, 2, 3, 5, 10],
  agriculture: [1, 2, 3, 5, 10],
  custom: [1, 2, 5, 10],
};

export function instrumentPnl(
  instrument: MarketInstrument,
  direction: 'long' | 'short',
  entry: number,
  exit: number,
  quantity: number,
  conversionRate = 1,
): number {
  const signedMove = direction === 'long' ? exit - entry : entry - exit;
  const ticksMoved = signedMove / instrument.price_increment;
  const tickValue = instrument.tick_value ?? instrument.price_increment * instrument.contract_multiplier;
  return ticksMoved * tickValue * quantity * conversionRate;
}

export function calculatePositionSize(
  instrument: MarketInstrument,
  accountBalance: number,
  riskPercent: number,
  entry: number,
  stop: number,
  conversionRate: number,
): number | null {
  const distance = Math.abs(entry - stop);
  if (!distance || !instrument.contract_multiplier || !conversionRate || accountBalance <= 0 || riskPercent <= 0) return null;
  const riskBudget = accountBalance * riskPercent / 100;
  const tickValue = instrument.tick_value ?? instrument.price_increment * instrument.contract_multiplier;
  const riskPerQuantity = distance / instrument.price_increment * tickValue * conversionRate;
  if (!Number.isFinite(riskPerQuantity) || riskPerQuantity <= 0) return null;
  const raw = riskBudget / riskPerQuantity;
  return instrument.quantity_unit === 'lots' ? Number(raw.toFixed(2)) : Number(raw.toFixed(4));
}

export function roundInstrumentPrice(instrument: MarketInstrument, value: number): number {
  const rounded = Math.round(value / instrument.price_increment) * instrument.price_increment;
  return Number(rounded.toFixed(instrument.price_precision));
}

export function instrumentDistanceStep(instrument: MarketInstrument): number {
  return instrument.asset_class === 'fx' && instrument.pip_size
    ? instrument.pip_size
    : instrument.price_increment;
}

export function instrumentDistanceLabel(instrument: MarketInstrument): 'pips' | 'ticks' {
  return instrument.asset_class === 'fx' && instrument.pip_size ? 'pips' : 'ticks';
}

export function distancePresets(instrument: MarketInstrument): number[] {
  if (instrument.asset_class === 'fx') return [5, 10, 15, 20, 30];
  if (instrument.asset_class === 'metal') return [10, 20, 30, 50, 100];
  if (instrument.asset_class === 'index') return [5, 10, 20, 30, 50];
  if (instrument.asset_class === 'crypto') return [10, 20, 50, 100, 200];
  if (instrument.asset_class === 'stock') return [5, 10, 20, 50, 100];
  return [5, 10, 20, 30, 50];
}

export function priceAtDistance(
  instrument: MarketInstrument,
  entry: number,
  direction: 'long' | 'short',
  distance: number,
  side: 'stop' | 'target',
): number {
  const delta = distance * instrumentDistanceStep(instrument);
  const signed = direction === 'long' ? (side === 'stop' ? -delta : delta) : (side === 'stop' ? delta : -delta);
  return roundInstrumentPrice(instrument, entry + signed);
}

export function defaultTradeLevels(instrument: MarketInstrument, entry: number, direction: 'long' | 'short') {
  const stopTicks = instrument.default_stop_ticks ?? 20;
  const targetR = instrument.default_target_r ?? 2;
  const distance = stopTicks * instrumentDistanceStep(instrument);
  const stop = priceAtDistance(instrument, entry, direction, stopTicks, 'stop');
  const target = roundInstrumentPrice(instrument, entry + (direction === 'long' ? distance * targetR : -distance * targetR));
  return { stop, target };
}

export function formatInstrumentPrice(instrument: MarketInstrument, value: number): string {
  return value.toFixed(instrument.price_precision);
}

export function examplePriceIsUnconfirmed(value: number | null | undefined, instrument: MarketInstrument | null): boolean {
  return value != null && instrument?.example_price != null && value === instrument.example_price;
}
