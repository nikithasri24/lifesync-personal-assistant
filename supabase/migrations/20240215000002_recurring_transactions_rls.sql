-- Enable Row Level Security on recurring_transactions
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on pending_transactions
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RECURRING TRANSACTIONS RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own recurring transactions
CREATE POLICY "Users can view their own recurring transactions"
  ON recurring_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own recurring transactions
CREATE POLICY "Users can insert their own recurring transactions"
  ON recurring_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recurring transactions
CREATE POLICY "Users can update their own recurring transactions"
  ON recurring_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own recurring transactions
CREATE POLICY "Users can delete their own recurring transactions"
  ON recurring_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PENDING TRANSACTIONS RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own pending transactions
CREATE POLICY "Users can view their own pending transactions"
  ON pending_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own pending transactions
CREATE POLICY "Users can insert their own pending transactions"
  ON pending_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending transactions
CREATE POLICY "Users can update their own pending transactions"
  ON pending_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pending transactions
CREATE POLICY "Users can delete their own pending transactions"
  ON pending_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_transactions TO authenticated;

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
