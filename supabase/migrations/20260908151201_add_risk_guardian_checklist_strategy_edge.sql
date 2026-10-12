/*
# Add Risk Guardian, Pre-Trade Checklist & Strategy Edge Data

## Overview
This migration adds the database infrastructure for three major features:
1. Risk Guardian — daily loss limits, max trades per day, risk per trade
2. Pre-Trade Checklist — configurable checklist that traders must complete before saving a trade
3. Strategy Edge Score — stores computed strategy scores for caching

## New Tables

### `risk_settings`
Per-user risk management configuration.
- id (uuid PK)
- user_id (uuid FK to auth.users, NOT NULL DEFAULT auth.uid())
- max_daily_loss_pct (numeric, default 3.0) — max % of account willing to lose per day
- max_daily_trades (int, default 5) — max trades allowed per day
- max_risk_per_trade_pct (numeric, default 1.0) — max risk % per individual trade
- account_balance (numeric, default 10000) — starting/current account balance for calculations
- max_drawdown_pct (numeric, default 10.0) — max acceptable drawdown from peak equity
- daily_loss_limit_amount (numeric, nullable) — absolute dollar amount (overrides pct if set)
- created_at, updated_at (timestamps)

### `pre_trade_checklist`
Per-user configurable checklist items shown before trade entry.
- id (uuid PK)
- user_id (uuid FK to auth.users, NOT NULL DEFAULT auth.uid())
- label (text, NOT NULL) — the checklist item text
- is_required (boolean, default true) — if true, must be checked to save
- sort_order (int, default 0) — display ordering
- is_active (boolean, default true) — soft delete / disable
- created_at, updated_at (timestamps)

## Modified Tables

### `trades`
- Added `checklist_items` (jsonb, nullable) — array of {label, checked} snapshot at trade entry time
- Added `checklist_override_reason` (text, nullable) — if trader overrode an unchecked required item
- Added `checklist_completed` (boolean, default false) — whether all required items were checked

## Security
- `risk_settings`: RLS enabled. Owner-scoped CRUD (authenticated only).
- `pre_trade_checklist`: RLS enabled. Owner-scoped CRUD (authenticated only).
- `trades`: existing policies remain compatible (jsonb column addition is covered by existing UPDATE policy).

## Important Notes
1. Each user gets one risk_settings row (upserted on first save)
2. Default checklist items are seeded when a user first accesses the checklist (via frontend, not migration)
3. The jsonb checklist_items on trades is a snapshot — it stores the state at the time of trade entry, not a live reference
4. Existing trades get checklist_completed = false (they were entered before this feature)
*/