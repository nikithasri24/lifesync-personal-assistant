-- Allow accounts to be archived (hidden from main view, still accessible)
ALTER TABLE finance_accounts
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS finance_accounts_is_archived_idx
  ON finance_accounts(is_archived)
  WHERE is_archived = TRUE;
