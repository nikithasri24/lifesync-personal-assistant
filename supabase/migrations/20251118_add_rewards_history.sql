-- Migration: Add Credit Card Rewards History Tracking
-- Tracks points/miles/cashback earned and redeemed over time

-- Create rewards history table
CREATE TABLE IF NOT EXISTS rewards_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  points_earned numeric NOT NULL DEFAULT 0,
  points_redeemed numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL,
  description text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE rewards_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_rewards_history_crud" ON rewards_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_rewards_history_select" ON rewards_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rewards_history_account_date
  ON rewards_history(account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_history_user_date
  ON rewards_history(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_history_transaction
  ON rewards_history(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- Create function to automatically log rewards when transactions are added
-- This function will be called by a trigger to automatically track points based on category bonuses
CREATE OR REPLACE FUNCTION calculate_and_log_rewards()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  bonus_rate numeric := 1.0;
  points_to_add numeric := 0;
  new_balance numeric := 0;
BEGIN
  -- Only process for credit card accounts
  SELECT a.*, a.base_rewards_rate, a.rewards_balance, a.rewards_type
  INTO account_record
  FROM accounts a
  WHERE a.id = NEW.account_id AND a.type = 'credit';

  -- If not a credit card or no rewards program, skip
  IF NOT FOUND OR account_record.rewards_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only track rewards for expenses (purchases)
  IF NEW.type = 'expense' AND NEW.amount < 0 THEN
    -- Check if there's a category bonus for this category
    SELECT COALESCE(MAX(rewards_rate), account_record.base_rewards_rate, 1.0)
    INTO bonus_rate
    FROM card_category_bonuses
    WHERE account_id = NEW.account_id
      AND category = NEW.category
      AND (start_date IS NULL OR start_date <= NEW.date)
      AND (end_date IS NULL OR end_date >= NEW.date);

    -- Calculate points earned (absolute value of amount * bonus rate)
    IF account_record.rewards_type = 'cashback' THEN
      -- For cashback, earn percentage of spend
      points_to_add := ABS(NEW.amount) * (bonus_rate / 100);
    ELSE
      -- For points/miles, earn per dollar
      points_to_add := ABS(NEW.amount) * bonus_rate;
    END IF;

    -- Calculate new balance
    new_balance := COALESCE(account_record.rewards_balance, 0) + points_to_add;

    -- Update account rewards balance
    UPDATE accounts
    SET rewards_balance = new_balance
    WHERE id = NEW.account_id;

    -- Log the rewards earned
    INSERT INTO rewards_history (
      user_id,
      account_id,
      date,
      points_earned,
      points_redeemed,
      balance,
      description,
      transaction_id,
      category
    ) VALUES (
      NEW.user_id,
      NEW.account_id,
      NEW.date,
      points_to_add,
      0,
      new_balance,
      'Earned from: ' || NEW.description,
      NEW.id,
      NEW.category
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log rewards (disabled by default, can be enabled by user)
-- Users can choose to manually track or enable automatic tracking
-- CREATE TRIGGER auto_log_rewards
--   AFTER INSERT ON transactions
--   FOR EACH ROW
--   EXECUTE FUNCTION calculate_and_log_rewards();
