import assert from 'node:assert/strict';
import test from 'node:test';
import type { Trade } from './types.ts';
import { computeDashboardStats, dailyPnlData, equityCurveData, groupByDayOfWeek, groupByPair } from './utils.ts';

function makeTrade(overrides: Partial<Trade>): Trade {
  return {
    id: 'trade-1',
    pair: 'EUR/USD',
    status: 'closed',
    outcome: 'win',
    pnl: 10,
    entry_time: '2026-10-19T22:00:00.000Z',
    exit_time: '2026-10-20T01:00:00.000Z',
    ...overrides,
  } as Trade;
}

test('realized metrics and breakdowns exclude open trades', () => {
  const trades = [
    makeTrade({}),
    makeTrade({ id: 'open-trade', status: 'open', outcome: null, exit_time: null, pnl: 500 }),
  ];

  assert.equal(computeDashboardStats(trades).totalPnl, 10);
  assert.equal(computeDashboardStats(trades).totalTrades, 1);
  assert.deepEqual(groupByPair(trades), [{ pair: 'EUR/USD', trades: 1, pnl: 10, winRate: 100 }]);
});

test('daily realized P&L, equity, and weekday grouping use close timestamps', () => {
  const trades = [
    makeTrade({}),
    makeTrade({ id: 'open-trade', status: 'open', outcome: null, exit_time: null, pnl: 500 }),
  ];
  const days = [new Date('2026-10-19T12:00:00.000Z'), new Date('2026-10-20T12:00:00.000Z')];

  assert.deepEqual(dailyPnlData(trades, days).map(day => day.pnl), [0, 10]);
  assert.equal(equityCurveData(trades)[0].date, '2026-10-20T01:00:00.000Z');
  assert.equal(groupByDayOfWeek(trades).find(day => day.day === 'Tue')?.pnl, 10);
});