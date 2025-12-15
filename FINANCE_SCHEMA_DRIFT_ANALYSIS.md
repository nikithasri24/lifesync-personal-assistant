# Finance Module: Schema Drift Analysis

**Status**: 70% Complete
**Last Updated**: December 15, 2025
**Priority**: High

---

## Executive Summary

The Finance module has experienced **schema drift** between the TypeScript type definitions and the actual Supabase database schema. Several migration files have been created to address these issues, but the alignment is not yet complete.

### Current State
- ✅ **70% Complete**: Core tables aligned, budgets schema fixed, categorization added
- ⚠️ **30% Remaining**: Accounts schema missing 10 columns, retirement accounts, credit card features

---

## Schema Comparison

### 1. Accounts Table

#### Current Schema (20250115_finance_init.sql)
```sql
create table accounts (
  id uuid primary key,
  user_id uuid not null,
  institution_id uuid references institutions(id),
  name text not null,
  type text check (type in ('checking','savings','credit','brokerage','loan','investment')),
  balance numeric not null default 0,
  liability boolean not null default false,
  last_updated timestamptz not null default now()
);
```

#### TypeScript Type Definition (src/finance/types.ts)
```typescript
export type AccountType =
  | 'checking' | 'savings' | 'credit' | 'brokerage' | 'loan' | 'investment'
  | '401k' | '403b' | 'traditional_ira' | 'roth_ira' | 'sep_ira' | 'simple_ira' | 'hsa';

export type Account = {
  id: string;
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdatedISO: string;
  liability?: boolean;
  // Credit card specific fields - MISSING IN DB
  creditLimit?: number;
  apr?: number;
  paymentDueDay?: number;
  minimumPayment?: number;
  statementBalance?: number;
  statementDate?: string;
  // Rewards fields - MISSING IN DB
  annualFee?: number;
  annualFeeDueDate?: string;
  rewardsBalance?: number;
  rewardsType?: RewardsType;
  baseRewardsRate?: number;
};
```

#### ❌ **SCHEMA DRIFT IDENTIFIED**

**Missing Columns** (11 total):
1. `credit_limit` NUMERIC - Credit card limit
2. `apr` NUMERIC - Annual percentage rate
3. `payment_due_day` INTEGER - Day of month (1-31)
4. `minimum_payment` NUMERIC - Minimum monthly payment
5. `statement_balance` NUMERIC - Last statement balance
6. `statement_date` DATE - Last statement date
7. `annual_fee` NUMERIC - Annual card fee
8. `annual_fee_due_date` DATE - When annual fee is charged
9. `rewards_balance` NUMERIC - Current rewards points/miles/cashback
10. `rewards_type` TEXT - Type: 'points', 'miles', 'cashback'
11. `base_rewards_rate` NUMERIC - Base earning rate (e.g., 1.0 = 1%)

**Missing Account Types** (7 types):
- `'401k'`
- `'403b'`
- `'traditional_ira'`
- `'roth_ira'`
- `'sep_ira'`
- `'simple_ira'`
- `'hsa'`

**Status**: ❌ NOT FIXED (0% complete)

---

### 2. Budgets Table

#### Current Schema (After 20251117000003_fix_budgets_schema_drift.sql)
```sql
create table budgets (
  id uuid primary key,
  user_id uuid not null,
  category_id uuid references categories(id) not null,
  month char(7) not null,
  limit_amount numeric not null,
  UNIQUE (user_id, category_id, month)
);
```

#### TypeScript Type
```typescript
export type Budget = {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  limit: number;
};
```

**Status**: ✅ FIXED (100% complete)

**Fixed Issues**:
- ✅ Removed `name` column (schema drift)
- ✅ Added unique constraint on (user_id, category_id, month)
- ✅ Made category_id, month, limit_amount NOT NULL
- ✅ Added foreign key constraint to categories
- ✅ Added indexes for performance

**Migrations Applied**:
1. `20251117000003_fix_budgets_schema_drift.sql` - Primary fix
2. `20251117_fix_budgets_schema_properly.sql` - Additional cleanup
3. `20251117000002_budget_unique_constraint.sql` - Unique constraint
4. `20251117120000_finance_fix.sql` - Indexes and NOT NULL constraints

---

### 3. Transactions Table

#### Current Schema (After 20251117120000_finance_fix.sql)
```sql
create table transactions (
  id uuid primary key,
  user_id uuid not null,
  account_id uuid references accounts(id),
  date timestamptz not null,
  description text not null,
  category_id uuid references categories(id),
  amount numeric not null,
  type text check (type in ('debit','credit')) not null,
  notes text,
  -- Added by 20251117120000_finance_fix.sql
  merchant_name text,
  confidence_score decimal(3,2),
  suggested_category_id uuid,
  categorization_rule_id uuid
);
```

#### TypeScript Type
```typescript
export type Transaction = {
  id: string;
  accountId: string;
  dateISO: string;
  description: string;
  categoryId?: string;
  amount: number;
  type: TxnType;
  notes?: string;
  merchantName?: string;
  confidenceScore?: number;
  suggestedCategoryId?: string;
  categorizationRuleId?: string;
};
```

**Status**: ✅ FIXED (100% complete)

**Fixed Issues**:
- ✅ Added `merchant_name` column
- ✅ Added `confidence_score` column (0-1)
- ✅ Added `suggested_category_id` column
- ✅ Added `categorization_rule_id` column
- ✅ Added indexes for uncategorized transactions
- ✅ Added merchant search index

---

### 4. New Tables Added

#### ✅ categorization_rules Table (ADDED)
Created by `20251117120000_finance_fix.sql`

```sql
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_pattern TEXT NOT NULL,
  description_keywords TEXT[],
  amount_min DECIMAL(10,2),
  amount_max DECIMAL(10,2),
  category_id UUID NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  priority INTEGER DEFAULT 100,
  rule_type TEXT DEFAULT 'user_created',
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status**: ✅ IMPLEMENTED (100% complete)

---

#### ✅ merchant_database Table (ADDED)
Created by `20251117120000_finance_fix.sql`

```sql
CREATE TABLE merchant_database (
  id UUID PRIMARY KEY,
  merchant_name TEXT NOT NULL UNIQUE,
  aliases TEXT[],
  default_category_name TEXT NOT NULL,
  default_subcategory TEXT,
  merchant_type TEXT,
  match_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.9,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status**: ✅ IMPLEMENTED (100% complete)

---

#### ✅ budget_templates Table (ADDED)
Created by `20251117_add_budget_templates.sql`

```sql
CREATE TABLE budget_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES categories(id),
  default_amount NUMERIC NOT NULL
);
```

**TypeScript Type**:
```typescript
export type BudgetTemplate = {
  id: string;
  categoryId: string;
  defaultAmount: number;
};
```

**Status**: ✅ IMPLEMENTED (100% complete)

---

### 5. Categories Table

#### Current Schema
```sql
create table categories (
  id uuid primary key,
  user_id uuid not null,
  name text not null,
  parent_id uuid references categories(id),
  icon text,
  color text
);
```

#### TypeScript Type
```typescript
export type Category = {
  id: string;
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
};
```

**Status**: ✅ ALIGNED (100% complete)

---

### 6. Goals Table

#### Current Schema
```sql
create table goals (
  id uuid primary key,
  user_id uuid not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  due_date date not null,
  type text check (type in ('savings','debt')) not null,
  linked_category_id uuid references categories(id)
);
```

#### TypeScript Type
```typescript
export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startingAmount: number; // MISSING
  dueDateISO: string;
  type: GoalType;
  linkedCategoryId?: string;
  linkedAccountId?: string; // MISSING
  trackNetworth?: boolean; // MISSING
  createdAtISO?: string; // MISSING
  updatedAtISO?: string; // MISSING
};
```

#### ⚠️ **SCHEMA DRIFT IDENTIFIED**

**Missing Columns** (5 total):
1. `starting_amount` NUMERIC - Initial goal amount
2. `linked_account_id` UUID - Track from account balance
3. `track_networth` BOOLEAN - Track total networth instead
4. `created_at` TIMESTAMPTZ - Creation timestamp
5. `updated_at` TIMESTAMPTZ - Last update timestamp

**Status**: ⚠️ PARTIALLY FIXED (60% complete)

---

## Migration Files Summary

| Migration File | Purpose | Status |
|---------------|---------|--------|
| `20250115_finance_init.sql` | Initial schema creation | ✅ Applied |
| `20250117_import_finance_data.sql` | Import sample data | ✅ Applied |
| `20251117_add_budget_templates.sql` | Add budget templates table | ✅ Applied |
| `20251117_fix_budgets_schema_properly.sql` | Fix budgets schema | ✅ Applied |
| `20251117000002_budget_unique_constraint.sql` | Add unique constraint | ✅ Applied |
| `20251117000003_fix_budgets_schema_drift.sql` | Comprehensive budget fix | ✅ Applied |
| `20251117120000_finance_fix.sql` | Add categorization features | ✅ Applied |

---

## Completion Status by Table

| Table | Expected Columns | Current Columns | Missing Columns | % Complete | Status |
|-------|-----------------|-----------------|-----------------|------------|--------|
| **institutions** | 4 | 4 | 0 | 100% | ✅ |
| **categories** | 6 | 6 | 0 | 100% | ✅ |
| **budgets** | 5 | 5 | 0 | 100% | ✅ |
| **budget_templates** | 4 | 4 | 0 | 100% | ✅ |
| **transactions** | 12 | 12 | 0 | 100% | ✅ |
| **categorization_rules** | 14 | 14 | 0 | 100% | ✅ |
| **merchant_database** | 9 | 9 | 0 | 100% | ✅ |
| **networth** | 4 | 4 | 0 | 100% | ✅ |
| **accounts** | 19 | 8 | **11** | **42%** | ❌ |
| **goals** | 12 | 7 | **5** | **58%** | ⚠️ |

**Overall Completion**: **70%** (8 of 10 tables fully aligned)

---

## Outstanding Issues

### High Priority

#### 1. Accounts Table Missing Credit Card Features (❌ NOT FIXED)
**Impact**: High - Prevents credit card tracking functionality
**Affected Features**:
- Credit card payment tracking
- Statement balance monitoring
- Rewards points/miles tracking
- APR and interest calculations
- Annual fee tracking

**Required Migration**:
```sql
-- Add credit card specific columns
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS apr NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS minimum_payment NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS statement_balance NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS statement_date DATE;

-- Add rewards columns
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS annual_fee NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS annual_fee_due_date DATE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS rewards_balance NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS rewards_type TEXT CHECK (rewards_type IN ('points', 'miles', 'cashback'));
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS base_rewards_rate NUMERIC;

-- Update account type constraint to include retirement accounts
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK (type IN (
    'checking', 'savings', 'credit', 'brokerage', 'loan', 'investment',
    '401k', '403b', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa'
  ));
```

**Estimated Time**: 2 hours
**Risk**: Low (all columns are optional)

---

#### 2. Goals Table Missing Enhancement Columns (⚠️ PARTIALLY FIXED)
**Impact**: Medium - Limits goal tracking capabilities
**Affected Features**:
- Cannot track starting amount vs current progress
- Cannot link goals to accounts for auto-tracking
- Cannot track networth as a goal
- Missing audit trail (created_at, updated_at)

**Required Migration**:
```sql
-- Add missing goal columns
ALTER TABLE goals ADD COLUMN IF NOT EXISTS starting_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS linked_account_id UUID REFERENCES accounts(id);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS track_networth BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_type ON goals(user_id, type);
CREATE INDEX IF NOT EXISTS idx_goals_linked_account ON goals(linked_account_id) WHERE linked_account_id IS NOT NULL;
```

**Estimated Time**: 1 hour
**Risk**: Low (all columns are optional or have defaults)

---

### Medium Priority

#### 3. Missing Tables from TypeScript Types

**credit_card_statements** - Referenced in types.ts but no table exists
```typescript
export type CreditCardStatement = {
  id: string;
  accountId: string;
  statementDate: string;
  // ... more fields
};
```

**Estimated Time**: 3 hours (including testing)
**Risk**: Medium (new feature, requires design review)

---

## Remediation Plan

### Phase 1: Critical Schema Alignment (4 hours)
**Target**: 85% completion

1. **Create Accounts Extension Migration** (2 hours)
   - File: `supabase/migrations/20251215000001_add_account_credit_card_fields.sql`
   - Add all 11 missing columns to accounts table
   - Update type constraint for retirement accounts
   - Add indexes for credit card queries

2. **Create Goals Enhancement Migration** (1 hour)
   - File: `supabase/migrations/20251215000002_enhance_goals_table.sql`
   - Add 5 missing columns to goals table
   - Add indexes for linked accounts and type filtering

3. **Test & Validate** (1 hour)
   - Run migrations on dev environment
   - Verify TypeScript types align with schema
   - Test CRUD operations on all affected tables

---

### Phase 2: Optional Enhancements (6 hours)
**Target**: 100% completion

1. **Credit Card Statements Table** (3 hours)
   - Design schema
   - Create migration
   - Add RLS policies
   - Add indexes

2. **Additional Finance Features** (3 hours)
   - Investment holdings table (if needed)
   - Recurring transactions table (if needed)
   - Tax categories table (if needed)

---

## Testing Checklist

After applying migrations:

### Accounts Table
- [ ] Can create checking/savings accounts
- [ ] Can create credit card with all fields (limit, APR, rewards)
- [ ] Can create retirement accounts (401k, IRA, HSA)
- [ ] Can track statement balance and due dates
- [ ] Can track rewards points/miles/cashback

### Budgets Table
- [ ] Can create budgets for categories
- [ ] Unique constraint works (no duplicate category+month per user)
- [ ] Can update budget amounts
- [ ] Foreign key to categories works

### Transactions Table
- [ ] Can add merchant name during transaction creation
- [ ] Can store AI categorization suggestions
- [ ] Can link to categorization rules
- [ ] Uncategorized transactions index works

### Goals Table
- [ ] Can create savings/debt goals
- [ ] Can track starting amount separately
- [ ] Can link goal to account for auto-tracking
- [ ] Can mark goal to track networth
- [ ] Created/updated timestamps work

---

## Success Metrics

**Current State:**
- 8/10 tables fully aligned (80%)
- 7 migration files applied
- Core functionality working

**Target State (85%):**
- 9/10 tables fully aligned
- Accounts table with credit card support
- Goals table with enhanced tracking
- All existing features working

**Target State (100%):**
- 10/10 tables fully aligned
- All optional tables created
- Comprehensive test coverage
- Full TypeScript/SQL alignment

---

## Risks & Mitigations

### Risk 1: Breaking Changes
**Mitigation**: All new columns are optional (nullable or have defaults)

### Risk 2: Data Migration Issues
**Mitigation**: Migrations use IF NOT EXISTS and conditional logic

### Risk 3: Performance Impact
**Mitigation**: Add indexes at same time as columns

### Risk 4: RLS Policy Gaps
**Mitigation**: Verify all new tables/columns have proper RLS policies

---

## Next Steps

1. **Review this analysis** with team
2. **Prioritize** missing features (credit cards vs retirement vs goals)
3. **Create migrations** for Phase 1 (critical alignment)
4. **Test thoroughly** on dev environment
5. **Deploy** to production in stages
6. **Update documentation** to reflect new schema

---

## Related Documentation

- `supabase/migrations_archive/20251117000003_fix_budgets_schema_drift.sql` - Budget fixes
- `supabase/migrations_archive/20251117120000_finance_fix.sql` - Categorization features
- `src/finance/types.ts` - TypeScript type definitions
- `src/finance/data/supabaseApi.ts` - Database access layer

---

**Document Version**: 1.0
**Created**: December 15, 2025
**Status**: Ready for Review
