# Finances Merge Implementation Analysis

## Executive Summary
This document provides a comprehensive analysis for implementing merged mode for the Finances module, based on successful patterns from Meals, Travel, Goals, and Visa Calculator modules.

---

## 1. Current State Assessment

### 1.1 Finance Module Structure
**Database Tables:**
- `finance_transactions` - Individual transactions (income/expenses)
- `finance_accounts` - Bank accounts, credit cards, investment accounts
- `finance_categories` - Transaction categories (user-specific)
- `finance_budgets` - Monthly budget limits per category
- `finance_budget_templates` - Default budget templates
- `finance_goals` - Financial goals (savings targets, etc.)
- `finance_loans` - Loan tracking
- `finance_card_benefits` - Credit card benefits
- `finance_card_category_bonuses` - Credit card category bonuses
- `finance_welcome_bonuses` - Credit card welcome bonuses
- `finance_retirement_accounts` - Retirement account tracking
- `finance_retirement_contributions` - Retirement contributions
- `finance_retirement_performance` - Retirement performance tracking

**Key Characteristics:**
- All tables have `user_id` column (owner of the data)
- NO `connection_id` column currently exists
- Categories are user-specific (each user has their own category list)
- Budgets are tied to user-specific categories
- Accounts are personal (checking, savings, credit cards, etc.)

### 1.2 Permission Configuration
**Current Settings** (from `MODULE_CONFIGS`):
```typescript
finances: {
  module: 'finances',
  label: 'Finances',
  description: 'Accounts, transactions, and budgets',
  icon: 'DollarSign',
  defaultLevel: 'none',
  supportedLevels: ['none', 'view', 'collaborate', 'merged'], // ✅ Already supports merged!
  hasSettings: true,
}
```

**Status:** ✅ Finances module already supports 'merged' permission level in the configuration.

---

## 2. Merged Mode Requirements

### 2.1 What "Merged" Means for Finances
When both partners set finances permission to "merged":
1. **See combined financial picture** - Both users see all accounts, transactions, budgets from both partners
2. **Unified dashboard** - Combined income, expenses, net worth, cash flow (household totals)
3. **Owner identification** - Clearly show which partner owns each account/transaction with badges
4. **No filtering needed** - Always show both partners' data together (simpler UX)
5. **Categories remain separate** - Each user keeps their own category system
6. **Budgets can be personal or household** - Support both types

### 2.2 Data Ownership Models

**Option A: Personal Data (connection_id = NULL)**
- Each user's accounts/transactions remain personal
- RLS policy allows viewing partner's personal data when both have merged permission
- Similar to Travel and Visa modules

**Option B: Shared Data (connection_id = SET)**
- Create new "household" accounts/transactions with connection_id
- Both partners can edit shared items
- Similar to Meals module

**Recommendation:** Use **Option A** for most finance data (accounts, transactions, categories) because:
- Financial accounts are inherently personal (tied to individual SSN, ownership)
- Transactions come from personal accounts
- Easier migration (no need to move existing data)
- Clear audit trail of who owns what

**Exception:** Budgets could use **Option B** (shared budgets) for household budget planning.

---

## 3. Database Schema Changes

### 3.1 Tables Requiring `connection_id` Column

#### Priority 1: Core Tables (Required for MVP)
1. **finance_transactions** - Add `connection_id` (nullable)
2. **finance_accounts** - Add `connection_id` (nullable)
3. **finance_categories** - Add `connection_id` (nullable)
4. **finance_budgets** - Add `connection_id` (nullable)

#### Priority 2: Extended Tables (Can be added later)
5. **finance_goals** - Add `connection_id` (nullable)
6. **finance_loans** - Add `connection_id` (nullable)
7. **finance_card_benefits** - Add `connection_id` (nullable)
8. **finance_card_category_bonuses** - Add `connection_id` (nullable)
9. **finance_welcome_bonuses** - Add `connection_id` (nullable)

#### Priority 3: Retirement Tables (Optional)
10. **finance_retirement_accounts** - Add `connection_id` (nullable)
11. **finance_retirement_contributions** - Add `connection_id` (nullable)
12. **finance_retirement_performance** - Add `connection_id` (nullable)

### 3.2 Migration SQL Template
```sql
-- Add connection_id to finance_transactions
ALTER TABLE finance_transactions 
  ADD COLUMN IF NOT EXISTS connection_id UUID 
  REFERENCES profile_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_connection_id 
  ON finance_transactions(connection_id);

-- Add connection_id to finance_accounts
ALTER TABLE finance_accounts 
  ADD COLUMN IF NOT EXISTS connection_id UUID 
  REFERENCES profile_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_finance_accounts_connection_id 
  ON finance_accounts(connection_id);

-- Repeat for other tables...
```

---

## 4. RLS (Row Level Security) Policies

### 4.1 Pattern from Successful Modules
Based on Travel, Visa, and Goals modules, the RLS policy should allow:
1. Own data (user_id = auth.uid())
2. Shared data (connection_id is set and user is part of that connection)
3. **Partner's personal data in merged mode** (connection_id IS NULL, but both users have merged permission)

### 4.2 RLS Policy Template for finance_transactions
```sql
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;

-- Create new SELECT policy with merged mode support
CREATE POLICY "Users can view own and merged transactions" ON finance_transactions
FOR SELECT USING (
  -- Own transactions (personal or shared)
  user_id = auth.uid()
  OR
  -- Shared transactions (connection_id is set)
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
    -- Check that BOTH users have merged permission for finances
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
      AND mp2.user_id != auth.uid()
      AND mp2.permission_level = 'merged'
    )
  ))
);
```

### 4.3 INSERT/UPDATE/DELETE Policies
```sql
-- Users can only insert their own transactions
CREATE POLICY "Users can insert own transactions" ON finance_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON finance_transactions
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions" ON finance_transactions
FOR DELETE USING (auth.uid() = user_id);
```

**Note:** Repeat similar policies for all finance tables.

---

## 5. Frontend Implementation

### 5.1 API Layer Changes

#### 5.1.1 Add Merged Connection Query
Create a new API function to check if finances are merged:

**File:** `src/finance/api/financeConnectionsAPI.ts` (NEW FILE)
```typescript
import { supabase } from '@/lib/supabase';

export interface FinanceMergedConnection {
  connectionId: string;
  partnerId: string;
  partnerName: string;
}

export async function getFinancesMergedConnection(): Promise<FinanceMergedConnection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user has any active connections with merged finances permission
  const { data, error } = await supabase.rpc('get_merged_connection_for_module', {
    p_module: 'finances'
  });

  if (error || !data || data.length === 0) return null;

  const connection = data[0];
  return {
    connectionId: connection.connection_id,
    partnerId: connection.partner_id,
    partnerName: connection.partner_name || connection.partner_email,
  };
}
```

#### 5.1.2 Update Finance Queries to Include Partner Data
**File:** `src/hooks/useFinanceQuery.ts`

Add merged connection query:
```typescript
export function useFinanceMergedConnectionQuery() {
  return useQuery({
    queryKey: financeKeys.mergedConnection(),
    queryFn: getFinancesMergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

Update query keys:
```typescript
export const financeKeys = {
  all: ['finance'] as const,
  mergedConnection: () => [...financeKeys.all, 'mergedConnection'] as const,
  // ... existing keys
};
```

### 5.2 Component Changes

#### 5.2.1 Dashboard Page Updates
**File:** `src/finance/pages/DashboardPage.tsx`

**Changes needed:**
1. Add merged connection query
2. Show owner badges on transactions and accounts
3. Metrics automatically include both partners' data (no filtering needed)

**Key additions:**
```typescript
const DashboardPage: React.FC = () => {
  // Add merged connection query
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();
  const { data: { user } } = useAuth();
  const currentUserId = user?.id;

  // Transactions and accounts already include both partners' data via RLS
  // No filtering needed - just display with owner badges

  // Metrics automatically calculated from all transactions
  const income = monthTxns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTxns.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const cashFlow = income - expenses;

  // ... rest of component
};
```

#### 5.2.2 Add Owner Badge Component
**File:** `src/finance/components/OwnerBadge.tsx` (NEW FILE)
```typescript
interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
}

export function OwnerBadge({ userId, currentUserId, partnerName }: OwnerBadgeProps) {
  const isOwn = userId === currentUserId;

  return (
    <span className={`text-xs px-2 py-1 rounded ${isOwn ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
      {isOwn ? 'Me' : partnerName || 'Partner'}
    </span>
  );
}
```

### 5.3 Type Updates

#### 5.3.1 Add userId to Finance Types
**File:** `src/finance/types.ts`

Update types to include userId (for display purposes):
```typescript
export type Transaction = {
  id: string;
  userId: string; // ADD THIS - owner of the transaction
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
  userId: string; // ADD THIS - owner of the account
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdatedISO: string;
  liability?: boolean;
  // ... rest of fields
};
```

#### 5.3.2 Update API Mapping
**File:** `src/finance/data/supabaseApi.ts`

Update the mapping functions to include userId:
```typescript
async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
  // ... existing code

  const items = (data || []).map(row => ({
    id: row.id,
    userId: row.user_id, // ADD THIS
    accountId: row.account_id,
    dateISO: row.date,
    // ... rest of mapping
  }));

  return { items, nextCursor: undefined };
}
```

---

## 6. Categories Handling Strategy

### 6.1 The Category Problem
**Challenge:** Each user has their own categories. When merged:
- User A has: "Groceries", "Dining Out", "Gas"
- User B has: "Food", "Restaurants", "Transportation"

**Options:**

**Option 1: Keep Separate Categories (Recommended for MVP)**
- Each user keeps their own categories
- When viewing partner's transactions, show their category names
- Pros: No data migration, no conflicts
- Cons: Inconsistent categorization across household

**Option 2: Merge Categories**
- Create a "household" category set when merged
- Map existing categories to household categories
- Pros: Consistent categorization
- Cons: Complex migration, potential data loss

**Option 3: Shared Category Pool**
- Both users can see and use each other's categories
- Transactions keep their original category
- Pros: Flexibility, no migration
- Cons: Duplicate categories possible

**Recommendation:** Start with **Option 1** for MVP, add Option 3 later.

### 6.2 Implementation for Option 1
```typescript
// When displaying a transaction
function getCategoryName(transaction: Transaction, categories: Category[], partnerCategories: Category[]) {
  const isOwnTransaction = transaction.userId === currentUserId;
  const categoryList = isOwnTransaction ? categories : partnerCategories;
  return categoryList.find(c => c.id === transaction.categoryId)?.name || 'Uncategorized';
}
```

---

## 7. Budgets Handling Strategy

### 7.1 Budget Types in Merged Mode

**Personal Budgets** (connection_id = NULL)
- Each partner's individual budget goals
- Example: "My dining out budget: $200/month"

**Household Budgets** (connection_id = SET)
- Shared budget goals for the household
- Example: "Our groceries budget: $800/month"

### 7.2 Budget Display Logic
```typescript
function getBudgetStatus(budget: Budget, transactions: Transaction[]) {
  // If household budget, include both partners' transactions
  if (budget.connectionId) {
    const relevantTxns = transactions.filter(t => t.categoryId === budget.categoryId);
    const spent = relevantTxns.reduce((sum, t) => sum + t.amount, 0);
    return { spent, limit: budget.limit, remaining: budget.limit - spent };
  }

  // If personal budget, only include own transactions
  const relevantTxns = transactions.filter(t =>
    t.categoryId === budget.categoryId && t.userId === budget.userId
  );
  const spent = relevantTxns.reduce((sum, t) => sum + t.amount, 0);
  return { spent, limit: budget.limit, remaining: budget.limit - spent };
}
```

---

## 8. Metrics and Calculations

### 8.1 Dashboard Metrics in Merged Mode

**Key Metrics to Update:**
1. **Total Income** - Sum of all credit transactions (filtered by owner)
2. **Total Expenses** - Sum of all debit transactions (filtered by owner)
3. **Cash Flow** - Income - Expenses (filtered by owner)
4. **Net Worth** - Sum of all account balances (filtered by owner)
5. **Savings Rate** - (Income - Expenses) / Income (filtered by owner)

### 8.2 Implementation Pattern

```typescript
const metrics = useMemo(() => {
  // No filtering needed - transactions already include both partners via RLS
  // Just calculate metrics from all transactions
  const income = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const cashFlow = income - expenses;

  return { income, expenses, cashFlow };
}, [transactions]);
```

### 8.3 Net Worth Calculation

```typescript
const netWorth = useMemo(() => {
  // No filtering needed - accounts already include both partners via RLS
  const assets = accounts.filter(a => !a.liability).reduce((sum, a) => sum + a.balance, 0);
  const liabilities = accounts.filter(a => a.liability).reduce((sum, a) => sum + a.balance, 0);

  return assets - liabilities;
}, [accounts]);
```

### 8.4 Important: useMemo Dependency Arrays

**Simplified Pattern (No Filtering):**
Since we're not filtering by owner, dependency arrays are simpler:
```typescript
const calculation = useMemo(() => {
  // ... calculation logic using all data
}, [
  data,  // The data being calculated (transactions, accounts, etc.)
  // Any other variable used in the calculation
]);
```

**Note:** Much simpler than the visa calculator pattern since we don't have owner filter state to track!

---

## 9. UI/UX Considerations

### 9.1 Page Layout (No Filter Needed)

**Simplified Design:**
- No owner filter component needed
- Always show all data from both partners
- Use owner badges to identify who owns what

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  Finance Dashboard      January 2026 ▼  │
│                                         │
│  Income: $8,500    Expenses: $6,200    │
│  Cash Flow: $2,300  (Household Total)  │
└─────────────────────────────────────────┘
```

### 9.2 Owner Badges

**Display Rules:**
- Show owner badge on EVERY transaction/account when in merged mode
- Use consistent colors:
  - **Blue** for "Me" (current user)
  - **Purple** for "Partner"
- Position: Right side of transaction row

**Example:**
```
┌──────────────────────────────────────────────┐
│ Starbucks Coffee        -$5.50    [Me]      │
│ Whole Foods            -$87.32    [Partner] │
│ Salary Deposit       +$3,000.00   [Me]      │
└──────────────────────────────────────────────┘
```

### 9.3 Color Coding Strategy

**Consistent with Other Modules:**
- **Blue** = Current user's data (same as Travel, Visa)
- **Purple** = Partner's data (same as Travel, Visa)
- **Green** = Shared/Household data (budgets, goals)

### 9.4 Empty States

**When partner has no data:**
```
┌─────────────────────────────────────────┐
│  Showing: Partner                       │
│                                         │
│  No transactions found                  │
│  Your partner hasn't added any          │
│  transactions yet.                      │
└─────────────────────────────────────────┘
```

---

## 10. Testing Strategy

### 10.1 Test Scenarios

#### Scenario 1: Basic Merged Mode
1. User A sets finances permission to "merged"
2. User B sets finances permission to "merged"
3. Both users should see combined data
4. Owner badges should appear correctly

#### Scenario 2: Owner Badges
1. In merged mode, view dashboard
2. All transactions should show owner badges
3. Blue badges for current user
4. Purple badges for partner
5. Badges should be consistent across all pages

#### Scenario 3: Categories
1. User A creates transaction with category "Groceries"
2. User B views transaction
3. Should see "Groceries" category (User A's category)
4. User B creates transaction with category "Food"
5. User A views transaction
6. Should see "Food" category (User B's category)

#### Scenario 4: Budgets
1. User A creates personal budget for "Dining Out" - $200
2. User A creates household budget for "Groceries" - $800
3. User B should see both budgets
4. Personal budget should only track User A's transactions
5. Household budget should track both users' transactions

#### Scenario 5: Permission Changes
1. User A has merged permission
2. User B changes permission from "merged" to "view"
3. User A should no longer see User B's data in merged mode
4. User B should still see User A's data in view mode

#### Scenario 6: Connection Deletion
1. Users are in merged mode
2. Connection is deleted
3. Each user should only see their own data
4. No errors should occur

### 10.2 Edge Cases to Test

1. **No merged connection** - Finance pages should work normally
2. **One-way merged** - Only one user has merged permission
3. **Empty data** - Partner has no transactions/accounts
4. **Large datasets** - 1000+ transactions from both users
5. **Category conflicts** - Same category name, different IDs
6. **Budget calculations** - Ensure correct filtering
7. **Date ranges** - Filter by month with merged data
8. **Account types** - Different account types (checking, credit, investment)

### 10.3 Performance Testing

1. **Query performance** - RLS policies should use indexes
2. **Rendering performance** - Large transaction lists with owner badges
3. **Filter performance** - Switching between "me", "partner", "both"
4. **Calculation performance** - useMemo should prevent unnecessary recalculations

---

## 11. Migration Plan

### 11.1 Step-by-Step Implementation Order

**Phase 1: Database Setup** (Day 1)
1. ✅ Create migration SQL file
2. ✅ Add `connection_id` to core tables (transactions, accounts, categories, budgets)
3. ✅ Update RLS policies for SELECT
4. ✅ Test RLS policies in Supabase SQL Editor
5. ✅ Run migration on development database

**Phase 2: API Layer** (Day 2)
1. ✅ Create `getFinancesMergedConnection()` function
2. ✅ Update `financeKeys` with `mergedConnection()`
3. ✅ Create `useFinanceMergedConnectionQuery()` hook
4. ✅ Update `supabaseApi.ts` to include `userId` in mappings
5. ✅ Update TypeScript types to include `userId`

**Phase 3: Core Components** (Day 3)
1. ✅ Create `OwnerBadge` component
2. ✅ Update `DashboardPage` with merged connection query
3. ✅ Add owner badges to transactions and accounts
4. ✅ Verify metrics include both partners' data

**Phase 4: Transaction Pages** (Day 4)
1. ✅ Update `TransactionsPageGrouped` with owner badges
2. ✅ Verify all transactions from both partners show
3. ✅ Test transaction creation/editing

**Phase 5: Account Pages** (Day 5)
1. ✅ Update `AccountsPage` with owner badges
2. ✅ Verify all accounts from both partners show
3. ✅ Test account creation/editing

**Phase 6: Budget & Goals** (Day 6)
1. ✅ Update `BudgetsPage` with household budget support
2. ✅ Update budget calculations to include both partners
3. ✅ Update `GoalsPage` with owner badges
4. ✅ Test budget tracking with merged data

**Phase 7: Extended Features** (Day 7)
1. ✅ Update `NetWorthPage` with owner badges
2. ✅ Update `LoansPage` with owner badges
3. ✅ Update `RetirementPage` with owner badges
4. ✅ Update `CreditCardsPage` with owner badges

**Phase 8: Testing & Polish** (Day 8-9)
1. ✅ Run all test scenarios
2. ✅ Fix any bugs found
3. ✅ Performance testing
4. ✅ UI/UX polish
5. ✅ Documentation updates

**Phase 9: Deployment** (Day 10)
1. ✅ Run migration on production database
2. ✅ Deploy frontend changes
3. ✅ Monitor for errors
4. ✅ User acceptance testing

### 11.2 Rollback Plan

If issues are found:
1. **Database:** Keep `connection_id` column (nullable, so no data loss)
2. **RLS Policies:** Revert to original policies
3. **Frontend:** Feature flag to disable merged mode UI
4. **Fix issues** and redeploy

---

## 12. Edge Cases and Considerations

### 12.1 What Happens When...

**Connection is deleted?**
- RLS policies use `ON DELETE CASCADE` for `connection_id`
- Shared data (connection_id IS NOT NULL) is deleted
- Personal data (connection_id IS NULL) remains
- Users only see their own data

**Permission changes from merged to view?**
- User can still see partner's data (view mode)
- But partner can't see user's data anymore
- Owner filter should be hidden (not in merged mode)

**Permission changes from merged to none?**
- User can't see partner's data anymore
- Partner can't see user's data anymore
- Each user only sees their own data

**User has multiple connections?**
- Only one connection can have merged finances at a time
- `get_merged_connection_for_module` returns the first active merged connection
- UI should warn if trying to merge with multiple partners

**Partner deletes a shared budget?**
- If user_id matches, they can delete it
- If connection_id is set, both partners can delete it (based on RLS policy)
- Consider adding a "deleted_by" field for audit trail

**Category name conflicts?**
- Keep separate for MVP (Option 1)
- Display partner's category names as-is
- Future: Add category mapping feature

### 12.2 Data Consistency

**Transaction without valid account?**
- Should not happen (foreign key constraint)
- If account is deleted, transactions should be deleted (CASCADE)
- Or: Keep transactions, show "Deleted Account" in UI

**Budget without valid category?**
- Should not happen (foreign key constraint)
- If category is deleted, budgets should be deleted (CASCADE)
- Or: Keep budgets, show "Deleted Category" in UI

### 12.3 Security Considerations

**Can partner edit my personal data?**
- NO - RLS policies only allow SELECT for partner's data
- INSERT/UPDATE/DELETE policies check `user_id = auth.uid()`
- Partner can only edit shared data (connection_id IS NOT NULL)

**Can partner see my deleted transactions?**
- NO - Deleted transactions are removed from database
- No soft delete currently implemented
- Consider adding soft delete for audit trail

**Can partner see my account numbers?**
- YES - If in merged mode, all account data is visible
- Consider adding privacy settings for sensitive fields
- Future: Add field-level permissions

---

## 13. Implementation Checklist

### 13.1 Database Changes
- [ ] Create migration file `20250130_finance_merge.sql`
- [ ] Add `connection_id` to `finance_transactions`
- [ ] Add `connection_id` to `finance_accounts`
- [ ] Add `connection_id` to `finance_categories`
- [ ] Add `connection_id` to `finance_budgets`
- [ ] Add `connection_id` to `finance_goals`
- [ ] Add `connection_id` to `finance_loans`
- [ ] Create indexes on `connection_id` columns
- [ ] Update RLS policies for all tables (SELECT)
- [ ] Update RLS policies for all tables (INSERT/UPDATE/DELETE)
- [ ] Test RLS policies in SQL Editor
- [ ] Run migration on development database

### 13.2 API Layer
- [ ] Create `src/finance/api/financeConnectionsAPI.ts`
- [ ] Implement `getFinancesMergedConnection()`
- [ ] Update `src/hooks/useFinanceQuery.ts`
- [ ] Add `financeKeys.mergedConnection()`
- [ ] Create `useFinanceMergedConnectionQuery()`
- [ ] Update `src/finance/data/supabaseApi.ts`
- [ ] Add `userId` to transaction mapping
- [ ] Add `userId` to account mapping
- [ ] Add `userId` to category mapping
- [ ] Add `userId` to budget mapping

### 13.3 Type Updates
- [ ] Update `src/finance/types.ts`
- [ ] Add `userId` to `Transaction` type
- [ ] Add `userId` to `Account` type
- [ ] Add `userId` to `Category` type
- [ ] Add `userId` to `Budget` type
- [ ] Add `connectionId` to all types (optional)

### 13.4 Components
- [ ] Create `src/finance/components/OwnerBadge.tsx`
- [ ] Update `src/finance/pages/DashboardPage.tsx`
  - [ ] Add merged connection query
  - [ ] Add owner badges to transactions and accounts
  - [ ] Verify metrics include both partners
- [ ] Update `src/finance/pages/TransactionsPageGrouped.tsx`
  - [ ] Add owner badges to transaction rows
- [ ] Update `src/finance/pages/AccountsPage.tsx`
  - [ ] Add owner badges to account cards
- [ ] Update `src/finance/pages/BudgetsPage.tsx`
  - [ ] Add household budget support
  - [ ] Update budget calculations
- [ ] Update `src/finance/pages/NetWorthPage.tsx`
  - [ ] Add owner badges
  - [ ] Verify net worth includes both partners
- [ ] Update `src/finance/pages/GoalsPage.tsx`
  - [ ] Add owner badges

### 13.5 Testing
- [ ] Test basic merged mode
- [ ] Test owner filter (me/partner/both)
- [ ] Test categories display
- [ ] Test budget calculations
- [ ] Test permission changes
- [ ] Test connection deletion
- [ ] Test all edge cases
- [ ] Performance testing
- [ ] UI/UX testing

### 13.6 Documentation
- [ ] Update README with merged mode info
- [ ] Add user guide for merged finances
- [ ] Document RLS policies
- [ ] Document API changes

---

## 14. Success Criteria

### 14.1 Functional Requirements
✅ Both users can see combined financial data when both have merged permission
✅ Owner badges clearly identify who owns each transaction/account
✅ Owner filter allows viewing "Me", "Partner", or "Both"
✅ Metrics (income, expenses, cash flow, net worth) update correctly based on filter
✅ Categories display correctly (each user's category names)
✅ Budgets support both personal and household budgets
✅ RLS policies prevent unauthorized access
✅ No data loss when connection is deleted or permissions change

### 14.2 Performance Requirements
✅ Page load time < 2 seconds with 1000+ transactions
✅ Filter switching < 100ms
✅ No unnecessary re-renders (proper useMemo usage)
✅ Database queries use indexes (no full table scans)

### 14.3 UX Requirements
✅ Consistent with other merged modules (Travel, Visa, Goals, Meals)
✅ Clear visual distinction between own and partner's data
✅ Intuitive owner filter placement
✅ Helpful empty states
✅ No confusing error messages

---

## 15. Lessons Learned from Previous Modules

### 15.1 Common Pitfalls to Avoid

**1. Incomplete useMemo Dependencies**
- ❌ **Bug:** Forgetting to add `ownerFilter` to dependency array
- ✅ **Fix:** Always include ALL variables used in calculation
- **Example from Visa Calculator:** `destinationRequirements` didn't update when `passportOwnerFilter` changed

**2. RLS Policy Complexity**
- ❌ **Bug:** Overly complex RLS policies that are hard to debug
- ✅ **Fix:** Use the proven pattern from Travel/Visa modules
- **Pattern:** Own data OR Shared data OR Partner's data in merged mode

**3. Missing userId in Types**
- ❌ **Bug:** Can't determine owner of data in UI
- ✅ **Fix:** Always include `userId` in frontend types
- **Note:** Database has `user_id`, but frontend needs it for display

**4. Inconsistent Owner Badges**
- ❌ **Bug:** Some components show badges, others don't
- ✅ **Fix:** Create reusable `OwnerBadge` component, use everywhere
- **Consistency:** Blue for "Me", Purple for "Partner"

**5. Filter State Management**
- ❌ **Bug:** Filter state not persisted, resets on navigation
- ✅ **Fix:** Consider using URL params or localStorage
- **UX:** Remember user's filter preference

### 15.2 Best Practices

1. **Start with RLS policies** - Get database security right first
2. **Test RLS in SQL Editor** - Before writing frontend code
3. **Use proven patterns** - Copy from Travel/Visa modules
4. **Add userId early** - Include in types from the start
5. **Create reusable components** - OwnerFilter, OwnerBadge
6. **Test edge cases** - Connection deletion, permission changes
7. **Use useMemo correctly** - Include all dependencies
8. **Keep it simple** - MVP first, advanced features later

---

## 16. Next Steps

After completing this analysis, the recommended next steps are:

1. **Review this document** with the team
2. **Approve the approach** (especially categories and budgets strategy)
3. **Create database migration** (Phase 1)
4. **Test RLS policies** in Supabase SQL Editor
5. **Begin frontend implementation** (Phase 2-7)
6. **Thorough testing** (Phase 8)
7. **Deploy to production** (Phase 9)

**Estimated Timeline:** 10 days for full implementation

**Priority:** High - Finances is a core module for couples/partners

---

## 17. Questions to Resolve

Before starting implementation, please confirm:

1. **Categories Strategy:** Are we going with Option 1 (keep separate) for MVP?
2. **Budgets:** Do we want household budgets in MVP, or personal only?
3. **Retirement Accounts:** Include in MVP or defer to later?
4. **Loans:** Include in MVP or defer to later?
5. **Credit Cards:** Include in MVP or defer to later?
6. **Performance:** Any concerns about large datasets (1000+ transactions)?
7. **Privacy:** Any sensitive fields that should be hidden even in merged mode?

---

**Document Version:** 1.0
**Created:** 2026-01-30
**Author:** AI Assistant
**Status:** Ready for Review


