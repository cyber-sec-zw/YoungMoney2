import assert from 'node:assert/strict';
import test from 'node:test';
import type { MarketInstrument } from './types.ts';
import { calculatePositionSize, instrumentPnl } from './instrumentMath.ts';

const eurUsd: MarketInstrument = {
  id: 'eurusd-fixture', user_id: null, symbol: 'EUR/USD', display_name: 'Euro / US Dollar',
  asset_class: 'fx', chart_symbol: null, base_currency: 'EUR', quote_currency: 'USD',
  price_increment: 0.00001, pip_size: 0.0001, price_precision: 5, contract_multiplier: 100000,
  quantity_unit: 'lots', example_price: 1.1, example_size: 0.1, tick_value: 1,
  created_at: '2026-01-01T00:00:00.000Z',
};

test('instrument P&L respects direction and quote-to-account conversion', () => {
  assert.ok(Math.abs(instrumentPnl(eurUsd, 'long', 1.1, 1.101, 1, 0.9) - 90) < 1e-8);
  assert.ok(Math.abs(instrumentPnl(eurUsd, 'short', 1.101, 1.1, 1, 0.9) - 90) < 1e-8);
  assert.ok(Math.abs(instrumentPnl(eurUsd, 'long', 1.1, 1.099, 1, 0.9) + 90) < 1e-8);
});

test('suggested lot size rounds down and rejects invalid inputs', () => {
  const size = calculatePositionSize(eurUsd, 10.555, 1, 1.1, 1.09999, 1);
  assert.equal(size, 0.1);
  assert.ok(size! <= 10.555 * 0.01 / (instrumentPnl(eurUsd, 'long', 1.1, 1.09999, 1) * -1));
  assert.equal(calculatePositionSize(eurUsd, 10_000, 1, 1.1, 1.1, 1), null);
  assert.equal(calculatePositionSize(eurUsd, 10_000, 1, 1.1, 1.09, 0), null);
  assert.ok(Number.isNaN(instrumentPnl(eurUsd, 'long', 1.1, 1.101, 1, 0)));
});