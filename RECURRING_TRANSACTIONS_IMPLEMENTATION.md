# Recurring Transactions Feature - Implementation Guide

## Overview
This feature allows users to set up recurring transactions (subscriptions, rent, salary, etc.) that automatically generate pending transactions for review and approval.

## ✅ Completed

### 1. Database Schema (`supabase/migrations/20251208_add_recurring_transactions.sql`)
- **recurring_transactions** table: Templates for recurring transactions
- **pending_transactions** table: Auto-generated transactions awaiting approval
- **recurring_transactions_upcoming** view: Shows next occurrence dates
- **generate_pending_transactions()** function: Auto-generates pending transactions
- **calculate_next_occurrence()** function: Calculates next transaction date based on frequency

### 2. TypeScript Types (`src/finance/types.ts`)
```typescript
// New types added:
- RecurringFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
- PendingTransactionStatus: 'pending' | 'approved' | 'skipped' | 'edited'
- RecurringTransaction
- RecurringTransactionInput
- PendingTransaction
- PendingTransactionInput
```

### 3. API Layer (`src/finance/data/supabaseApi.ts`)
```typescript
// New methods added to SupabaseFinanceAPI:
- listRecurringTransactions(): Promise<RecurringTransaction[]>
- upsertRecurringTransaction(recurring: RecurringTransactionInput): Promise<void>
- deleteRecurringTransaction(recurringId: string): Promise<void>
- generatePendingTransactions(): Promise<void>
- listPendingTransactions(): Promise<PendingTransaction[]>
- approvePendingTransaction(pendingId: string, edits?: Partial<TransactionInput>): Promise<void>
- skipPendingTransaction(pendingId: string): Promise<void>
- deletePendingTransaction(pendingId: string): Promise<void>
```

## 🚧 Remaining Tasks

### 4. React Query Hooks
Add to `src/finance/hooks/useFinanceQuery.ts`:

```typescript
// Query keys
recurringTransactions: () => [...financeKeys.all, 'recurringTransactions'] as const,
pendingTransactions: () => [...financeKeys.all, 'pendingTransactions'] as const,

// Hooks
export function useRecurringTransactionsQuery() {
  return useQuery({
    queryKey: financeKeys.recurringTransactions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listRecurringTransactions();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePendingTransactionsQuery() {
  return useQuery({
    queryKey: financeKeys.pendingTransactions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listPendingTransactions();
    },
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useUpsertRecurringTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recurring: RecurringTransactionInput) => {
      const api = await getFinanceAPI();
      return api.upsertRecurringTransaction(recurring);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
  });
}

export function useDeleteRecurringTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recurringId: string) => {
      const api = await getFinanceAPI();
      return api.deleteRecurringTransaction(recurringId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
  });
}

export function useApprovePendingTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pendingId, edits }: { pendingId: string; edits?: Partial<TransactionInput> }) => {
      const api = await getFinanceAPI();
      return api.approvePendingTransaction(pendingId, edits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

export function useSkipPendingTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pendingId: string) => {
      const api = await getFinanceAPI();
      return api.skipPendingTransaction(pendingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
  });
}

export function useGeneratePendingTransactionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const api = await getFinanceAPI();
      return api.generatePendingTransactions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
  });
}
```

### 5. UI Components

#### RecurringTransactionEditor Component
Create `src/finance/components/recurring/RecurringTransactionEditor.tsx`

**Features:**
- Form to create/edit recurring transactions
- Fields:
  - Description
  - Amount
  - Type (credit/debit)
  - Category dropdown
  - Account dropdown
  - Frequency dropdown (daily, weekly, monthly, etc.)
  - Start date
  - End date (optional)
  - Day of month (for monthly) or day of week (for weekly)
  - Auto-create checkbox
  - Require approval checkbox
  - Days before (number input)
  - Active status
  - Notes
- Save/Cancel buttons
- Validation

#### RecurringTransactionsList Component
Create `src/finance/components/recurring/RecurringTransactionsList.tsx`

**Features:**
- Display list of recurring transactions
- Show next occurrence date
- Show pending count badge
- Edit/Delete/Toggle active buttons
- Grouped by frequency or category
- Add new button

#### PendingTransactionsReview Component
Create `src/finance/components/recurring/PendingTransactionsReview.tsx`

**Features:**
- List of pending transactions
- Show scheduled date
- Quick approve button
- Edit button (opens modal to modify before approving)
- Skip button
- Delete button
- Group by date (overdue, today, this week, future)
- Badge showing count of pending transactions

### 6. Integration into Finances Page

Update `src/pages/Finances.tsx`:

```typescript
// Add new tab
type TabKey = 'dashboard' | 'transactions' | 'networth' | 'goals' | 'loans' | 'recurring' | ...;

// Add tab button
<button onClick={() => setTab('recurring')} ...>
  Recurring
  {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
</button>

// Add tab content
{tab === 'recurring' && (
  <div className="space-y-6">
    <PendingTransactionsReview />
    <RecurringTransactionsList />
  </div>
)}
```

### 7. Automated Generation

Set up a cron job or scheduled task to call `generate_pending_transactions()` daily. Options:

**Option A: Supabase pg_cron**
```sql
SELECT cron.schedule(
  'generate-pending-transactions',
  '0 0 * * *', -- Every day at midnight
  $$SELECT generate_pending_transactions(user_id) FROM auth.users WHERE deleted_at IS NULL$$
);
```

**Option B: Client-side trigger**
- Call `useGeneratePendingTransactionsMutation()` when user opens the Finances page
- Add to dashboard load effect

## Example Usage Flow

1. **Setup**: User creates recurring transaction for Netflix ($15.99/month)
2. **Auto-generation**: System generates pending transaction 3 days before due date
3. **Review**: User sees notification badge, opens Recurring tab
4. **Approve/Edit**: User can:
   - Quick approve (creates transaction immediately)
   - Edit before approving (modify amount/date/category then approve)
   - Skip this month
   - Delete if no longer needed
5. **Transaction Created**: Approved pending transaction becomes a real transaction

## Benefits

- ✅ Never forget recurring bills
- ✅ Review before transactions are created
- ✅ Adjust amounts if they changed
- ✅ Skip payments when needed
- ✅ Track subscription costs
- ✅ Automatic categorization
- ✅ Forecast upcoming expenses

## Next Steps

1. Apply the database migration
2. Add React Query hooks
3. Build UI components
4. Integrate into Finances page
5. Set up automated generation
6. Test the complete flow
