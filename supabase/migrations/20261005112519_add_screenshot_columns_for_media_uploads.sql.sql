/*
# Add screenshot/image columns to content tables

## Purpose
Enable image uploads (chart screenshots, cover images, example images) across
multiple content pages: forward trades, strategy test trades, strategy test
sessions, backtests, trading setups, journal entries, weekly reviews, notes,
study materials, and resources.

## Changes
All columns are nullable text, defaulting to NULL, so existing rows are
unaffected. No data is lost or transformed.

### New columns:
1. `forward_trades.screenshot_url` — entry/exit chart screenshot for a paper trade
2. `strategy_test_trades.screenshot_url` — chart screenshot for a single test trade
3. `strategy_test_sessions.screenshot_url` — summary chart image for a test session
4. `backtest_results.screenshot_url` — equity curve or strategy result chart image
5. `trading_setups.screenshot_url` — example chart image for a trading setup
6. `journal_entries.screenshot_url` — session chart screenshot attached to a journal entry
7. `weekly_reviews.screenshot_url` — weekly recap chart image
8. `notes.screenshot_url` — chart markup or visual reference image
9. `study_materials.cover_image_url` — cover/thumbnail image for a study item
10. `resources.thumbnail_url` — thumbnail/cover image for a resource

## Security
No policy changes needed — all tables already have owner-scoped RLS policies
that cover all columns on the table. The new columns inherit those policies
automatically.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forward_trades' AND column_name = 'screenshot_url') THEN
    ALTER TABLE forward_trades ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategy_test_trades' AND column_name = 'screenshot_url') THEN
    ALTER TABLE strategy_test_trades ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategy_test_sessions' AND column_name = 'screenshot_url') THEN
    ALTER TABLE strategy_test_sessions ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backtest_results' AND column_name = 'screenshot_url') THEN
    ALTER TABLE backtest_results ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_setups' AND column_name = 'screenshot_url') THEN
    ALTER TABLE trading_setups ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'screenshot_url') THEN
    ALTER TABLE journal_entries ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reviews' AND column_name = 'screenshot_url') THEN
    ALTER TABLE weekly_reviews ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'screenshot_url') THEN
    ALTER TABLE notes ADD COLUMN screenshot_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_materials' AND column_name = 'cover_image_url') THEN
    ALTER TABLE study_materials ADD COLUMN cover_image_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE resources ADD COLUMN thumbnail_url text;
  END IF;
END $$;