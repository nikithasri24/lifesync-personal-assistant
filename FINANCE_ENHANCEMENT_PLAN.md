# Finance Tab UI/UX Enhancement Plan

## Context

The Finance feature needs to be updated to match the design specifications in `finance-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Finance page exists at `src/pages/Finances.tsx` with 14 tabs
- Already has FeatureErrorBoundary ✅
- Uses SegmentedControl for tab navigation (scrollable) ✅
- Complex feature with multiple sub-pages: Dashboard, Accounts, Transactions, Budgets, Recurring, Net Worth, Goals, Loans, Retirement, Projections, Calculators, Credit Cards, Insurance, Settings
- Missing: consistent modal structure, auto-save, design spec styling, unified theme

**Goal:**
- Match `finance-design-spec.html` styling exactly
- Apply all Together tab UI patterns across all 14 pages
- Maintain existing functionality (transaction tracking, budgeting, goals, loans, credit cards, insurance, retirement planning)
- Ensure responsive mobile/desktop behavior
- Create reusable modal components for all sub-features

**Why This Matters:**
- Finance is the most complex feature in LifeSync
- Consistent UX across 14 different pages ensures professional feel
- Will serve as reference for managing complex multi-page features

---

## Critical Files to Modify

### Primary Files (Main Page)
1. `src/pages/Finances.tsx` - Main page with tab navigation ✅ (already good)

### Sub-Page Files (14 Pages to Update)
2. `src/finance/pages/DashboardPage.tsx` - Overview with metrics, accounts, transactions
3. `src/finance/pages/AccountsPage.tsx` - Account management
4. `src/finance/pages/TransactionsPage.tsx` - Transaction list and categorization
5. `src/finance/pages/BudgetsPage.tsx` - Budget tracking and management
6. `src/finance/pages/RecurringPage.tsx` - Recurring transactions
7. `src/finance/pages/NetWorthPage.tsx` - Net worth tracking over time
8. `src/finance/pages/GoalsPage.tsx` - Financial goals
9. `src/finance/pages/LoansPage.tsx` - Loan management and tracking
10. `src/finance/pages/RetirementPage.tsx` - Retirement account tracking
11. `src/finance/pages/ProjectionsPage.tsx` - Financial projections
12. `src/finance/pages/CalculatorsPage.tsx` - Financial calculators
13. `src/finance/pages/CreditCardsPage.tsx` - Credit card management
14. `src/finance/pages/InsurancePage.tsx` - Insurance policy tracking
15. `src/finance/pages/SettingsPage.tsx` - Finance settings

### Modal Components (Create V2 Versions)
16. `src/finance/components/v2/AccountFormModalV2.tsx` - Create/edit accounts
17. `src/finance/components/v2/TransactionFormModalV2.tsx` - Create/edit transactions
18. `src/finance/components/v2/BudgetFormModalV2.tsx` - Create/edit budgets
19. `src/finance/components/v2/GoalFormModalV2.tsx` - Create/edit goals
20. `src/finance/components/v2/LoanFormModalV2.tsx` - Create/edit loans
21. `src/finance/components/v2/CreditCardFormModalV2.tsx` - Create/edit credit cards
22. `src/finance/components/v2/InsuranceFormModalV2.tsx` - Create/edit insurance policies

### Card Components (Create V2 Versions)
23. `src/finance/components/v2/AccountCardV2.tsx` - Account display cards
24. `src/finance/components/v2/TransactionItemV2.tsx` - Transaction list items
25. `src/finance/components/v2/BudgetCardV2.tsx` - Budget display cards
26. `src/finance/components/v2/GoalCardV2.tsx` - Goal display cards
27. `src/finance/components/v2/LoanCardV2.tsx` - Loan display cards

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/together/components/modals/*.tsx` - Modal examples
- `finance-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Implementation Plan

### Phase 1: Update Main Page Header

**File:** `src/pages/Finances.tsx`

**Current State:**
```tsx
// ✅ Already has:
// - FeatureErrorBoundary
// - Icon + title header
// - SegmentedControl (scrollable for 14 tabs)
// - Lazy loading for all pages
```

**Changes Needed:**
1. Update header to match design spec gradient:
   ```tsx
   <div
     style={{
       background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
       padding: '60px 20px 20px',
       color: 'white',
       marginBottom: '16px'
     }}
   >
     <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
       💰 Finances
     </h1>
     <div style={{ fontSize: '14px', opacity: 0.9 }}>
       Track income, expenses & wealth
     </div>
   </div>
   ```

2. Move SegmentedControl below header (inside white background section):
   ```tsx
   <div style={{ background: 'rgba(92, 74, 58, 0.1)', borderRadius: '12px', padding: '4px', margin: '16px 20px', overflowX: 'auto' }}>
     <SegmentedControl scrollable segments={[...]} />
   </div>
   ```

**Expected Outcome:**
- Header matches design spec exactly (terracotta gradient, white text)
- SegmentedControl styled consistently
- Scrollable tabs for 14 different pages

---

### Phase 2: Create Metric Card Component

**File:** `src/finance/components/v2/MetricCardV2.tsx` (Create new)

**Purpose:** Display financial metrics consistently across pages

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

type MetricType = 'neutral' | 'positive' | 'negative';

interface MetricCardV2Props {
  label: string;
  value: string | number;
  type?: MetricType;
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCardV2: React.FC<MetricCardV2Props> = ({
  label,
  value,
  type = 'neutral',
  subtitle,
  onClick,
}) => {
  const colors = useThemeColors();

  const getValueGradient = (): string => {
    switch (type) {
      case 'positive':
        return 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
      case 'negative':
        return 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)';
      default:
        return 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)';
    }
  };

  return (
    <div
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          color: '#9B8B7A',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          background: getValueGradient(),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: subtitle ? '4px' : 0,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: '#9B8B7A' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
```

**Expected Outcome:**
- Reusable metric card with gradient values
- Color coding for positive/negative/neutral
- Used across Dashboard, Net Worth, Goals, etc.

---

### Phase 3: Create AccountFormModalV2 Component

**File:** `src/finance/components/v2/AccountFormModalV2.tsx` (Create new)

**Purpose:** Replace existing account modals with Together-pattern modal

**Key Fields:**
- Account name
- Account type (checking, savings, credit, brokerage, 401k, IRA, etc.)
- Institution (dropdown or create new)
- Initial balance
- Credit limit (if credit card)
- APR (if credit/loan)
- Notes

**Structure:** Follow Together pattern exactly:
- Mobile drag handle
- Fixed header with close button
- Scrollable content area
- Fixed footer with Cancel/Save buttons
- Auto-save to localStorage
- ESC key and backdrop support

**Expected Outcome:**
- Account modal matches Together pattern
- All account types supported (checking, savings, credit, investment, retirement)
- Institution selector with create new option
- Auto-save drafts

---

### Phase 4: Create TransactionFormModalV2 Component

**File:** `src/finance/components/v2/TransactionFormModalV2.tsx` (Create new)

**Purpose:** Create/edit transactions with Together pattern

**Key Fields:**
- Date (date picker)
- Description
- Amount
- Type (debit/credit - as toggle or radio cards)
- Account (dropdown)
- Category (dropdown with icons/colors)
- Notes (optional)
- Merchant name (optional, for categorization)

**Special Features:**
- Category selector with icons and colors
- Confidence score indicator (if auto-categorized)
- Split transaction option (advanced feature)

**Expected Outcome:**
- Transaction modal matches Together pattern
- Category selector with visual icons
- Auto-categorization feedback
- Auto-save support

---

### Phase 5: Create BudgetFormModalV2 Component

**File:** `src/finance/components/v2/BudgetFormModalV2.tsx` (Create new)

**Purpose:** Create/edit budgets with Together pattern

**Key Fields:**
- Category (dropdown)
- Month (month picker)
- Limit amount
- Notes (optional)

**Special Features:**
- Month picker component
- Category selector (same as transactions)
- Budget template option (save as template)

**Expected Outcome:**
- Budget modal matches Together pattern
- Month picker for selecting budget period
- Template save option

---

### Phase 6: Create AccountCardV2 Component

**File:** `src/finance/components/v2/AccountCardV2.tsx` (Create new)

**Purpose:** Display account cards consistently

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCurrency } from '@/finance/utils/currency';
import type { Account } from '@/finance/types';

interface AccountCardV2Props {
  account: Account;
  onClick: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
}

export const AccountCardV2: React.FC<AccountCardV2Props> = ({
  account,
  onClick,
  showOwnerBadge = false,
  owner,
}) => {
  const colors = useThemeColors();

  const getAccountIcon = (type: string): string => {
    const icons: Record<string, string> = {
      checking: '💳',
      savings: '🏦',
      credit: '💳',
      brokerage: '📈',
      '401k': '🏢',
      traditional_ira: '🎯',
      roth_ira: '🎯',
      hsa: '🏥',
      loan: '🏠',
    };
    return icons[type] || '💰';
  };

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        borderLeft: '4px solid #D4A574',
      }}
    >
      {/* Owner Badge */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
            {getAccountIcon(account.type)} {account.name}
          </div>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginTop: '2px' }}>
            {account.type.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#5C4A3A' }}>
          {formatCurrency(account.balance)}
        </div>
      </div>

      {/* Institution */}
      {account.institutionId && (
        <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '4px' }}>
          {/* Institution name from institutionId */}
        </div>
      )}

      {/* Credit Card Details */}
      {account.type === 'credit' && account.creditLimit && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #E8DCC8',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '6px' }}>
            Utilization: {account.balance > 0 ? Math.round((account.balance / account.creditLimit) * 100) : 0}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#E8DCC8',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${account.balance > 0 ? Math.min((account.balance / account.creditLimit) * 100, 100) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

**Expected Outcome:**
- Account cards with left border accent
- Account type icons
- Balance prominently displayed
- Credit card utilization bar (if applicable)
- Owner badge for merged mode

---

### Phase 7: Create TransactionItemV2 Component

**File:** `src/finance/components/v2/TransactionItemV2.tsx` (Create new)

**Purpose:** Display transaction list items

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCurrency } from '@/finance/utils/currency';
import type { Transaction } from '@/finance/types';

interface TransactionItemV2Props {
  transaction: Transaction;
  category?: { name: string; icon?: string; color?: string };
  onClick: () => void;
}

export const TransactionItemV2: React.FC<TransactionItemV2Props> = ({
  transaction,
  category,
  onClick,
}) => {
  const colors = useThemeColors();

  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(139, 111, 71, 0.06)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: category?.color
            ? `${category.color}20`
            : 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}
      >
        {category?.icon || '💰'}
      </div>

      {/* Details */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#5C4A3A' }}>
          {transaction.description}
        </div>
        <div style={{ fontSize: '13px', color: '#9B8B7A', marginTop: '2px' }}>
          {category?.name || 'Uncategorized'} • {new Date(transaction.dateISO).toLocaleDateString()}
        </div>
      </div>

      {/* Amount */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: transaction.type === 'credit' ? '#4CAF50' : '#5C4A3A',
        }}
      >
        {transaction.type === 'credit' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Transaction items with category icons
- Color-coded amounts (green for income, default for expenses)
- Category badge
- Date display

---

### Phase 8: Create BudgetCardV2 Component

**File:** `src/finance/components/v2/BudgetCardV2.tsx` (Create new)

**Purpose:** Display budget cards with progress bars

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCurrency } from '@/finance/utils/currency';
import type { Budget } from '@/finance/types';

interface BudgetCardV2Props {
  budget: Budget;
  spent: number;
  category: { name: string; icon?: string; color?: string };
  onClick: () => void;
}

export const BudgetCardV2: React.FC<BudgetCardV2Props> = ({
  budget,
  spent,
  category,
  onClick,
}) => {
  const colors = useThemeColors();
  const percentage = Math.min((spent / budget.limit) * 100, 100);
  const isOverBudget = spent > budget.limit;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        borderLeft: `4px solid ${isOverBudget ? '#F44336' : category.color || '#D4A574'}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{category.icon || '📦'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
              {category.name}
            </div>
            <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
              {budget.month}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: isOverBudget ? '#F44336' : '#5C4A3A' }}>
            {formatCurrency(spent)}
          </div>
          <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
            of {formatCurrency(budget.limit)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: '#E8DCC8',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: isOverBudget
              ? 'linear-gradient(90deg, #F44336 0%, #D32F2F 100%)'
              : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Status */}
      <div
        style={{
          fontSize: '12px',
          color: isOverBudget ? '#F44336' : '#4CAF50',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        {isOverBudget
          ? `Over by ${formatCurrency(spent - budget.limit)}`
          : `${formatCurrency(budget.limit - spent)} remaining`}
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Budget cards with progress bars
- Color coding (green if under, red if over)
- Remaining amount display
- Category icon and color

---

### Phase 9: Update Dashboard Page

**File:** `src/finance/pages/DashboardPage.tsx`

**Changes:**
1. Use MetricCardV2 for key metrics (income, expenses, cashflow)
2. Use AccountCardV2 for account list
3. Use TransactionItemV2 for recent transactions
4. Add month picker component
5. Add owner filter (for merged mode)

**Layout:**
```tsx
<div style={{ padding: '0 20px 100px' }}>
  {/* Month Picker */}
  <MonthPickerV2 month={month} onChange={setMonth} />

  {/* Owner Filter (if merged mode) */}
  {mergedConnection && <OwnerFilter />}

  {/* Metrics Grid */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
    <MetricCardV2 label="Income" value={formatCurrency(income)} type="positive" />
    <MetricCardV2 label="Expenses" value={formatCurrency(expenses)} type="negative" />
    <MetricCardV2 label="Cashflow" value={formatCurrency(cashflow)} type={cashflow >= 0 ? 'positive' : 'negative'} />
  </div>

  {/* Accounts Section */}
  <h2>Accounts</h2>
  {accounts.map(account => (
    <AccountCardV2 key={account.id} account={account} onClick={() => handleEdit(account)} />
  ))}

  {/* Recent Transactions */}
  <h2>Recent Transactions</h2>
  {transactions.slice(0, 10).map(txn => (
    <TransactionItemV2 key={txn.id} transaction={txn} onClick={() => handleEdit(txn)} />
  ))}
</div>
```

**Expected Outcome:**
- Dashboard uses all V2 components
- Metrics displayed prominently
- Recent accounts and transactions visible

---

### Phase 10: Update Remaining Pages (Apply Patterns)

**Pages to Update:** 13 remaining pages

**Apply These Patterns to Each Page:**
1. Use V2 modal components (AccountFormModalV2, TransactionFormModalV2, etc.)
2. Use V2 card components (AccountCardV2, TransactionItemV2, BudgetCardV2, etc.)
3. Add FAB (floating action button) for primary action
4. Add owner filter (for merged mode)
5. Use MetricCardV2 for displaying metrics
6. Empty states with emoji + CTA
7. Loading states (skeleton screens)
8. Consistent spacing and layout

**Example for each page type:**

**Accounts Page:**
- Header with total balance metric
- Owner filter
- Account cards (AccountCardV2)
- FAB to add new account
- Empty state

**Transactions Page:**
- Month picker
- Owner filter
- Category filter pills
- Transaction list (TransactionItemV2)
- FAB to add new transaction
- Infinite scroll or pagination

**Budgets Page:**
- Month picker
- Owner filter
- Budget cards (BudgetCardV2)
- Total budget vs spent metric
- FAB to add new budget
- Empty state

**Goals Page:**
- Goal cards with progress bars
- Priority/category filters
- FAB to add new goal
- Empty state

**Credit Cards Page:**
- Credit card cards with utilization
- Payment due alerts
- Rewards tracking
- FAB to add new card

**Expected Outcome:**
- All 14 pages follow consistent patterns
- Each page uses appropriate V2 components
- FABs for primary actions
- Owner filters for merged mode

---

### Phase 11: Create Additional Modal Components

**Create these modals following Together pattern:**

1. **GoalFormModalV2** - Financial goals with target amount, deadline, progress
2. **LoanFormModalV2** - Loan details with payment schedule
3. **CreditCardFormModalV2** - Credit card with benefits, rewards, fees
4. **InsuranceFormModalV2** - Insurance policy details
5. **RecurringTransactionFormModalV2** - Recurring transaction rules

**Each Modal Should Have:**
- Together pattern structure
- Auto-save to localStorage
- ESC key and backdrop support
- Mobile drag handle
- Fixed header/footer
- Scrollable content
- Validation and error handling

---

### Phase 12: Add FABs to All Pages

**Add floating action button to each page:**

```tsx
<button
  onClick={() => openCreateModal()}
  className="fixed rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
  style={{
    bottom: '90px',
    right: '30px',
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
    boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
    zIndex: 50,
  }}
  aria-label="Add new item"
>
  +
</button>
```

**Expected Outcome:**
- Every page has FAB for primary action
- FAB positioned above mobile navigation
- Terracotta gradient background

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/Finances.tsx`

**Current State:**
```typescript
// ✅ ALREADY IMPLEMENTED - Finances page already has error boundary!
const Finances: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Finances">
      <div>...</div>
    </FeatureErrorBoundary>
  );
};
```

**Impact:** High - Already done! ✅ No action needed.

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/finance -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=finance

# Check exports
grep -r "from.*finance" src
```

**Process:**
1. List all components in legacy directories
2. For each component:
   - Search codebase for imports
   - Check if used in any page
   - If NOT used → Mark for deletion
3. Delete unused files
4. Clean up barrel exports (index.ts)

**Common Dead Code Patterns:**
- Old modal components (replaced by V2 modals)
- Legacy card components
- Unused calculator components
- Duplicate form components
- Old filter components

**Example Cleanup:**
```bash
# After investigation, delete unused files
rm src/finance/components/AccountModal.tsx
rm src/finance/components/budgets/BudgetEditor.tsx
rm src/finance/components/goals/GoalEditor.tsx
rm src/finance/components/loans/LoanEditor.tsx

# Update index.ts to remove deleted exports
# (Manual edit to remove references to deleted components)

# Stage deletions
git add -u src/finance/
```

**Expected Impact:** -500 to -2,000 lines (Finance is very large)

---

### Step 3: Replace Duplicate Date Formatting

**Why:** DRY principle, consistent formatting, less code to maintain

**Problem Pattern:**
```typescript
// ❌ DUPLICATE in component (10-20 lines)
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const entryDate = new Date(date);
  const diffMs = now.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return entryDate.toLocaleDateString();
};
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { getRelativeTime } from '@/utils/dateUtils';

// In component:
{getRelativeTime(transaction.dateISO)}
```

**Search for Duplicates:**
```bash
# Find potential date formatting code
grep -r "toLocaleDateString\|getTime\|setHours.*0.*0.*0" src/finance/components/
```

**Expected Impact:** -50 to -100 lines across all finance pages

---

### Step 4: Replace Framer Motion with CSS Transitions

**Why:** Smaller bundle (-20-30KB), better performance, native browser optimization

**Solution:**
```typescript
// ✅ CSS TRANSITIONS (equivalent effect, zero JS)
<div
  className="transition-transform hover:scale-[1.01] active:scale-[0.98]"
  style={{ transitionDuration: '150ms' }}
>
```

**Search for Usage:**
```bash
# Find Framer Motion imports
grep -r "framer-motion" src/finance/
```

**Expected Impact:** -20-30KB bundle size

---

### Step 5: Use Theme Colors Consistently

**Why:** Automatic dark mode support, consistency, easier theming

**Solution:**
```typescript
// ✅ THEME COLORS (automatic dark mode)
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();

<div style={{ color: colors.text.primary }}>
<div style={{ backgroundColor: colors.bg.secondary }}>
<div style={{ borderColor: colors.border.light }}>
```

**Search for Hardcoded Colors:**
```bash
# Find hex colors in components
grep -r "#[0-9A-Fa-f]\{6\}" src/finance/components/
```

**Expected Impact:** 20-50 hardcoded colors replaced

---

### Step 6: Use Shared Date Comparison Utilities

**Why:** DRY principle, consistent date logic

**Solution:**
```typescript
// ✅ USE SHARED UTILITY (1 line)
import { isSameDay } from '@/utils/dateUtils';

const selectedItems = items.filter(item =>
  isSameDay(item.dateISO, selectedDate)
);
```

**Expected Impact:** -30 to -60 lines across all pages

---

### Step 7: Clean Up Unused Imports

**How:**
```bash
# Build will show warnings
npm run build

# Or use ESLint
npx eslint src/finance --fix
```

**Common Unused Imports After V2 Migration:**
- Old modal imports (AccountModal, BudgetEditor, GoalEditor, etc.)
- Unused icon imports
- Framer Motion
- Unused type imports
- Duplicate utility imports

---

### Step 8: Clean Up Module Exports

**Why:** Clear API, prevents importing deleted components

**File:** `src/finance/index.ts` or `src/finance/components/v2/index.ts`

**After:**
```typescript
// ✅ Only export active components, grouped logically

// V2 Components (primary)
export { AccountFormModalV2 } from './v2/AccountFormModalV2';
export { TransactionFormModalV2 } from './v2/TransactionFormModalV2';
export { BudgetFormModalV2 } from './v2/BudgetFormModalV2';
export { AccountCardV2 } from './v2/AccountCardV2';
export { TransactionItemV2 } from './v2/TransactionItemV2';
export { BudgetCardV2 } from './v2/BudgetCardV2';
export { MetricCardV2 } from './v2/MetricCardV2';

// Legacy (actively used only)
export { SankeyChart } from './visualizations/SankeyChart'; // Still in use

// Hooks
export { useFinanceMetrics } from '../hooks/useFinanceMetrics';
```

---

### Step 9: Verification & Testing

**Build Check:**
```bash
# Ensure no TypeScript errors
npx tsc --noEmit

# Ensure build succeeds
npm run build

# Check for warnings
npm run build 2>&1 | grep -i "warning"
```

**Manual Testing:**
- [ ] All 14 pages load without errors
- [ ] All modals open/close correctly
- [ ] CRUD operations work (accounts, transactions, budgets, goals, loans)
- [ ] Charts render correctly
- [ ] Filters work (owner, category, date)
- [ ] Calculations accurate (net worth, budget progress, loan payments)
- [ ] Responsive design intact
- [ ] Error boundary catches errors

---

### Code Quality Checklist

After completing all steps, verify:

- [ ] ✅ Error boundary added to main page component (already done!)
- [ ] ✅ Dead code identified and deleted (0 unused files remain)
- [ ] ✅ Duplicate date formatting replaced with `getRelativeTime()`
- [ ] ✅ Duplicate date comparison replaced with `isSameDay()`
- [ ] ✅ Framer Motion replaced with CSS (if applicable)
- [ ] ✅ Theme colors used consistently (no hardcoded hex colors)
- [ ] ✅ Unused imports removed
- [ ] ✅ Module exports cleaned up (only active components exported)
- [ ] ✅ Build succeeds with no errors or warnings
- [ ] ✅ Manual testing completed for all 14 pages
- [ ] ✅ Module marked as 100% CLAUDE.md compliant

---

### Expected Overall Impact

**Metrics:**
- Lines removed: -500 to -2,000 (Finance is very large)
- Files deleted: 10-30 legacy components
- Bundle size: -20-40KB (if Framer Motion removed)
- Error boundaries: Already in place ✅
- Code grade: C/D range → A (95/100)

**Benefits:**
- ✅ Crash isolation (errors don't take down entire app)
- ✅ Smaller bundle (faster load times)
- ✅ Less maintenance (no duplicate code)
- ✅ Consistent theming (dark mode ready)
- ✅ Better performance (CSS vs JS animations)
- ✅ Cleaner codebase (easier to understand)

---

## File Modification Summary

**Files to Create:** 13
- ✏️ `src/finance/components/v2/MetricCardV2.tsx`
- ✏️ `src/finance/components/v2/AccountFormModalV2.tsx`
- ✏️ `src/finance/components/v2/TransactionFormModalV2.tsx`
- ✏️ `src/finance/components/v2/BudgetFormModalV2.tsx`
- ✏️ `src/finance/components/v2/GoalFormModalV2.tsx`
- ✏️ `src/finance/components/v2/LoanFormModalV2.tsx`
- ✏️ `src/finance/components/v2/CreditCardFormModalV2.tsx`
- ✏️ `src/finance/components/v2/InsuranceFormModalV2.tsx`
- ✏️ `src/finance/components/v2/AccountCardV2.tsx`
- ✏️ `src/finance/components/v2/TransactionItemV2.tsx`
- ✏️ `src/finance/components/v2/BudgetCardV2.tsx`
- ✏️ `src/finance/components/v2/GoalCardV2.tsx`
- ✏️ `src/finance/components/v2/LoanCardV2.tsx`

**Files to Update:** 15
- ✏️ `src/pages/Finances.tsx` - Update header with gradient
- ✏️ `src/finance/pages/DashboardPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/AccountsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/TransactionsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/BudgetsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/RecurringPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/NetWorthPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/GoalsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/LoansPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/RetirementPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/ProjectionsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/CalculatorsPage.tsx` - Keep as-is (complex)
- ✏️ `src/finance/pages/CreditCardsPage.tsx` - Use V2 components
- ✏️ `src/finance/pages/InsurancePage.tsx` - Use V2 components
- ✏️ `src/finance/pages/SettingsPage.tsx` - Use V2 components

**Files to Delete (After Investigation):** 10-30
- 🗑️ `src/finance/components/AccountModal.tsx` (replaced by AccountFormModalV2)
- 🗑️ `src/finance/components/budgets/BudgetEditor.tsx` (replaced by BudgetFormModalV2)
- 🗑️ `src/finance/components/goals/GoalEditor.tsx` (replaced by GoalFormModalV2)
- 🗑️ `src/finance/components/loans/LoanEditor.tsx` (replaced by LoanFormModalV2)
- 🗑️ Other unused legacy components (after investigation)

**Reference Files:** 4
- 📖 `finance-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```bash
feat: Complete Finance tab UI/UX enhancement with Together patterns

Updated Finance feature (14 sub-pages) to match finance-design-spec.html
and apply all 25 UI/UX enhancement patterns from CLAUDE.md. Major
improvements include:

UI Components:
- Updated header: Terracotta gradient with clean title
- Created MetricCardV2: Reusable metric display with color coding
- Created AccountCardV2: Account cards with utilization bars
- Created TransactionItemV2: Transaction list items with category icons
- Created BudgetCardV2: Budget cards with progress bars
- Created GoalCardV2: Goal cards with progress tracking
- Created LoanCardV2: Loan cards with payment schedules

Modals (Together Pattern) - 7 new modals:
- AccountFormModalV2: Account creation/editing
- TransactionFormModalV2: Transaction entry with categorization
- BudgetFormModalV2: Budget management with templates
- GoalFormModalV2: Financial goal tracking
- LoanFormModalV2: Loan management
- CreditCardFormModalV2: Credit card tracking with rewards
- InsuranceFormModalV2: Insurance policy management
- All modals: Auto-save, ESC key, backdrop, mobile drag handles

Pages Updated (14 total):
- Dashboard: Metrics, accounts, recent transactions
- Accounts: Account management with institution linking
- Transactions: Categorization, filtering, search
- Budgets: Month-by-month budget tracking
- Recurring: Recurring transaction management
- Net Worth: Asset/liability tracking over time
- Goals: Financial goal progress
- Loans: Loan tracking with amortization
- Retirement: 401k, IRA, pension tracking
- Projections: Financial forecasting
- Calculators: Various financial calculators
- Credit Cards: Utilization, rewards, benefits tracking
- Insurance: Policy management
- Settings: Finance preferences

Features:
- 14 sub-pages with consistent UI patterns
- Merged mode support across all pages
- Owner filters for shared finances
- Month pickers for time-based views
- Category management with icons/colors
- Auto-categorization for transactions
- Budget templates
- Financial calculators (8 types)
- Net worth tracking over time
- Goal progress visualization
- Loan amortization schedules
- Credit card utilization tracking
- Retirement account management

Code Quality:
- Removed 10-30 legacy components
- Replaced duplicate date formatting with shared utilities
- Used theme colors consistently
- Cleaned up unused imports
- Module exports organized
- -500 to -2,000 lines removed

Technical:
- All V2 components in src/finance/components/v2/
- Error boundary already in place ✅
- Lazy loading for all 14 pages
- Responsive mobile/desktop behavior
- Charts and visualizations maintained

Fixes:
- Header matches design spec
- All modals follow Together pattern
- Consistent FABs on all pages
- Owner filters for merged mode
- Empty states for all pages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Finances page matches `finance-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied across 14 pages
✅ All modals match Together pattern
✅ Auto-save functionality works
✅ All 14 pages updated with V2 components
✅ FABs on every page
✅ Owner filters for merged mode
✅ Charts and calculations working
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Finance-Specific Challenges

### Challenge 1: 14 Different Sub-Pages

**Solution:**
- Create reusable V2 components (MetricCardV2, AccountCardV2, etc.)
- Apply consistent patterns to each page
- Prioritize Dashboard, Accounts, Transactions, Budgets first
- Use same modal patterns across all pages

### Challenge 2: Complex Calculations

**Solution:**
- Keep existing calculation utilities in `src/finance/utils/`
- Don't modify calculation logic, just update UI
- Test calculations thoroughly after UI updates

### Challenge 3: Charts and Visualizations

**Solution:**
- Keep existing chart components (SankeyChart, StackedBarChart, etc.)
- Update styling to match design spec
- Ensure charts are responsive

### Challenge 4: Merged Mode Complexity

**Solution:**
- Add owner filters to all pages
- Use OwnerBadge component consistently
- Split metrics by owner where relevant
- Test merged mode thoroughly

### Challenge 5: Category Management

**Solution:**
- Create category selector component with icons/colors
- Use consistent category icons across transactions/budgets
- Support creating new categories from modals

---

## Notes

- Finance is the most complex feature with 14 sub-pages
- Already has FeatureErrorBoundary ✅
- Scrollable SegmentedControl works well for 14 tabs
- Keep existing calculators as-is (already complex)
- Keep existing charts/visualizations (already working)
- Focus on modal structure, card components, and consistent styling
- Test calculations thoroughly - don't break existing logic
- Merged mode support is critical for shared finances
