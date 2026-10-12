/*
# Link entities across the trading platform

## Purpose
Connect previously siloed modules so data flows between strategies, setups,
trades, forward tests, backtests, strategy test sessions, journal entries,
and weekly reviews. This enables cross-entity reporting and a unified
strategy hub view.

## Changes

### New foreign key columns:
1. `forward_trades.strategy_id` — links a paper trade to a TraderStrategy
2. `forward_trades.setup_id` — links a paper trade to a TradingSetup
3. `backtest_results.strategy_id` — links a backtest to a TraderStrategy
4. `strategy_test_sessions.strategy_id` — links a test session to a TraderStrategy (replaces free-text strategy_name for querying)
5. `journal_entries.strategy_id` — links a journal entry to a strategy being practiced
6. `journal_entries.linked_trade_ids` — text[] array of trade IDs referenced by the entry
7. `weekly_reviews.strategy_id` — links a weekly review to the primary strategy used that week
8. `trades.setup_id` — links a live trade to a TradingSetup

### New foreign key constraints:
- forward_trades.strategy_id → trader_strategies(id) ON DELETE SET NULL
- forward_trades.setup_id → trading_setups(id) ON DELETE SET NULL
- backtest_results.strategy_id → trader_strategies(id) ON DELETE SET NULL
- strategy_test_sessions.strategy_id → trader_strategies(id) ON DELETE SET NULL
- journal_entries.strategy_id → trader_strategies(id) ON DELETE SET NULL
- weekly_reviews.strategy_id → trader_strategies(id) ON DELETE SET NULL
- trades.setup_id → trading_setups(id) ON DELETE SET NULL

All FKs use ON DELETE SET NULL so deleting a strategy/setup doesn't lose trade data.

### Security
No policy changes needed — all tables already have owner-scoped RLS policies
covering all columns. New columns inherit those policies automatically.
*/

DO $$
BEGIN
  -- forward_trades: strategy_id + setup_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forward_trades' AND column_name = 'strategy_id') THEN
    ALTER TABLE forward_trades ADD COLUMN strategy_id uuid;
    ALTER TABLE forward_trades ADD CONSTRAINT fk_forward_trades_strategy FOREIGN KEY (strategy_id) REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forward_trades' AND column_name = 'setup_id') THEN
    ALTER TABLE forward_trades ADD COLUMN setup_id uuid;
    ALTER TABLE forward_trades ADD CONSTRAINT fk_forward_trades_setup FOREIGN KEY (setup_id) REFERENCES trading_setups(id) ON DELETE SET NULL;
  END IF;

  -- backtest_results: strategy_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backtest_results' AND column_name = 'strategy_id') THEN
    ALTER TABLE backtest_results ADD COLUMN strategy_id uuid;
    ALTER TABLE backtest_results ADD CONSTRAINT fk_backtest_strategy FOREIGN KEY (strategy_id) REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;

  -- strategy_test_sessions: strategy_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategy_test_sessions' AND column_name = 'strategy_id') THEN
    ALTER TABLE strategy_test_sessions ADD COLUMN strategy_id uuid;
    ALTER TABLE strategy_test_sessions ADD CONSTRAINT fk_strategy_test_session_strategy FOREIGN KEY (strategy_id) REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;

  -- journal_entries: strategy_id + linked_trade_ids
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'strategy_id') THEN
    ALTER TABLE journal_entries ADD COLUMN strategy_id uuid;
    ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_strategy FOREIGN KEY (strategy_id) REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'linked_trade_ids') THEN
    ALTER TABLE journal_entries ADD COLUMN linked_trade_ids text[] DEFAULT '{}';
  END IF;

  -- weekly_reviews: strategy_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reviews' AND column_name = 'strategy_id') THEN
    ALTER TABLE weekly_reviews ADD COLUMN strategy_id uuid;
    ALTER TABLE weekly_reviews ADD CONSTRAINT fk_weekly_review_strategy FOREIGN KEY (strategy_id) REFERENCES trader_strategies(id) ON DELETE SET NULL;
  END IF;

  -- trades: setup_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'setup_id') THEN
    ALTER TABLE trades ADD COLUMN setup_id uuid;
    ALTER TABLE trades ADD CONSTRAINT fk_trades_setup FOREIGN KEY (setup_id) REFERENCES trading_setups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for the new FK columns for faster strategy-based queries
CREATE INDEX IF NOT EXISTS idx_forward_trades_strategy_id ON forward_trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_forward_trades_setup_id ON forward_trades(setup_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy_id ON backtest_results(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_test_sessions_strategy_id ON strategy_test_sessions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_strategy_id ON journal_entries(strategy_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_strategy_id ON weekly_reviews(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_setup_id ON trades(setup_id);