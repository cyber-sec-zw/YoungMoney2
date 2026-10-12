/*
# Assign Legacy Journal Data to the First Trader

## Overview
Ensures any trades or journal entries created before authentication are not stranded
when the first trader creates an account.

## Modified Behavior
- Updates the existing `public.handle_new_user` signup trigger.
- After creating the new public profile, it assigns rows with a NULL `user_id` in
  `trades` and `journal_entries` to the newly created user.

## Security
- The trigger remains `SECURITY DEFINER` so it can safely complete the signup
  workflow without exposing privileged database access to browser clients.
- No new browser-callable function or policy is added.

## Important Notes
1. Only rows with NULL ownership are assigned.
2. Existing rows already owned by a user are never changed.
3. This is intended for legacy single-user data created before sign-in was introduced.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.trades
  SET user_id = NEW.id
  WHERE user_id IS NULL;

  UPDATE public.journal_entries
  SET user_id = NEW.id
  WHERE user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
