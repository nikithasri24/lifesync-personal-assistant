# Recurring Transactions - Feature Complete! 🎉

## Overview
The recurring transactions feature is now **fully implemented** with both backend and frontend components. This allows you to set up recurring bills, subscriptions, and income that automatically generate for review before being added to your transactions.

## ✅ What's Been Implemented

### 1. Database Layer
- **Tables**: `recurring_transactions`, `pending_transactions`
- **View**: `recurring_transactions_upcoming` (shows next occurrence dates)
- **Functions**: Auto-generation with smart date calculations
- **Migration**: `supabase/migrations/20251208_add_recurring_transactions.sql`

### 2. TypeScript Types
- `RecurringTransaction` - Template for recurring transactions
- `PendingTransaction` - Auto-generated transactions awaiting approval
- `RecurringFrequency` - daily | weekly | biweekly | monthly | quarterly | yearly
- Full type safety throughout the system

### 3. API Layer (`src/finance/data/supabaseApi.ts`)
```typescript
- listRecurringTransactions()
- upsertRecurringTransaction()
- deleteRecurringTransaction()
- generatePendingTransactions()
- listPendingTransactions()
- approvePendingTransaction()
- skipPendingTransaction()
- deletePendingTransaction()
```

### 4. React Query Hooks (`src/finance/hooks/useFinanceQuery.ts`)
```typescript
- useRecurringTransactionsQuery()
- usePendingTransactionsQuery() // Auto-refetches every minute
- useUpsertRecurringTransactionMutation()
- useDeleteRecurringTransactionMutation()
- useApprovePendingTransactionMutation()
- useSkipPendingTransactionMutation()
- useDeletePendingTransactionMutation()
- useGeneratePendingTransactionsMutation()
```

### 5. UI Components (`src/finance/components/recurring/`)

#### RecurringTransactionEditor
Full-featured modal for creating/editing recurring transactions:
- Description, amount, type (expense/income)
- Category and account selection
- Frequency selection (daily to yearly)
- Day-of-month for monthly (1-31 or last day)
- Day-of-week for weekly
- Start and end dates
- Auto-create settings
- Approval requirement
- Days before generation (default 3)
- Active/inactive toggle
- Notes field

#### RecurringTransactionsList
Beautiful card grid showing all recurring transaction templates:
- Next occurrence date display
- Pending count badges
- Quick active/inactive toggle
- Edit/delete actions
- Frequency labels
- Amount display
- Empty state with helpful messaging

#### PendingTransactionsReview
Smart approval workflow with grouped display:
- **Grouped by time**: Overdue, Today, Tomorrow, This Week, Later
- **Color-coded**: Red for overdue, amber for today, blue for tomorrow
- **Quick actions**:
  - ✅ Approve (one click)
  - ✏️ Edit & Approve (modify before approving)
  - ⏭️ Skip (skip this occurrence)
  - 🗑️ Delete
- **Collapsible groups**: Expand/collapse sections
- **Inline editing**: Edit amount, date, category before approving

#### RecurringPage
Combined page that shows both pending review and recurring templates:
- Auto-generates pending transactions on load
- Clean, organized layout
- Responsive design

### 6. Integration (`src/pages/Finances.tsx`)
- New "Recurring" tab in Finances section
- Lazy-loaded for performance
- Seamlessly integrated with existing tabs

## 📋 Setup Instructions

### Step 1: Apply Database Migration
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/20251208_add_recurring_transactions.sql`
4. Execute the SQL

### Step 2: Start Using
1. Navigate to **Finances → Recurring** tab
2. Click "Add Recurring" button
3. Fill in details (e.g., Netflix $15.99/month)
4. Save!

## 🚀 How It Works

### Setting Up a Recurring Transaction
1. Click "Add Recurring" button
2. Enter details:
   - Description: "Netflix Subscription"
   - Amount: $15.99
   - Type: Expense
   - Category: Entertainment → Streaming
   - Frequency: Monthly
   - Day of month: 1 (or any day 1-31)
   - Start date: Today
   - Generate: 3 days before
   - Require approval: ✓
3. Save

### Automatic Generation
The system automatically generates a pending transaction 3 days before it's due. For example:
- If Netflix is due on the 1st
- A pending transaction is created on the 28th/29th
- You'll see it in the "Pending Transactions" section

### Approval Workflow
When you see a pending transaction, you can:

1. **Quick Approve** ✅
   - Click the green checkmark
   - Transaction is created immediately with original details

2. **Edit & Approve** ✏️
   - Click the blue edit button
   - Modify amount, date, category, or account
   - Click "Save & Approve"
   - Transaction is created with your edits

3. **Skip** ⏭️
   - Click the gray clock button
   - This occurrence is marked as skipped
   - Next occurrence will still generate normally

4. **Delete** 🗑️
   - Click the red X button
   - Removes this pending transaction
   - Won't affect future occurrences

## 💡 Use Cases

### Subscriptions
```
Netflix: $15.99/month on the 1st
Spotify: $9.99/month on the 5th
Amazon Prime: $14.99/month on the 15th
```

### Bills
```
Rent: $2,000/month on the 1st
Electric: Varies, monthly on the 20th (edit amount when approving)
Internet: $80/month on the 10th
```

### Income
```
Salary: $5,000/biweekly on Fridays
Freelance: Varies, monthly (edit amount when approving)
```

### Temporary Subscriptions
```
Gym membership: $50/month, ends on 12/31/2025
Trial subscription: $0/monthly for 3 months
```

## 🎨 Features

- ✅ **Smart Scheduling**: Daily, weekly, biweekly, monthly, quarterly, yearly
- ✅ **Flexible Dates**: Specific day of month or last day of month
- ✅ **Review Workflow**: Approve, edit, skip, or delete before creation
- ✅ **Auto-Generation**: Creates pending transactions X days before due
- ✅ **End Dates**: Set expiration for temporary subscriptions
- ✅ **Active Toggle**: Pause recurring transactions without deleting
- ✅ **Badge Notifications**: See pending count on each recurring template
- ✅ **Time Grouping**: Overdue, today, tomorrow, this week, later
- ✅ **Inline Editing**: Modify amount/date/category before approving
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Type Safety**: Full TypeScript coverage

## 🔄 Workflow Example

### Month 1: Setup
1. Create "Netflix - $15.99/month" recurring transaction
2. Set to generate 3 days before the 1st
3. Mark as active

### Month 1: Generation (Day 28/29)
1. System auto-generates pending transaction
2. You see badge: "1 pending for review"
3. Go to Recurring tab

### Month 1: Review (Day 28-31)
1. See pending transaction in "This Week" group
2. Click ✅ to approve
3. Transaction is created for the 1st

### Month 2: Same Process
1. System auto-generates again on the 28th/29th
2. You review and approve
3. Recurring!

### Special Case: Price Increase
1. See pending Netflix transaction
2. Notice price increased to $17.99
3. Click ✏️ Edit
4. Change amount to $17.99
5. Click "Save & Approve"
6. Transaction created with new amount
7. (Optionally update the recurring template too)

## 🎯 Benefits

1. **Never Forget Bills**: Automatic generation ensures you're reminded
2. **Review Before Commitment**: Approve/edit before transaction is created
3. **Flexible Amounts**: Great for utilities that vary month-to-month
4. **Budget Forecasting**: See upcoming expenses in advance
5. **Time Savings**: No more manual entry of the same transactions
6. **Accuracy**: Pre-filled category and account
7. **Subscription Tracking**: Know exactly what you're paying for

## 🚨 Important Notes

- Pending transactions **do not** affect your balance until approved
- Skipping an occurrence doesn't cancel the recurring template
- Deleting a pending transaction doesn't affect future occurrences
- Deleting a recurring template deletes all its pending transactions
- Inactive recurring templates don't generate new pending transactions

## 📊 Database Schema

```sql
recurring_transactions
├── id (uuid)
├── description (text)
├── amount (numeric)
├── type (credit|debit)
├── category_id (uuid, nullable)
├── account_id (uuid, nullable)
├── frequency (daily|weekly|biweekly|monthly|quarterly|yearly)
├── start_date (date)
├── end_date (date, nullable)
├── day_of_month (integer, nullable)
├── day_of_week (integer, nullable)
├── auto_create (boolean)
├── require_approval (boolean)
├── days_before (integer)
├── active (boolean)
└── notes (text, nullable)

pending_transactions
├── id (uuid)
├── recurring_transaction_id (uuid, nullable)
├── description (text)
├── amount (numeric)
├── type (credit|debit)
├── category_id (uuid, nullable)
├── account_id (uuid, nullable)
├── scheduled_date (date)
├── status (pending|approved|skipped|edited)
├── transaction_id (uuid, nullable)
└── notes (text, nullable)
```

## 🎉 You're All Set!

The recurring transactions feature is now fully functional and integrated into your finance app. Just apply the database migration and start using it!

**Happy budgeting! 💰**
