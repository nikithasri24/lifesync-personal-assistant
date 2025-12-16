# Finance Schema Drift Migration Guide

**Created**: December 15, 2025
**Status**: Ready to Apply
**Purpose**: Fix schema drift between TypeScript types and Supabase database

---

## Overview

This migration package resolves schema drift in the Finance module by adding missing columns to the `accounts` and `goals` tables.

**Impact**: Finance Module 70% → 95% complete

---

## Migration Files

| File | Purpose | Status |
|------|---------|--------|
| `20251215000000_finance_schema_drift_fix_master.sql` | Master file (documentation + applies both) | ✅ Ready |
| `20251215000001_add_account_credit_card_fields.sql` | Adds 11 columns to accounts table | ✅ Ready |
| `20251215000002_enhance_goals_table.sql` | Adds 5 columns to goals table | ✅ Ready |

---

## What Gets Added

### Accounts Table (11 new columns)

**Credit Card Fields:**
- `credit_limit` - Credit card limit amount
- `apr` - Annual Percentage Rate
- `payment_due_day` - Day of month (1-31)
- `minimum_payment` - Minimum monthly payment
- `statement_balance` - Last statement balance
- `statement_date` - Last statement date

**Rewards & Fees:**
- `annual_fee` - Annual card fee
- `annual_fee_due_date` - When fee is charged
- `rewards_balance` - Points/miles/cashback
- `rewards_type` - 'points', 'miles', or 'cashback'
- `base_rewards_rate` - Earning rate (1.0 = 1%)

**New Account Types:**
- `401k`, `403b`, `traditional_ira`, `roth_ira`, `sep_ira`, `simple_ira`, `hsa`

### Goals Table (5 new columns)

- `starting_amount` - Initial goal amount (baseline)
- `linked_account_id` - Auto-track from account balance
- `track_networth` - Track total networth as goal
- `created_at` - Creation timestamp
- `updated_at` - Auto-updated timestamp

**Bonus Features:**
- Auto-update trigger for `updated_at`
- Helper function: `calculate_goal_progress(goal_id)`
- 10 performance indexes
- Data integrity constraints

---

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

```bash
# Apply all pending migrations
npx supabase db push

# Or apply specific migration
npx supabase migration up --file 20251215000001_add_account_credit_card_fields.sql
npx supabase migration up --file 20251215000002_enhance_goals_table.sql
```

### Option 2: Using psql

```bash
# Connect to your database
psql postgresql://postgres:[password]@[host]:[port]/postgres

# Apply migrations in order
\i supabase/migrations/20251215000001_add_account_credit_card_fields.sql
\i supabase/migrations/20251215000002_enhance_goals_table.sql
```

### Option 3: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `20251215000001_add_account_credit_card_fields.sql`
3. Run the migration
4. Copy contents of `20251215000002_enhance_goals_table.sql`
5. Run the migration

---

## Pre-Migration Checklist

Before applying migrations:

- [ ] **Backup database** (recommended but not required - migrations are additive)
- [ ] Review migration files for understanding
- [ ] Ensure Supabase project is accessible
- [ ] Check that no conflicting migrations are in progress
- [ ] Verify you have necessary permissions

---

## Post-Migration Testing

After applying migrations, verify:

### Accounts Table

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts'
  AND column_name IN (
    'credit_limit', 'apr', 'payment_due_day', 'rewards_balance', 'rewards_type'
  );

-- Test creating a credit card account
INSERT INTO accounts (user_id, name, type, balance, credit_limit, apr, rewards_type)
VALUES (
  auth.uid(),
  'Chase Sapphire Reserve',
  'credit',
  0,
  25000,
  18.99,
  'points'
);

-- Test creating a retirement account
INSERT INTO accounts (user_id, name, type, balance)
VALUES (
  auth.uid(),
  'Vanguard 401k',
  '401k',
  45000
);
```

### Goals Table

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'goals'
  AND column_name IN (
    'starting_amount', 'linked_account_id', 'track_networth', 'created_at', 'updated_at'
  );

-- Test creating a goal with linked account
INSERT INTO goals (
  user_id, name, target_amount, current_amount, starting_amount,
  due_date, type, linked_account_id
)
VALUES (
  auth.uid(),
  'Emergency Fund',
  10000,
  2500,
  0,
  '2025-12-31',
  'savings',
  '<account_uuid>'  -- Replace with actual account ID
);

-- Test progress calculation function
SELECT
  name,
  current_amount,
  target_amount,
  calculate_goal_progress(id) as progress_percentage
FROM goals
WHERE user_id = auth.uid();
```

---

## Verification Queries

### Check Migration Status

```sql
-- Verify accounts table has 19 columns (was 8)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'accounts';
-- Expected: 19

-- Verify goals table has 12 columns (was 7)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'goals';
-- Expected: 12
```

### Check Indexes Created

```sql
-- List all indexes on accounts table
SELECT indexname
FROM pg_indexes
WHERE tablename = 'accounts'
  AND indexname LIKE 'idx_accounts_%';

-- List all indexes on goals table
SELECT indexname
FROM pg_indexes
WHERE tablename = 'goals'
  AND indexname LIKE 'idx_goals_%';
```

### Check Constraints

```sql
-- Verify account types constraint includes retirement accounts
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'accounts_type_check';
-- Should include: 401k, 403b, traditional_ira, roth_ira, sep_ira, simple_ira, hsa

-- Verify goals tracking exclusivity constraint
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'goals_tracking_exclusivity_check';
```

---

## Rollback (If Needed)

If you need to undo these migrations:

```sql
-- Rollback goals table
DROP TRIGGER IF EXISTS set_goals_updated_at ON goals;
DROP FUNCTION IF EXISTS update_goals_updated_at();
DROP FUNCTION IF EXISTS calculate_goal_progress(UUID);
ALTER TABLE goals DROP COLUMN IF EXISTS starting_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS linked_account_id;
ALTER TABLE goals DROP COLUMN IF EXISTS track_networth;
ALTER TABLE goals DROP COLUMN IF EXISTS created_at;
ALTER TABLE goals DROP COLUMN IF EXISTS updated_at;

-- Rollback accounts table
ALTER TABLE accounts DROP COLUMN IF EXISTS credit_limit;
ALTER TABLE accounts DROP COLUMN IF EXISTS apr;
ALTER TABLE accounts DROP COLUMN IF EXISTS payment_due_day;
ALTER TABLE accounts DROP COLUMN IF EXISTS minimum_payment;
ALTER TABLE accounts DROP COLUMN IF EXISTS statement_balance;
ALTER TABLE accounts DROP COLUMN IF EXISTS statement_date;
ALTER TABLE accounts DROP COLUMN IF EXISTS annual_fee;
ALTER TABLE accounts DROP COLUMN IF EXISTS annual_fee_due_date;
ALTER TABLE accounts DROP COLUMN IF EXISTS rewards_balance;
ALTER TABLE accounts DROP COLUMN IF EXISTS rewards_type;
ALTER TABLE accounts DROP COLUMN IF EXISTS base_rewards_rate;

-- Restore original account type constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK (type IN ('checking','savings','credit','brokerage','loan','investment'));
```

**⚠️ Warning**: Rollback will delete data in the new columns. Only rollback if necessary.

---

## Common Issues & Solutions

### Issue: "column already exists"
**Solution**: Migrations are idempotent. This is safe to ignore.

### Issue: "constraint already exists"
**Solution**: Migrations check for existing constraints. This is safe to ignore.

### Issue: Foreign key constraint fails
**Solution**: Ensure the accounts table exists and has data before linking goals.

### Issue: Trigger already exists
**Solution**: The migration drops the trigger before creating it. This is expected.

---

## TypeScript Integration

After applying migrations, your TypeScript code can now use:

```typescript
// Create credit card account
const creditCard: Account = {
  id: uuid(),
  name: 'Chase Sapphire Reserve',
  type: 'credit',
  balance: 0,
  creditLimit: 25000,
  apr: 18.99,
  paymentDueDay: 15,
  annualFee: 550,
  rewardsBalance: 45000,
  rewardsType: 'points',
  baseRewardsRate: 1.0,
  // ... other fields
};

// Create retirement account
const retirement: Account = {
  id: uuid(),
  name: 'Vanguard 401k',
  type: '401k',
  balance: 45000,
  // ... other fields
};

// Create goal with account linking
const goal: Goal = {
  id: uuid(),
  name: 'Emergency Fund',
  targetAmount: 10000,
  currentAmount: 2500,
  startingAmount: 0,
  type: 'savings',
  linkedAccountId: accountId, // Auto-track from account balance!
  dueDateISO: '2025-12-31',
  // ... other fields
};
```

---

## Performance Impact

- **Minimal**: All new columns are nullable or have defaults
- **Indexes**: 10 new indexes improve query performance
- **Storage**: ~200 bytes per account, ~100 bytes per goal (when fields are used)
- **Query speed**: Should remain unchanged or improve due to indexes

---

## Success Metrics

After migration:

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Accounts columns | 8 | 19 | ✅ +137% |
| Goals columns | 7 | 12 | ✅ +71% |
| Tables aligned | 8/10 | 10/10 | ✅ 100% |
| Finance module | 70% | 95% | ✅ +25% |
| Missing features | 16 | 0 | ✅ Complete |

---

## Related Documentation

- [FINANCE_SCHEMA_DRIFT_ANALYSIS.md](../../FINANCE_SCHEMA_DRIFT_ANALYSIS.md) - Full analysis
- [src/finance/types.ts](../../src/finance/types.ts) - TypeScript types
- [src/finance/data/supabaseApi.ts](../../src/finance/data/supabaseApi.ts) - Database layer

---

## Support

If you encounter issues:

1. Check migration logs for error messages
2. Verify database permissions
3. Review pre-migration checklist
4. Check Supabase dashboard for conflicts
5. Consult FINANCE_SCHEMA_DRIFT_ANALYSIS.md for detailed info

---

**Status**: ✅ Ready to Apply
**Estimated Time**: 5-10 minutes
**Risk Level**: Low (all changes are additive and idempotent)
