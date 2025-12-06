# Budget Management System - Technical Specification

## Document Information
- **Feature**: Budget Management with Zero-Based Budgeting
- **Author**: CTO-Level Implementation
- **Date**: 2025-01-17
- **Status**: Planning Phase
- **Priority**: P0 (High Impact)

---

## 1. Executive Summary

Implement a comprehensive budget management system following YNAB's proven zero-based budgeting methodology, with real-time tracking, visual progress indicators, and intelligent alerts.

### Success Metrics
- **User Engagement**: 80%+ of users set budgets within first week
- **Accuracy**: Budget calculations 100% accurate with transaction data
- **Performance**: Page load < 500ms, budget updates < 100ms
- **UX**: 90%+ users understand budget status at a glance

---

## 2. Research Findings

### YNAB Methodology (Zero-Based Budgeting)
1. **Every Dollar Gets a Job**: Assign all income to categories before spending
2. **Embrace True Expenses**: Budget for irregular expenses monthly
3. **Roll With the Punches**: Move money between categories as needed
4. **Age Your Money**: Build buffer by spending last month's income

### Competitor Analysis
- **YNAB**: $14.99/month, focuses on zero-based budgeting, goal tracking
- **EveryDollar**: Similar envelope system, Ramsey Solutions
- **Goodbudget**: Digital envelope budgeting with transparency
- **Monarch Money**: AI-powered insights, $99/year

### UI Best Practices (2025)
- **Progress Bars**: Visual spending vs budget with color coding
- **Real-Time Updates**: Instant feedback on budget status
- **Color Coding**: Green (under), Yellow (80-100%), Red (over)
- **Categorized Icons**: Visual category identification
- **Notifications**: Alerts for overspending, approaching limits
- **Mobile-First**: Touch-friendly interactions, swipe gestures

---

## 3. Feature Requirements

### 3.1 Core Features (MVP)

#### Budget Creation
- ✅ Set monthly budget limit per category
- ✅ Support decimal amounts
- ✅ One budget per category per month
- ✅ Default to $0 (zero-based)

#### Budget Tracking
- ✅ Real-time spent vs budget calculation
- ✅ Percentage progress calculation
- ✅ Remaining amount display
- ✅ Historical budget performance

#### Visual Indicators
- ✅ Progress bars with color coding:
  - Green: 0-79% spent
  - Yellow: 80-99% spent
  - Red: 100%+ spent
- ✅ Budget status badges
- ✅ Spending trend charts

#### Alerts & Notifications
- ✅ Warning at 80% spent
- ✅ Alert at 100% spent
- ✅ Daily/weekly spending summaries
- ✅ Month-end budget review

### 3.2 Advanced Features (Phase 2)

#### Rollover Logic
- ⏳ Carry unspent budget to next month
- ⏳ Option to rollover or reset
- ⏳ Rollover history tracking

#### Budget Templates
- ⏳ Save common budget configurations
- ⏳ Quick apply to new months
- ⏳ Seasonal budget variations

#### Budget Goals
- ⏳ Long-term savings goals
- ⏳ Debt payoff tracking
- ⏳ Emergency fund target

---

## 4. Database Schema Design

### 4.1 Existing Tables (Reference)
```sql
-- categories table (already exists)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id),
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

-- transactions table (already exists with smart categorization)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  category_id uuid REFERENCES categories(id),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('debit', 'credit')),
  merchant_name text,
  confidence_score numeric(3,2),
  created_at timestamptz DEFAULT now()
);
```

### 4.2 New Tables

#### budgets table
```sql
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  category_id uuid NOT NULL REFERENCES categories(id),
  month date NOT NULL, -- First day of month (e.g., '2025-01-01')
  limit_amount numeric(12,2) NOT NULL CHECK (limit_amount >= 0),
  rollover_amount numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, category_id, month),
  CHECK (date_trunc('month', month) = month) -- Ensure first day of month
);

-- Indexes for performance
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_lookup ON budgets(user_id, category_id, month);
```

#### budget_alerts table (for notification history)
```sql
CREATE TABLE budget_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  budget_id uuid NOT NULL REFERENCES budgets(id),
  alert_type text NOT NULL CHECK (alert_type IN ('warning_80', 'critical_100', 'overspent')),
  alert_percentage numeric(5,2) NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz
);

CREATE INDEX idx_budget_alerts_user ON budget_alerts(user_id, triggered_at DESC);
```

### 4.3 Database Functions

#### Calculate Spent Amount
```sql
CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id uuid,
  p_category_id uuid,
  p_month date
) RETURNS numeric AS $$
DECLARE
  v_spent numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_spent
  FROM transactions
  WHERE user_id = p_user_id
    AND category_id = p_category_id
    AND date >= date_trunc('month', p_month)
    AND date < date_trunc('month', p_month) + interval '1 month'
    AND type = 'debit'; -- Only count expenses

  RETURN v_spent;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### Get Budget Status
```sql
CREATE OR REPLACE FUNCTION get_budget_status(
  p_user_id uuid,
  p_month date
) RETURNS TABLE (
  category_id uuid,
  category_name text,
  budget_limit numeric,
  spent numeric,
  remaining numeric,
  percentage numeric,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.category_id,
    c.name as category_name,
    b.limit_amount as budget_limit,
    calculate_budget_spent(b.user_id, b.category_id, b.month) as spent,
    (b.limit_amount - calculate_budget_spent(b.user_id, b.category_id, b.month)) as remaining,
    CASE
      WHEN b.limit_amount > 0
      THEN (calculate_budget_spent(b.user_id, b.category_id, b.month) / b.limit_amount * 100)
      ELSE 0
    END as percentage,
    CASE
      WHEN calculate_budget_spent(b.user_id, b.category_id, b.month) > b.limit_amount THEN 'over'
      WHEN calculate_budget_spent(b.user_id, b.category_id, b.month) >= (b.limit_amount * 0.8) THEN 'warning'
      ELSE 'ok'
    END as status
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
  WHERE b.user_id = p_user_id
    AND b.month = date_trunc('month', p_month)
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4.4 Row-Level Security

```sql
-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for budgets
DROP POLICY IF EXISTS "own_budgets_select" ON budgets;
CREATE POLICY "own_budgets_select" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_budgets_insert" ON budgets;
CREATE POLICY "own_budgets_insert" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_budgets_update" ON budgets;
CREATE POLICY "own_budgets_update" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_budgets_delete" ON budgets;
CREATE POLICY "own_budgets_delete" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for budget_alerts (similar pattern)
DROP POLICY IF EXISTS "own_alerts_select" ON budget_alerts;
CREATE POLICY "own_alerts_select" ON budget_alerts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_alerts_insert" ON budget_alerts;
CREATE POLICY "own_alerts_insert" ON budget_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4.5 Triggers

#### Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### Auto-create budget alerts
```sql
CREATE OR REPLACE FUNCTION check_budget_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_budget RECORD;
  v_spent numeric;
  v_percentage numeric;
BEGIN
  -- Get budget for this transaction's category and month
  SELECT * INTO v_budget
  FROM budgets
  WHERE user_id = NEW.user_id
    AND category_id = NEW.category_id
    AND month = date_trunc('month', NEW.date);

  IF FOUND AND v_budget.limit_amount > 0 THEN
    -- Calculate spent amount
    v_spent := calculate_budget_spent(NEW.user_id, NEW.category_id, v_budget.month);
    v_percentage := (v_spent / v_budget.limit_amount) * 100;

    -- Create alerts if thresholds crossed
    IF v_percentage >= 100 AND NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE budget_id = v_budget.id
        AND alert_type = 'critical_100'
        AND triggered_at > now() - interval '1 day'
    ) THEN
      INSERT INTO budget_alerts (user_id, budget_id, alert_type, alert_percentage)
      VALUES (NEW.user_id, v_budget.id, 'critical_100', v_percentage);
    ELSIF v_percentage >= 80 AND NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE budget_id = v_budget.id
        AND alert_type = 'warning_80'
        AND triggered_at > now() - interval '1 day'
    ) THEN
      INSERT INTO budget_alerts (user_id, budget_id, alert_type, alert_percentage)
      VALUES (NEW.user_id, v_budget.id, 'warning_80', v_percentage);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_threshold_check
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.type = 'debit' AND NEW.category_id IS NOT NULL)
  EXECUTE FUNCTION check_budget_threshold();
```

---

## 5. API Design

### 5.1 TypeScript Types

```typescript
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // ISO date (first of month)
  limitAmount: number;
  rolloverAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  categoryId: string;
  month: string;
  limitAmount: number;
  rolloverAmount?: number;
  notes?: string;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  percentage: number; // 0-100+
  status: 'ok' | 'warning' | 'over';
}

export interface BudgetAlert {
  id: string;
  userId: string;
  budgetId: string;
  alertType: 'warning_80' | 'critical_100' | 'overspent';
  alertPercentage: number;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface BudgetSummary {
  month: string;
  totalBudget: number;
  totalSpent: number;
  categoriesCount: number;
  overBudgetCount: number;
  warningCount: number;
  okCount: number;
}
```

### 5.2 API Methods

```typescript
interface FinanceAPI {
  // Budget CRUD
  listBudgets(month: string): Promise<Budget[]>;
  getBudget(categoryId: string, month: string): Promise<Budget | null>;
  upsertBudget(budget: BudgetInput): Promise<void>;
  deleteBudget(categoryId: string, month: string): Promise<void>;

  // Budget Status
  getBudgetStatus(month: string): Promise<BudgetStatus[]>;
  getBudgetSummary(month: string): Promise<BudgetSummary>;

  // Alerts
  getBudgetAlerts(acknowledged?: boolean): Promise<BudgetAlert[]>;
  acknowledgeBudgetAlert(alertId: string): Promise<void>;

  // Utilities
  copyBudgetToNextMonth(month: string): Promise<void>;
  getSpendingTrend(categoryId: string, months: number): Promise<Array<{month: string; spent: number}>>;
}
```

---

## 6. UI/UX Design

### 6.1 Page Layout

```
┌─────────────────────────────────────────┐
│ Budgets                                 │
│ Track your monthly spending             │
├─────────────────────────────────────────┤
│                                         │
│ [Month Selector: January 2025  ◀ ▶]    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Budget Summary                      │ │
│ │ Total Budget: $3,500                │ │
│ │ Total Spent:  $2,847 (81%)         │ │
│ │ Remaining:    $653                  │ │
│ │                                     │ │
│ │ ████████████████░░░░  81%          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Create Budget] [Copy Last Month]    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🍔 Food & Dining                    │ │
│ │ Budget: $500 │ Spent: $423         │ │
│ │ Remaining: $77                      │ │
│ │ ███████████████████░  85%  [⚠️]    │ │
│ │                                     │ │
│ │ Last 3 months: $445 → $467 → $423  │ │
│ │ [Edit] [View Transactions]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏠 Housing                          │ │
│ │ Budget: $1,600 │ Spent: $1,600     │ │
│ │ Remaining: $0                       │ │
│ │ ████████████████████  100%  [✓]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🛒 Groceries                        │ │
│ │ Budget: $400 │ Spent: $487         │ │
│ │ Over budget: $87                    │ │
│ │ ████████████████████  122%  [🔴]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 Create/Edit Budget Modal

```
┌─────────────────────────────────┐
│ Set Budget - Food & Dining      │
├─────────────────────────────────┤
│                                 │
│ Category: Food & Dining         │
│                                 │
│ Month: [January 2025 ▼]        │
│                                 │
│ Budget Amount: [$___500____]    │
│                                 │
│ Historical Average: $445        │
│ Last Month: $467                │
│ Recommended: $450-500           │
│                                 │
│ Notes (optional):               │
│ [__________________________]    │
│                                 │
│                                 │
│ [Cancel]  [Save Budget]         │
│                                 │
└─────────────────────────────────┘
```

### 6.3 Color Coding System

```typescript
const getBudgetColor = (percentage: number): string => {
  if (percentage >= 100) return 'rose'; // Red - over budget
  if (percentage >= 80) return 'amber'; // Yellow - warning
  return 'emerald'; // Green - safe
};

const getBudgetIcon = (percentage: number): string => {
  if (percentage >= 100) return '🔴';
  if (percentage >= 80) return '⚠️';
  return '✓';
};
```

### 6.4 Alert Design

```
┌─────────────────────────────────────────┐
│ ⚠️ Budget Alert                         │
│                                         │
│ You've spent 85% of your Food & Dining │
│ budget for January 2025                │
│                                         │
│ Spent: $425 of $500                    │
│ Remaining: $75                          │
│                                         │
│ [View Budget] [Dismiss]                 │
└─────────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Database & Core API (Week 1, Days 1-2)
- ✅ Create database migration
- ✅ Implement budget CRUD in SupabaseApi
- ✅ Add budget status calculation functions
- ✅ Write comprehensive tests
- ✅ Test with sample data

### Phase 2: Basic UI (Week 1, Days 3-4)
- ✅ Create BudgetsPage component
- ✅ Build BudgetCard component
- ✅ Add month selector
- ✅ Implement budget summary
- ✅ Create budget creation modal

### Phase 3: Progress Tracking (Week 1, Day 5)
- ✅ Add real-time spent calculation
- ✅ Implement progress bars with colors
- ✅ Show remaining amounts
- ✅ Add status indicators

### Phase 4: Alerts & Polish (Week 2, Days 1-2)
- ✅ Implement alert triggers
- ✅ Add alert notifications
- ✅ Build alert management UI
- ✅ Add historical trend charts

### Phase 5: Advanced Features (Week 2, Days 3-5)
- ✅ Budget templates
- ✅ Copy to next month
- ✅ Rollover logic
- ✅ Budget recommendations

---

## 8. Error Handling Strategy

### 8.1 Database Errors
```typescript
try {
  await api.upsertBudget(budget);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new Error('Budget already exists for this category and month');
  }
  if (error.code === '23503') { // Foreign key violation
    throw new Error('Category not found');
  }
  throw new Error('Failed to save budget. Please try again.');
}
```

### 8.2 Validation Errors
```typescript
function validateBudget(budget: BudgetInput): void {
  if (budget.limitAmount < 0) {
    throw new Error('Budget amount must be positive');
  }
  if (!isValidMonth(budget.month)) {
    throw new Error('Invalid month format. Use YYYY-MM-01');
  }
  // Add more validations...
}
```

### 8.3 User-Friendly Messages
```typescript
const ERROR_MESSAGES = {
  NETWORK: 'Unable to connect. Please check your internet.',
  UNAUTHORIZED: 'Please log in to manage budgets.',
  NOT_FOUND: 'Budget not found.',
  VALIDATION: 'Please check your inputs and try again.',
  UNKNOWN: 'Something went wrong. Please try again.'
};
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Budget calculation functions
- Date utilities
- Validation logic
- Color coding helpers

### 9.2 Integration Tests
- Budget CRUD operations
- Transaction → Budget updates
- Alert generation
- Month transitions

### 9.3 E2E Tests
- Create budget flow
- Edit budget flow
- Budget alerts
- Month navigation

### 9.4 Performance Tests
- Load 12 months of budgets
- Calculate status for 20+ categories
- Real-time updates with high transaction volume

---

## 10. Performance Optimizations

### 10.1 Database
- ✅ Indexed lookups on (user_id, month)
- ✅ Indexed lookups on (category_id)
- ✅ Materialized spent calculations
- ✅ Efficient query plans

### 10.2 Frontend
- ✅ Cache budget status for current month
- ✅ Debounce budget updates (500ms)
- ✅ Lazy load historical data
- ✅ Optimistic UI updates

### 10.3 Real-Time Updates
- ✅ Subscribe to transaction changes
- ✅ Invalidate budget cache on new transaction
- ✅ WebSocket for live updates (optional)

---

## 11. Security Considerations

### 11.1 Access Control
- ✅ Row-level security on all tables
- ✅ User can only see their own budgets
- ✅ Validate user_id matches auth.uid()

### 11.2 Input Validation
- ✅ Sanitize all inputs
- ✅ Validate amounts (positive, reasonable limits)
- ✅ Validate dates (must be first of month)

### 11.3 Rate Limiting
- ✅ Limit budget updates to 10/minute
- ✅ Prevent spam budget creation

---

## 12. Documentation Requirements

### 12.1 User Documentation
- How to create budgets
- Understanding budget status
- Managing alerts
- Budget best practices

### 12.2 Developer Documentation
- API reference
- Database schema
- Component props
- Testing guide

---

## 13. Success Criteria

### Must Have (MVP)
- ✅ Create/edit/delete budgets
- ✅ Real-time spent tracking
- ✅ Visual progress bars
- ✅ Color-coded status
- ✅ Month navigation
- ✅ Budget summary

### Should Have
- ✅ Budget alerts (80%, 100%)
- ✅ Historical trends
- ✅ Copy to next month
- ✅ Budget recommendations

### Nice to Have
- ⏳ Budget templates
- ⏳ Rollover logic
- ⏳ Goal tracking
- ⏳ Spending insights

---

## 14. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance with many categories | High | Medium | Implement pagination, caching |
| Complex month transitions | Medium | High | Extensive testing, clear date handling |
| User confusion about zero-based budgeting | High | Medium | Onboarding tutorial, tooltips |
| Alert fatigue | Medium | Medium | Smart alert thresholds, consolidation |

---

## 15. Next Steps

1. **Review this spec** with stakeholders ✅
2. **Create database migration** (20250118_budget_management.sql)
3. **Implement API layer** (SupabaseApi updates)
4. **Build UI components** (BudgetsPage, BudgetCard, etc.)
5. **Add comprehensive testing**
6. **Create user documentation**
7. **Deploy and monitor**

---

## Appendix

### A. Database Migration Checklist
- [ ] Create budgets table
- [ ] Create budget_alerts table
- [ ] Add indexes
- [ ] Create functions (calculate_budget_spent, get_budget_status)
- [ ] Create triggers (auto-alerts)
- [ ] Enable RLS
- [ ] Create policies
- [ ] Test with sample data

### B. Code Review Checklist
- [ ] TypeScript strict mode passing
- [ ] All functions have JSDoc comments
- [ ] Error handling on all async operations
- [ ] Loading states in UI
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Mobile responsive
- [ ] No console.logs in production

### C. References
- [YNAB Methodology](https://www.ynab.com/guide/)
- [Zero-Based Budgeting](https://www.nerdwallet.com/article/finance/zero-based-budgeting-explained)
- [Budget UI Patterns](https://blog.tubikstudio.com/case-study-home-budget-app-ui-for-finance/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-17
**Status**: Ready for Implementation ✅
