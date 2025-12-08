-- Enhanced Goals Migration
-- Adds account linking, networth tracking, and progress history

-- Add new columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS linked_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS track_networth boolean NOT NULL DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS starting_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create goal_progress_history table to track progress over time
CREATE TABLE IF NOT EXISTS goal_progress_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL,
  note text,
  CONSTRAINT goal_progress_history_unique UNIQUE (goal_id, recorded_at)
);

-- Add RLS policies for goal_progress_history
ALTER TABLE goal_progress_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_select" ON goal_progress_history;
DROP POLICY IF EXISTS "own_rows_crud" ON goal_progress_history;

CREATE POLICY "own_rows_select" ON goal_progress_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_rows_crud" ON goal_progress_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_date ON goal_progress_history(goal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_linked_account ON goals(linked_account_id);

-- Function to automatically record goal progress when current_amount changes
CREATE OR REPLACE FUNCTION record_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if current_amount changed
  IF (TG_OP = 'UPDATE' AND NEW.current_amount != OLD.current_amount) OR TG_OP = 'INSERT' THEN
    INSERT INTO goal_progress_history (goal_id, user_id, recorded_at, amount, note)
    VALUES (NEW.id, NEW.user_id, NOW(), NEW.current_amount, 'Auto-recorded')
    ON CONFLICT (goal_id, recorded_at) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-record progress
DROP TRIGGER IF EXISTS trigger_record_goal_progress ON goals;
CREATE TRIGGER trigger_record_goal_progress
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION record_goal_progress();

-- Function to sync goal from linked account
CREATE OR REPLACE FUNCTION sync_goal_from_account(p_goal_id uuid)
RETURNS void AS $$
DECLARE
  v_account_balance numeric;
  v_user_id uuid;
BEGIN
  -- Get the account balance and update the goal
  UPDATE goals g
  SET current_amount = a.balance,
      updated_at = NOW()
  FROM accounts a
  WHERE g.id = p_goal_id
    AND g.linked_account_id = a.id
    AND a.balance IS NOT NULL
  RETURNING g.user_id INTO v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync goal from networth
CREATE OR REPLACE FUNCTION sync_goal_from_networth(p_goal_id uuid, p_month char(7))
RETURNS void AS $$
BEGIN
  UPDATE goals g
  SET current_amount = (n.assets - n.liabilities),
      updated_at = NOW()
  FROM networth n
  WHERE g.id = p_goal_id
    AND g.track_networth = true
    AND n.user_id = g.user_id
    AND n.month = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on new columns
COMMENT ON COLUMN goals.linked_account_id IS 'Optional account to track for automatic progress updates';
COMMENT ON COLUMN goals.track_networth IS 'If true, track total networth instead of account';
COMMENT ON COLUMN goals.starting_amount IS 'Initial amount when goal was created';
COMMENT ON COLUMN goals.created_at IS 'When the goal was created';
COMMENT ON COLUMN goals.updated_at IS 'Last time the goal was modified';
