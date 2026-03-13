-- Add tags column to finance_transactions
-- Tags are an array of strings (e.g. ['channel trip', 'vacation'])
-- GIN index enables fast filtering: WHERE 'channel trip' = ANY(tags)

ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS finance_transactions_tags_idx
  ON finance_transactions USING gin(tags);
