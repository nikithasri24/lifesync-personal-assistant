-- Add transfer_id to finance_transactions
-- Two legs of a transfer share the same transfer_id UUID.
-- This lets us exclude transfers from income/expense totals
-- and visually link the debit and credit sides in the UI.

ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS transfer_id UUID NULL;

CREATE INDEX IF NOT EXISTS finance_transactions_transfer_id_idx
  ON finance_transactions(transfer_id)
  WHERE transfer_id IS NOT NULL;
