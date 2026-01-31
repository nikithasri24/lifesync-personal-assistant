# Finance Module - Merged Mode Implementation Plan

## Executive Summary

This document provides a **complete implementation plan** for adding merged mode support to the Finance module, including all database migrations, RLS policies, API changes, and frontend updates for **all 13+ Finance pages**.

**Timeline:** 12-15 days for full implementation
**Complexity:** High (19+ database tables, 13+ pages, complex RLS policies)

---

## Table of Contents

1. [Database Tables Overview](#database-tables-overview)
2. [Migration Strategy](#migration-strategy)
3. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
4. [Database Migration SQL](#database-migration-sql)
5. [RLS Policy Templates](#rls-policy-templates)
6. [API Layer Changes](#api-layer-changes)
7. [Frontend Implementation](#frontend-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

---

## 1. Database Tables Overview

### 1.1 Core Finance Tables (19 Total)

Based on `STALE_TABLES_ANALYSIS.md` and codebase analysis:

| Table Name | Purpose | Needs connection_id | Priority |
|------------|---------|---------------------|----------|
| `finance_transactions` | Individual transactions | ✅ Yes | P0 - Critical |
| `finance_accounts` | Bank accounts, credit cards | ✅ Yes | P0 - Critical |
| `finance_categories` | Transaction categories | ✅ Yes | P0 - Critical |
| `finance_budgets` | Monthly budget limits | ✅ Yes | P0 - Critical |
| `finance_budget_templates` | Default budget templates | ✅ Yes | P1 - High |
| `finance_goals` | Financial goals | ✅ Yes | P0 - Critical |
| `finance_goal_progress` | Goal progress tracking | ✅ Yes | P1 - High |
| `finance_loans` | Loan tracking | ✅ Yes | P0 - Critical |
| `finance_loan_payments` | Loan payment history | ✅ Yes | P1 - High |
| `finance_retirement_accounts` | Retirement accounts | ✅ Yes | P0 - Critical |
| `finance_retirement_contributions` | Retirement contributions | ✅ Yes | P1 - High |
| `finance_card_benefits` | Credit card benefits | ✅ Yes | P1 - High |
| `finance_card_category_bonuses` | Credit card bonuses | ✅ Yes | P1 - High |
| `finance_welcome_bonuses` | Credit card welcome bonuses | ✅ Yes | P1 - High |
| `finance_card_offers` | Credit card offers | ✅ Yes | P2 - Medium |
| `recurring_bills` | Recurring transactions | ✅ Yes | P0 - Critical |
| `bill_payments` | Bill payment history | ✅ Yes | P1 - High |
| `categorization_rules` | Auto-categorization rules | ✅ Yes | P1 - High |
| `finance_institutions` | Bank institutions | ❌ No | P2 - Low |

**Additional Tables Needed:**
- `finance_insurance_policies` - Insurance tracking (NEW - needs creation)
- `finance_recurring_transactions` - Recurring templates (may already exist as `recurring_bills`)
- `finance_pending_transactions` - Pending transaction review (may need creation)

### 1.2 Tables NOT Requiring connection_id

- `finance_institutions` - Shared reference data (all users see same institutions)
- `finance_loans_with_stats` - View/computed table (no direct data storage)

---

## 2. Migration Strategy

### 2.1 Migration Approach

**Strategy:** Single comprehensive migration file with rollback support

**File:** `supabase/migrations_archive/20250130_finance_merge_support.sql`

**Why Single File:**
- All changes are related (merged mode support)
- Easier to test as a unit
- Simpler rollback if issues occur
- Follows pattern from successful modules (travel, visa, goals)

### 2.2 Migration Phases

1. **Phase 1:** Add `connection_id` columns to all tables
2. **Phase 2:** Create indexes on `connection_id` columns
3. **Phase 3:** Update RLS policies for SELECT operations
4. **Phase 4:** Update RLS policies for INSERT/UPDATE/DELETE operations
5. **Phase 5:** Create helper functions (if needed)
6. **Phase 6:** Verify policies work correctly

---

## 3. Phase-by-Phase Implementation

### Phase 1: Database Migration (Days 1-2)

**Goal:** Add merged mode support to all finance tables

**Tasks:**
1. ✅ Create migration SQL file
2. ✅ Add `connection_id` to all 19 tables
3. ✅ Create indexes for performance
4. ✅ Update RLS policies for all tables
5. ✅ Test RLS policies in Supabase SQL Editor
6. ✅ Run migration on development database
7. ✅ Verify data integrity

**Deliverables:**
- `20250130_finance_merge_support.sql` migration file
- Test SQL queries to verify RLS policies
- Documentation of changes

**Success Criteria:**
- All tables have `connection_id` column
- RLS policies allow viewing partner's data in merged mode
- No data loss or corruption
- Existing functionality still works

---

### Phase 2: API Layer & Types (Days 3-4)

**Goal:** Update API layer to support merged mode

**Tasks:**
1. ✅ Add `userId` field to all TypeScript types
2. ✅ Update `supabaseApi.ts` to include `userId` in mappings
3. ✅ Create `getFinancesMergedConnection()` function
4. ✅ Update `financeKeys` with `mergedConnection()` query key
5. ✅ Create `useFinanceMergedConnectionQuery()` hook
6. ✅ Update all query hooks to use merged connection
7. ✅ Test API changes with mock data

**Files to Update:**
- `src/finance/types.ts` - Add `userId` to all types
- `src/finance/data/supabaseApi.ts` - Update mappings
- `src/hooks/useFinanceQuery.ts` - Add merged connection hooks
- `src/shared/api/connections.ts` - Add finance merge function

**Success Criteria:**
- All types include `userId` field
- API correctly returns both users' data in merged mode
- Query hooks invalidate correctly on mutations

---

### Phase 3: Core Components (Days 5-6)

**Goal:** Create reusable components for merged mode

**Tasks:**
1. ✅ Create `OwnerBadge` component
2. ✅ Create `OwnerFilter` component (if needed for some pages)
3. ✅ Update `DashboardPage` with merged connection
4. ✅ Add owner badges to transactions
5. ✅ Add owner badges to accounts
6. ✅ Test metrics calculations include both partners

**Files to Create:**
- `src/finance/components/OwnerBadge.tsx`
- `src/finance/components/OwnerFilter.tsx` (optional)

**Files to Update:**
- `src/finance/pages/DashboardPage.tsx`

**Success Criteria:**
- Owner badges display correctly
- Metrics include both partners' data
- No performance issues with large datasets

---

### Phase 4: Transactions & Accounts Pages (Days 7-8)

**Goal:** Implement merged mode for core finance pages

**Tasks:**
1. ✅ Update `TransactionsPageEnhanced` with merged connection
2. ✅ Add owner badges to transaction rows
3. ✅ Update `AccountsPage` with merged connection
4. ✅ Add owner badges to account cards
5. ✅ Test filtering and sorting with merged data
6. ✅ Verify edit/delete permissions work correctly

**Files to Update:**
- `src/finance/pages/TransactionsPageEnhanced.tsx`
- `src/finance/pages/AccountsPage.tsx`
- `src/finance/components/TransactionRow.tsx`
- `src/finance/components/AccountCard.tsx`

**Success Criteria:**
- Can view both partners' transactions
- Can only edit/delete own transactions
- Owner badges display correctly
- Filtering works with merged data

---

### Phase 5: Recurring & Budgets Pages (Days 9-10)

**Goal:** Implement merged mode for recurring transactions and budgets

**Tasks:**
1. ✅ Update `RecurringPage` with merged connection
2. ✅ Add owner badges to recurring templates
3. ✅ Update `BudgetsPage` with merged connection
4. ✅ Support household budgets (both can edit)
5. ✅ Support personal budgets (owner only)
6. ✅ Update budget calculations to include both partners

**Files to Update:**
- `src/finance/pages/RecurringPage.tsx`
- `src/finance/pages/BudgetsPage.tsx`
- `src/finance/components/RecurringTransactionsList.tsx`
- `src/finance/components/BudgetCard.tsx`

**Success Criteria:**
- Can view both partners' recurring transactions
- Household budgets show combined spending
- Personal budgets show individual spending
- Owner badges display correctly

---

### Phase 6: Goals, Loans, Retirement Pages (Days 11-12)

**Goal:** Implement merged mode for long-term financial tracking

**Tasks:**
1. ✅ Update `GoalsPage` with merged connection
2. ✅ Support household goals (both contribute)
3. ✅ Update `LoansPage` with merged connection
4. ✅ Add owner badges to loan cards
5. ✅ Update `RetirementPage` with merged connection
6. ✅ Show combined retirement projections

**Files to Update:**
- `src/finance/pages/GoalsPage.tsx`
- `src/finance/pages/LoansPage.tsx`
- `src/finance/pages/RetirementPage.tsx`
- `src/finance/components/GoalCard.tsx`
- `src/finance/components/LoanCard.tsx`

**Success Criteria:**
- Household goals show both partners' contributions
- Loan tracking shows all household debt
- Retirement projections include both partners
- Owner badges display correctly

---

### Phase 7: Credit Cards, Insurance, Projections Pages (Days 13-14)

**Goal:** Implement merged mode for remaining finance pages

**Tasks:**
1. ✅ Update `CreditCardsPage` with merged connection
2. ✅ Show combined credit utilization
3. ✅ Update `InsurancePage` with merged connection
4. ✅ Support household policies (both can edit)
5. ✅ Update `ProjectionsPage` with merged connection
6. ✅ Include both partners in cash flow projections

**Files to Update:**
- `src/finance/pages/CreditCardsPage.tsx`
- `src/finance/pages/InsurancePage.tsx`
- `src/finance/pages/ProjectionsPage.tsx`

**Success Criteria:**
- Credit card tracking shows all household cards
- Insurance policies show household coverage
- Projections include both partners' income/expenses
- Owner badges display correctly

---

### Phase 8: Calculators & Settings Pages (Day 15)

**Goal:** Complete remaining pages

**Tasks:**
1. ✅ Update `CalculatorsPage` (no changes needed - tools only)
2. ✅ Update `SettingsPage` to show merged mode status
3. ✅ Add merged mode toggle/info
4. ✅ Final testing of all pages

**Files to Update:**
- `src/finance/pages/SettingsPage.tsx`

**Success Criteria:**
- Settings page shows merged mode status
- All pages work correctly in merged mode
- No console errors or warnings

---

### Phase 9: Testing & QA (Days 16-17)

**Goal:** Comprehensive testing of all functionality

**Tasks:**
1. ✅ Test all 13+ pages in merged mode
2. ✅ Test RLS policies prevent unauthorized access
3. ✅ Test edit/delete permissions work correctly
4. ✅ Test metrics calculations are accurate
5. ✅ Test performance with large datasets
6. ✅ Test edge cases (no data, single partner, etc.)
7. ✅ Fix any bugs found during testing

**Success Criteria:**
- All pages work correctly
- No security vulnerabilities
- Performance is acceptable
- Edge cases handled gracefully

---

### Phase 10: Documentation & Deployment (Day 18)

**Goal:** Document changes and deploy to production

**Tasks:**
1. ✅ Update user documentation
2. ✅ Create migration guide for existing users
3. ✅ Deploy to staging environment
4. ✅ Final testing in staging
5. ✅ Deploy to production
6. ✅ Monitor for issues

**Success Criteria:**
- Documentation is complete
- Migration runs successfully
- No production issues

---

## 4. Database Migration SQL

### 4.1 Complete Migration File

**File:** `supabase/migrations_archive/20250130_finance_merge_support.sql`

```sql
-- Migration: Add merge support for Finance Module
-- This allows connected users to share finance data when both set their permission to "merged"
-- Following the same pattern as travel, visa, and goals modules
--
-- Finance Data Types:
-- 1. Personal data (connection_id = NULL) - Only owner sees their data
-- 2. Shared data (connection_id set) - Both partners see the same data
-- 3. Partner's personal data in merged mode - Both partners see each other's personal data

-- ==================== PHASE 1: Add connection_id to all tables ====================

-- Core Tables (P0 - Critical)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_categories ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_budgets ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_goals ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_loans ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_retirement_accounts ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Supporting Tables (P1 - High)
ALTER TABLE finance_budget_templates ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_goal_progress ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_loan_payments ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_retirement_contributions ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_card_benefits ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_card_category_bonuses ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_welcome_bonuses ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE bill_payments ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE categorization_rules ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Optional Tables (P2 - Medium)
ALTER TABLE finance_card_offers ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- ==================== PHASE 2: Create indexes for performance ====================

CREATE INDEX IF NOT EXISTS idx_finance_transactions_connection_id ON finance_transactions(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_connection_id ON finance_accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_connection_id ON finance_categories(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_connection_id ON finance_budgets(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_connection_id ON finance_goals(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_loans_connection_id ON finance_loans(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_accounts_connection_id ON finance_retirement_accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_connection_id ON recurring_bills(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_budget_templates_connection_id ON finance_budget_templates(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_goal_progress_connection_id ON finance_goal_progress(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_loan_payments_connection_id ON finance_loan_payments(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_contributions_connection_id ON finance_retirement_contributions(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_benefits_connection_id ON finance_card_benefits(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_category_bonuses_connection_id ON finance_card_category_bonuses(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_welcome_bonuses_connection_id ON finance_welcome_bonuses(connection_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_connection_id ON bill_payments(connection_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_connection_id ON categorization_rules(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_offers_connection_id ON finance_card_offers(connection_id);

-- ==================== PHASE 3: Update RLS Policies for SELECT ====================

-- finance_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can view own and merged transactions" ON finance_transactions;
CREATE POLICY "Users can view own and merged transactions" ON finance_transactions
FOR SELECT USING (
  -- Own transactions (personal or shared)
  (auth.uid() = user_id)
  OR
  -- Shared transactions (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal transactions in merged mode
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id
      AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid()
      AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id
      AND mp2.module = 'finances'
      AND mp2.user_id = (
        CASE
          WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
          ELSE pc.requester_id
        END
      )
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- finance_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can view own and merged accounts" ON finance_accounts;
CREATE POLICY "Users can view own and merged accounts" ON finance_accounts
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid() AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id AND mp1.module = 'finances'
      AND mp2.user_id = (CASE WHEN pc.requester_id = auth.uid() THEN pc.receiver_id ELSE pc.requester_id END)
      AND mp2.permission_level = 'merged'
    )
  ))
);
```

**Note:** The complete SQL file continues with similar RLS policies for all 19 tables. Each table follows the same pattern:
1. Allow viewing own data (user_id = auth.uid())
2. Allow viewing shared data (connection_id is set and user is in connection)
3. Allow viewing partner's personal data in merged mode (both users have 'merged' permission)

For INSERT/UPDATE/DELETE policies:
- Users can only modify their own data (user_id = auth.uid())
- Users can modify shared data (connection_id is set and user is in connection)
- Users CANNOT modify partner's personal data (view-only in merged mode)

---

## 5. RLS Policy Templates

### 5.1 INSERT Policy Template

```sql
-- Template for INSERT policies (apply to all 19 tables)
CREATE POLICY "Users can insert own and shared {TABLE_NAME}" ON {TABLE_NAME}
FOR INSERT WITH CHECK (
  -- Own data
  (auth.uid() = user_id AND connection_id IS NULL)
  OR
  -- Shared data (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

### 5.2 UPDATE Policy Template

```sql
-- Template for UPDATE policies (apply to all 19 tables)
CREATE POLICY "Users can update own and shared {TABLE_NAME}" ON {TABLE_NAME}
FOR UPDATE USING (
  -- Own data
  (auth.uid() = user_id)
  OR
  -- Shared data (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

### 5.3 DELETE Policy Template

```sql
-- Template for DELETE policies (apply to all 19 tables)
CREATE POLICY "Users can delete own and shared {TABLE_NAME}" ON {TABLE_NAME}
FOR DELETE USING (
  -- Own data
  (auth.uid() = user_id)
  OR
  -- Shared data (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

**Note:** Partner's personal data is VIEW-ONLY in merged mode. Users cannot insert/update/delete partner's personal data.

---

## 6. API Layer Changes

### 6.1 TypeScript Type Updates

**File:** `src/finance/types.ts`

Add `userId` field to all types:

```typescript
export type Transaction = {
  id: string;
  userId: string; // NEW - Add this field
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

export type Account = {
  id: string;
  userId: string; // NEW - Add this field
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdatedISO: string;
  liability?: boolean;
  // ... rest of fields
};

// Repeat for all 19 types: Budget, Category, Goal, Loan, etc.
```

### 6.2 Supabase API Mapping Updates

**File:** `src/finance/data/supabaseApi.ts`

Update all mapping functions to include `userId`:

```typescript
// Example for transactions
private mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id, // NEW - Add this mapping
    accountId: row.account_id,
    dateISO: row.date,
    description: row.description,
    categoryId: row.category_id,
    amount: row.amount,
    type: row.type,
    notes: row.notes,
    merchantName: row.merchant_name,
    confidenceScore: row.confidence_score,
    suggestedCategoryId: row.suggested_category_id,
    categorizationRuleId: row.categorization_rule_id,
  };
}

// Repeat for all mapping functions: mapAccount, mapBudget, mapGoal, mapLoan, etc.
```

### 6.3 Merged Connection Query Hook

**File:** `src/hooks/useFinanceQuery.ts`

Add merged connection query key and hook:

```typescript
export const financeKeys = {
  all: ['finance'] as const,
  mergedConnection: () => [...financeKeys.all, 'mergedConnection'] as const, // NEW
  institutions: () => [...financeKeys.all, 'institutions'] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  // ... rest of keys
};

// NEW - Hook to get merged connection for finances
export function useFinanceMergedConnectionQuery(): UseQueryResult<ProfileConnection | null> {
  return useQuery({
    queryKey: financeKeys.mergedConnection(),
    queryFn: async () => {
      const connection = await getFinancesMergedConnection();
      return connection;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 6.4 Merged Connection API Function

**File:** `src/shared/api/connections.ts`

Add function to get merged connection for finances:

```typescript
export async function getFinancesMergedConnection(): Promise<ProfileConnection | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_merged_connection_for_module', {
    p_module: 'finances'
  });

  if (error) {
    logger.error('getFinancesMergedConnection', 'Failed to get merged connection', { error });
    return null;
  }

  return data;
}
```

---

## 7. Frontend Implementation

### 7.1 Owner Badge Component

**File:** `src/finance/components/OwnerBadge.tsx` (NEW)

```typescript
import { cn } from '@/lib/utils';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  className?: string;
}

export function OwnerBadge({ userId, currentUserId, partnerName, className }: OwnerBadgeProps) {
  const isOwn = userId === currentUserId;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        isOwn
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        className
      )}
    >
      {isOwn ? 'Me' : partnerName || 'Partner'}
    </span>
  );
}
```

---

### 7.2 Page Implementation Checklist

**All 13+ pages need these updates:**

1. ✅ Import `useFinanceMergedConnectionQuery` hook
2. ✅ Get current user ID from auth
3. ✅ Get partner name from merged connection
4. ✅ Add `OwnerBadge` to all data items
5. ✅ Update metrics calculations to include both partners
6. ✅ Disable edit/delete buttons for partner's data
7. ✅ Test with mock data

**Example for DashboardPage:**

```typescript
import { useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import { OwnerBadge } from '@/finance/components/OwnerBadge';
import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name
  const partnerName = mergedConnection
    ? mergedConnection.requester_id === user?.id
      ? mergedConnection.receiver_name
      : mergedConnection.requester_name
    : undefined;

  // ... rest of component

  return (
    <div>
      {/* Recent Transactions */}
      {transactions.map(txn => (
        <div key={txn.id}>
          <span>{txn.description}</span>
          <OwnerBadge
            userId={txn.userId}
            currentUserId={user?.id || ''}
            partnerName={partnerName}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 8. Testing Strategy

### 8.1 Database Testing

**Test RLS Policies in Supabase SQL Editor:**

```sql
-- Test 1: Verify connection_id column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'finance_transactions'
AND column_name = 'connection_id';

-- Test 2: Verify indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'finance_transactions'
AND indexname = 'idx_finance_transactions_connection_id';

-- Test 3: Verify RLS policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'finance_transactions';

-- Test 4: Test SELECT policy (as user)
-- Run this as authenticated user to verify you can see partner's data in merged mode
SELECT COUNT(*) FROM finance_transactions;
```

### 8.2 API Layer Testing

**Test API mappings include userId:**

```typescript
// Test in browser console
const api = getFinanceAPI();
const transactions = await api.getTransactions({ limit: 10 });
console.log('First transaction has userId:', transactions.items[0].userId);
```

### 8.3 Frontend Testing

**Manual Testing Checklist:**

- [ ] Dashboard shows both partners' data
- [ ] Owner badges display correctly (Blue for me, Purple for partner)
- [ ] Metrics include both partners' data
- [ ] Can edit own transactions
- [ ] Cannot edit partner's transactions
- [ ] Can delete own transactions
- [ ] Cannot delete partner's transactions
- [ ] Money Flow Visualization shows both partners' income/expenses
- [ ] All 13+ pages work correctly
- [ ] No console errors or warnings
- [ ] Performance is acceptable with large datasets

### 8.4 Edge Cases Testing

**Test these scenarios:**

1. **No merged connection** - User sees only their own data
2. **One-way merged** - Only one user has merged permission (should not see partner's data)
3. **Both merged** - Both users have merged permission (should see all data)
4. **Empty data** - Partner has no data (should show empty state gracefully)
5. **Large datasets** - 1000+ transactions (should perform well)
6. **Shared data** - Data with connection_id set (both can edit)
7. **Personal data** - Data with connection_id NULL (only owner can edit)

### 8.5 Performance Testing

**Metrics to monitor:**

- Page load time (should be < 2 seconds)
- Query execution time (should be < 500ms)
- RLS policy overhead (should be minimal)
- Memory usage (should not leak)
- Network requests (should be optimized)

---

## 9. Rollback Plan

### 9.1 Database Rollback SQL

**File:** `supabase/migrations_archive/ROLLBACK_20250130_finance_merge_support.sql`

```sql
-- Rollback: Remove merge support from Finance Module
-- This reverts the changes made by 20250130_finance_merge_support.sql

-- ==================== Drop RLS Policies ====================

-- finance_transactions
DROP POLICY IF EXISTS "Users can view own and merged transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can insert own and shared transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can update own and shared transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can delete own and shared transactions" ON finance_transactions;

-- Recreate original policies
CREATE POLICY "Users can view own transactions" ON finance_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON finance_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON finance_transactions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON finance_transactions
FOR DELETE USING (auth.uid() = user_id);

-- Repeat for all 19 tables...

-- ==================== Drop Indexes ====================

DROP INDEX IF EXISTS idx_finance_transactions_connection_id;
DROP INDEX IF EXISTS idx_finance_accounts_connection_id;
DROP INDEX IF EXISTS idx_finance_categories_connection_id;
-- ... drop all indexes

-- ==================== Remove connection_id Columns ====================

ALTER TABLE finance_transactions DROP COLUMN IF EXISTS connection_id;
ALTER TABLE finance_accounts DROP COLUMN IF EXISTS connection_id;
ALTER TABLE finance_categories DROP COLUMN IF EXISTS connection_id;
-- ... drop all connection_id columns
```

### 9.2 Frontend Rollback

**Steps to rollback frontend changes:**

1. Revert all commits related to finance merge
2. Remove `OwnerBadge` component
3. Remove `useFinanceMergedConnectionQuery` hook
4. Remove `userId` field from all types
5. Remove `getFinancesMergedConnection` function
6. Test that original functionality still works

### 9.3 Rollback Decision Criteria

**Rollback if:**

- RLS policies cause security vulnerabilities
- Performance degrades significantly (> 50% slower)
- Data corruption occurs
- Critical bugs cannot be fixed quickly
- User complaints exceed acceptable threshold

**Do NOT rollback if:**

- Minor UI bugs (can be fixed with hotfix)
- Performance issues can be optimized
- Edge cases can be handled gracefully

---

## 10. Summary & Next Steps

### 10.1 Implementation Summary

**What This Plan Covers:**

✅ Database migration for 19 finance tables
✅ RLS policies for merged mode support
✅ API layer changes (types, mappings, hooks)
✅ Frontend components (OwnerBadge)
✅ All 13+ Finance pages implementation
✅ Testing strategy (database, API, frontend, edge cases)
✅ Rollback plan (database, frontend)

**Timeline:** 12-15 days (18 days with testing and deployment)

**Complexity:** High - 19 tables, 13+ pages, complex RLS policies

### 10.2 Next Steps

1. **Review this plan** - Get approval from team/stakeholders
2. **Create migration SQL file** - Complete SQL for all 19 tables
3. **Test migration in development** - Verify RLS policies work
4. **Implement API changes** - Add userId to types and mappings
5. **Create OwnerBadge component** - Reusable component for all pages
6. **Implement pages one by one** - Follow phase-by-phase plan
7. **Test thoroughly** - Database, API, frontend, edge cases
8. **Deploy to staging** - Final testing before production
9. **Deploy to production** - Monitor for issues
10. **Document changes** - Update user documentation

### 10.3 Risk Mitigation

**Risks:**

1. **RLS policy bugs** - Mitigation: Thorough testing in SQL Editor
2. **Performance issues** - Mitigation: Indexes on connection_id, query optimization
3. **Data corruption** - Mitigation: Backup database before migration
4. **User confusion** - Mitigation: Clear UI with owner badges
5. **Security vulnerabilities** - Mitigation: Careful RLS policy design

**Contingency Plans:**

- Have rollback SQL ready
- Test in development first
- Deploy to staging before production
- Monitor production closely after deployment
- Be ready to rollback if critical issues occur

---

## 11. Appendix

### 11.1 Related Documents

- `FINANCES_MERGE_COMPLETE_MOCKUPS.md` - Visual mockups of all 13+ pages
- `FINANCES_MERGE_ANALYSIS.md` - Technical analysis and implementation details
- `FINANCES_MERGE_SUMMARY.md` - User-friendly summary
- `STALE_TABLES_ANALYSIS.md` - Database tables documentation

### 11.2 Reference Migrations

- `supabase/migrations_archive/20260130_add_travel_merge_support.sql` - Travel merge pattern
- `supabase/migrations_archive/20260130_add_visa_merge_support.sql` - Visa merge pattern
- `supabase/migrations_archive/20260129_add_goals_merge_support.sql` - Goals merge pattern

### 11.3 Key Contacts

- **Database Admin:** [Name] - For RLS policy questions
- **Frontend Lead:** [Name] - For UI/UX questions
- **Product Owner:** [Name] - For feature requirements

---

**END OF IMPLEMENTATION PLAN**




