# Complete Finance Module - Merged Mode Mockups

## Overview
This document shows **all 13 pages** of the Finance module in merged mode, demonstrating how both partners will see combined household financial data.

**Key Principle:** No owner filter - always show both partners' data with owner badges for identification.

## Complete Page List

Based on `src/pages/Finances.tsx`, the Finance module has **13 active pages**:

1. ✅ **Dashboard** - Main overview with metrics
2. ✅ **Accounts** - Bank accounts, credit cards, investments
3. ✅ **Transactions** - All transactions
4. ✅ **Recurring** - Recurring transactions & pending review
5. ✅ **Budgets** - Budget tracking
6. ✅ **Net Worth** - Net worth over time
7. ✅ **Goals** - Financial goals
8. ✅ **Loans** - Loan tracking & payments
9. ✅ **Retirement** - Retirement planning
10. ✅ **Projections** - Financial projections
11. ✅ **Calculators** - Financial calculators (compound interest, debt payoff, etc.)
12. ✅ **Credit Cards** - Credit card management
13. ✅ **Insurance** - Insurance policy tracking
14. ✅ **Settings** - Finance settings

**Note:** The current `src/finance/routes.tsx` only has 9 pages, but the full implementation in `src/pages/Finances.tsx` has all 13 pages.

---

## Page 1: Dashboard (`/finance`)

**Purpose:** Main overview with metrics, recent transactions, and account summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│  💰 Finance Dashboard                                  January 2026 ▼      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 Household Summary (Combined)                                            │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  💵 Income       │  💸 Expenses     │  💰 Cash Flow    │                │
│  │  $8,500.00       │  $6,200.00       │  +$2,300.00      │                │
│  │  ↑ 12% vs last   │  ↓ 5% vs last    │  ↑ 25% vs last   │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  📈 Net Worth: $125,450.00  (↑ $2,300 this month)                          │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Recent Transactions                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Jan 28  My Salary Deposit      +$5,000.00   Income      [Me]       │  │
│  │ Jan 27  Whole Foods            -$87.32      Groceries   [Sarah]    │  │
│  │ Jan 27  Starbucks Coffee       -$5.50       Dining      [Me]       │  │
│  │ Jan 26  Sarah's Salary         +$3,500.00   Income      [Sarah]    │  │
│  │ Jan 25  Amazon Purchase        -$124.99     Shopping    [Me]       │  │
│  │ Jan 25  Target                 -$45.67      Shopping    [Sarah]    │  │
│  │ Jan 24  Gas Station            -$52.00      Transport   [Me]       │  │
│  │ Jan 23  Gym Membership         -$29.99      Health      [Sarah]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Accounts Overview                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏦 My Chase Checking           $3,250.45                  [Me]      │  │
│  │ 🏦 Sarah's BofA Checking       $2,100.00                  [Sarah]   │  │
│  │ 💳 My Chase Freedom Credit     -$450.32 / $5,000          [Me]      │  │
│  │ 💳 Sarah's Amex Gold           -$1,234.56 / $10,000       [Sarah]   │  │
│  │ 📈 My Robinhood Brokerage      $12,050.00                 [Me]      │  │
│  │ 📈 Sarah's Vanguard IRA        $45,000.00                 [Sarah]   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Budget Progress (Top 5 Categories)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Groceries        $287 / $500    [████████░░] 57%  (Both)           │  │
│  │ Dining           $156 / $300    [█████░░░░░] 52%  (Both)           │  │
│  │ Transport        $89 / $200     [████░░░░░░] 45%  (Both)           │  │
│  │ Shopping         $234 / $400    [█████░░░░░] 59%  (Both)           │  │
│  │ Entertainment    $67 / $150     [████░░░░░░] 45%  (Both)           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  💸 Money Flow Visualization                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Visual representation of income sources → categories → expenses      │  │
│  │                                                                        │  │
│  │  Income Sources         Total Income         Expense Categories      │  │
│  │  (Left)                 (Middle)             (Right)                  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐                                                      │  │
│  │  │ My Salary   │────┐                                                 │  │
│  │  │ $5,000      │    │                                                 │  │
│  │  │ [Me] 🔵    │    │         ┌──────────┐                            │  │
│  │  └─────────────┘    ├────────▶│  Total   │──┬──▶ Housing $2,000      │  │
│  │                     │         │  Income  │  │    (Amber) 🟠          │  │
│  │  ┌─────────────┐    │         │ $8,500   │  │                        │  │
│  │  │ Sarah's     │────┘         │ (Blue)🔵 │  ├──▶ Groceries $287      │  │
│  │  │ Freelance   │              └──────────┘  │    (Pink) 🩷           │  │
│  │  │ $3,500      │                            │                        │  │
│  │  │ [Sarah] 🟣 │                            ├──▶ Transport $89       │  │
│  │  └─────────────┘                            │    (Purple) 🟣         │  │
│  │                                             │                        │  │
│  │                                             ├──▶ Dining $156         │  │
│  │                                             │    (Pink) 🩷           │  │
│  │                                             │                        │  │
│  │                                             ├──▶ Shopping $234       │  │
│  │                                             │    (Orange) 🟠         │  │
│  │                                             │                        │  │
│  │                                             └──▶ Savings $2,300      │  │
│  │                                                  (Green) 🟢          │  │
│  │                                                                        │  │
│  │  💡 Flow thickness = amount • Colors identify owner/category          │  │
│  │  🔵 Blue = Me • 🟣 Purple = Sarah • 🟢 Green = Savings                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined metrics (household totals)
- ✅ Owner badges on all transactions `[Me]` / `[Sarah]`
- ✅ Owner badges on all accounts
- ✅ Household budgets show combined spending
- ✅ No filter buttons - always shows both

---

## Page 2: Accounts (`/finance/accounts`)

**Purpose:** Manage all bank accounts, credit cards, and investment accounts

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🏦 Accounts                                          [+ Add Account]      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Chase Bank                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Chase Checking                                                       │  │
│  │ checking                                          [Me]               │  │
│  │ $3,250.45                                                            │  │
│  │ Updated Jan 28, 2026                                                 │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Chase Freedom Credit Card                                            │  │
│  │ credit                                            [Me]               │  │
│  │ -$450.32 / $5,000 limit (9% utilization)                             │  │
│  │ Updated Jan 27, 2026                                                 │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Bank of America                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ BofA Checking                                                        │  │
│  │ checking                                          [Sarah]            │  │
│  │ $2,100.00                                                            │  │
│  │ Updated Jan 28, 2026                                                 │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  American Express                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Amex Gold Card                                                       │  │
│  │ credit                                            [Sarah]            │  │
│  │ -$1,234.56 / $10,000 limit (12% utilization)                         │  │
│  │ Updated Jan 27, 2026                                                 │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Robinhood                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Brokerage Account                                                    │  │
│  │ brokerage                                         [Me]               │  │
│  │ $12,050.00                                                           │  │
│  │ Updated Jan 28, 2026                                                 │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Vanguard                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Traditional IRA                                                      │  │
│  │ traditional_ira                                   [Sarah]            │  │
│  │ $45,000.00                                                           │  │
│  │ Updated Jan 25, 2026                                                 │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ All accounts from both partners visible
- ✅ Owner badges on each account card
- ✅ Grouped by institution
- ✅ Edit/Delete buttons only on your own accounts
- ✅ "View Only" indicator on partner's accounts
- ✅ No filter - always shows all accounts

---

## Page 3: Transactions (`/finance/transactions`)

**Purpose:** View and manage all transactions with filtering and search

```
┌────────────────────────────────────────────────────────────────────────────┐
│  💸 Transactions                                                           │
│                                                                             │
│  Filters: [All Categories ▼] [All Accounts ▼] [Jan 2026 ▼]                │
│  Search: [________________]                              [+ Add]          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  January 28, 2026                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ My Salary Deposit                                                    │  │
│  │ Chase Checking • Income                           [Me]               │  │
│  │                                                    +$5,000.00         │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  January 27, 2026                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Whole Foods                                                          │  │
│  │ BofA Checking • Groceries                         [Sarah]            │  │
│  │                                                    -$87.32            │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Starbucks Coffee                                                     │  │
│  │ Chase Freedom Credit • Dining                     [Me]               │  │
│  │                                                    -$5.50             │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  January 26, 2026                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Sarah's Salary                                                       │  │
│  │ BofA Checking • Income                            [Sarah]            │  │
│  │                                                    +$3,500.00         │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  January 25, 2026                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Amazon Purchase                                                      │  │
│  │ Chase Freedom Credit • Shopping                   [Me]               │  │
│  │                                                    -$124.99           │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Target                                                               │  │
│  │ Amex Gold • Shopping                              [Sarah]            │  │
│  │                                                    -$45.67            │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ All transactions from both partners
- ✅ Grouped by date
- ✅ Owner badges on each transaction
- ✅ Edit/Delete only on your own transactions
- ✅ "View Only" on partner's transactions
- ✅ Filter by category, account, date (but not by owner)
- ✅ Search works across all transactions

---

## Page 4: Budgets (`/finance/budgets`)

**Purpose:** Track spending against budgets (personal and household)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📊 Budgets                                            January 2026 ▼      │
│                                                         [+ Add Budget]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Household Budgets (Combined Spending)                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Groceries                                         [Household]         │  │
│  │ $287.32 / $500.00                                                    │  │
│  │ ████████████░░░░░░░░ 57%                                             │  │
│  │ $212.68 remaining • 3 days left                                      │  │
│  │                                                                       │  │
│  │ Recent: Whole Foods -$87.32 [Sarah], Trader Joe's -$45.00 [Me]       │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Dining Out                                        [Household]         │  │
│  │ $156.50 / $300.00                                                    │  │
│  │ ██████████░░░░░░░░░░ 52%                                             │  │
│  │ $143.50 remaining • 3 days left                                      │  │
│  │                                                                       │  │
│  │ Recent: Starbucks -$5.50 [Me], Chipotle -$23.00 [Sarah]              │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Personal Budgets (My Spending Only)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ My Shopping                                       [Me]                │  │
│  │ $124.99 / $200.00                                                    │  │
│  │ ████████████░░░░░░░░ 62%                                             │  │
│  │ $75.01 remaining • 3 days left                                       │  │
│  │                                                                       │  │
│  │ Recent: Amazon -$124.99 [Me]                                         │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Partner's Personal Budgets (Sarah's Spending Only)                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Sarah's Health & Fitness                          [Sarah]            │  │
│  │ $29.99 / $100.00                                                     │  │
│  │ █████░░░░░░░░░░░░░░░ 30%                                             │  │
│  │ $70.01 remaining • 3 days left                                       │  │
│  │                                                                       │  │
│  │ Recent: Gym Membership -$29.99 [Sarah]                               │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Household budgets** - Track combined spending from both partners
- ✅ **Personal budgets** - Track only your own spending
- ✅ Owner badges: `[Household]`, `[Me]`, `[Sarah]`
- ✅ Recent transactions show owner badges
- ✅ Can edit/delete your own budgets
- ✅ View-only on partner's personal budgets
- ✅ Progress bars show spending vs budget

---

## Page 5: Net Worth (`/finance/net-worth`)

**Purpose:** Track household net worth over time with account breakdown

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📈 Net Worth                                                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Summary Cards                                                             │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  💰 Net Worth    │  📈 Assets       │  📉 Liabilities  │                │
│  │  $125,450.00     │  $127,134.56     │  $1,684.56       │                │
│  │  ↑ $2,300 (1.9%) │  ↑ $2,450 (2.0%) │  ↑ $150 (9.8%)   │                │
│  │  vs last month   │  vs last month   │  vs last month   │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  Net Worth Over Time (12 months)                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ $130k ┤                                                        ╭─     │  │
│  │       │                                                   ╭────╯      │  │
│  │ $120k ┤                                            ╭──────╯           │  │
│  │       │                                      ╭─────╯                  │  │
│  │ $110k ┤                               ╭──────╯                        │  │
│  │       │                        ╭──────╯                               │  │
│  │ $100k ┤                 ╭──────╯                                      │  │
│  │       │          ╭──────╯                                             │  │
│  │  $90k ┤   ╭──────╯                                                    │  │
│  │       └───┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────   │  │
│  │         Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Account Breakdown                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Assets                                                               │  │
│  │ ├─ Checking Accounts                              $5,350.45         │  │
│  │ │  ├─ My Chase Checking                $3,250.45  [Me]              │  │
│  │ │  └─ Sarah's BofA Checking            $2,100.00  [Sarah]           │  │
│  │ ├─ Investment Accounts                            $57,050.00        │  │
│  │ │  ├─ My Robinhood Brokerage           $12,050.00 [Me]              │  │
│  │ │  └─ Sarah's Vanguard IRA             $45,000.00 [Sarah]           │  │
│  │ └─ Total Assets                                   $127,134.56       │  │
│  │                                                                       │  │
│  │ Liabilities                                                          │  │
│  │ ├─ Credit Cards                                   $1,684.88         │  │
│  │ │  ├─ My Chase Freedom                 $450.32    [Me]              │  │
│  │ │  └─ Sarah's Amex Gold                $1,234.56  [Sarah]           │  │
│  │ └─ Total Liabilities                              $1,684.88         │  │
│  │                                                                       │  │
│  │ Net Worth = Assets - Liabilities                  $125,450.00       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined household net worth
- ✅ Chart shows combined growth over time
- ✅ Account breakdown with owner badges
- ✅ Grouped by account type (checking, investment, credit, etc.)
- ✅ All accounts from both partners visible
- ✅ Clear hierarchy showing totals

---

## Page 6: Goals (`/finance/goals`)

**Purpose:** Track financial goals (savings, debt payoff, etc.)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🎯 Financial Goals                                    [+ Add Goal]        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Active Goals                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Emergency Fund                                    [Me]                │  │
│  │ Save $10,000 for emergencies                                         │  │
│  │                                                                       │  │
│  │ $6,500 / $10,000                                                     │  │
│  │ ████████████████░░░░ 65%                                             │  │
│  │                                                                       │  │
│  │ Due: Dec 31, 2026 • 335 days left                                    │  │
│  │ On track: Need $350/month                                            │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Vacation Fund                                     [Sarah]            │  │
│  │ Save for Europe trip                                                 │  │
│  │                                                                       │  │
│  │ $2,800 / $5,000                                                      │  │
│  │ ███████████░░░░░░░░░ 56%                                             │  │
│  │                                                                       │  │
│  │ Due: Jun 30, 2026 • 151 days left                                    │  │
│  │ On track: Need $367/month                                            │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ House Down Payment                                [Household]        │  │
│  │ Save $50,000 for house down payment                                  │  │
│  │                                                                       │  │
│  │ $18,500 / $50,000                                                    │  │
│  │ ███████░░░░░░░░░░░░░ 37%                                             │  │
│  │                                                                       │  │
│  │ Due: Dec 31, 2027 • 700 days left                                    │  │
│  │ On track: Need $1,340/month (combined)                               │  │
│  │ Contributors: Me ($10,000), Sarah ($8,500)                           │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Completed Goals                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Pay Off Credit Card                             [Me]               │  │
│  │ Completed Jan 15, 2026                                               │  │
│  │ $3,000 / $3,000 (100%)                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Personal goals: `[Me]`, `[Sarah]`
- ✅ Household goals: `[Household]` - both partners contribute
- ✅ Progress bars and tracking
- ✅ Edit/delete your own goals
- ✅ View-only on partner's personal goals
- ✅ Both can edit household goals
- ✅ Shows contributors for household goals

---

## Page 7: Retirement (`/finance/retirement`)

**Purpose:** Manage retirement accounts and track retirement readiness

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🏖️ Retirement Planning                               [+ Add Account]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Retirement Summary (Combined)                                             │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  Total Saved     │  Annual Contrib  │  Projected @65   │                │
│  │  $57,050.00      │  $19,500.00      │  $1,245,000      │                │
│  │  (Both)          │  (Both)          │  (Both)          │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  Retirement Accounts                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ My Robinhood Brokerage                            [Me]               │  │
│  │ brokerage                                                            │  │
│  │                                                                       │  │
│  │ Balance: $12,050.00                                                  │  │
│  │ Annual Contribution: $6,000                                          │  │
│  │ Employer Match: N/A                                                  │  │
│  │ YTD Return: +8.5%                                                    │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Sarah's Vanguard Traditional IRA                  [Sarah]            │  │
│  │ traditional_ira                                                      │  │
│  │                                                                       │  │
│  │ Balance: $45,000.00                                                  │  │
│  │ Annual Contribution: $6,500                                          │  │
│  │ Employer Match: N/A                                                  │  │
│  │ YTD Return: +12.3%                                                   │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Retirement Readiness                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Based on combined household data:                                    │  │
│  │                                                                       │  │
│  │ Current Age: 35 (average)                                            │  │
│  │ Retirement Age: 65                                                   │  │
│  │ Years to Retirement: 30                                              │  │
│  │                                                                       │  │
│  │ Projected Retirement Income: $62,250/year                            │  │
│  │ Target Retirement Income: $80,000/year                               │  │
│  │                                                                       │  │
│  │ Status: ⚠️ Below target - Consider increasing contributions          │  │
│  │ Recommendation: Increase annual contributions by $5,000              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined retirement summary
- ✅ All retirement accounts from both partners
- ✅ Owner badges on each account
- ✅ Edit/delete your own accounts
- ✅ View-only on partner's accounts
- ✅ Household retirement readiness calculation
- ✅ Combined projections

---

## Page 8: Credit Cards (`/finance/credit-cards`)

**Purpose:** Manage credit cards, track utilization, and monitor rewards

```
┌────────────────────────────────────────────────────────────────────────────┐
│  💳 Credit Cards                                                           │
│                                                                             │
│  Tabs: [My Cards ✓] [Welcome Bonuses] [Utilization]                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Summary (Combined)                                                        │
│  ┌──────────────────┬──────────────────┬──────────────────┬──────────────┐ │
│  │  Total Balance   │  Credit Limit    │  Utilization     │  Rewards     │ │
│  │  $1,684.88       │  $15,000.00      │  11.2%           │  12,450 pts  │ │
│  │  (Both)          │  (Both)          │  (Both)          │  (Both)      │ │
│  └──────────────────┴──────────────────┴──────────────────┴──────────────┘ │
│                                                                             │
│  My Credit Cards                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Chase Freedom                                     [Me]               │  │
│  │                                                                       │  │
│  │ Balance: $450.32                                                     │  │
│  │ Credit Limit: $5,000                                                 │  │
│  │ Utilization: 9.0% ✅ Good                                            │  │
│  │ Rewards: 4,503 points ($45.03 cash back)                             │  │
│  │ Payment Due: Feb 15, 2026 ($450.32 minimum)                          │  │
│  │                                                      [Edit] [Delete]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Partner's Credit Cards                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Amex Gold Card                                    [Sarah]            │  │
│  │                                                                       │  │
│  │ Balance: $1,234.56                                                   │  │
│  │ Credit Limit: $10,000                                                │  │
│  │ Utilization: 12.3% ✅ Good                                           │  │
│  │ Rewards: 7,947 points (79,470 Amex points)                           │  │
│  │ Payment Due: Feb 20, 2026 ($1,234.56 minimum)                        │  │
│  │                                                      [View Only]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Household Utilization Trend                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  20% ┤                                                                │  │
│  │      │                                                                │  │
│  │  15% ┤                                          ╭─                    │  │
│  │      │                                    ╭─────╯                     │  │
│  │  10% ┤                              ╭─────╯                           │  │
│  │      │                        ╭─────╯                                 │  │
│  │   5% ┤                  ╭─────╯                                       │  │
│  │      └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────        │  │
│  │        Aug   Sep   Oct   Nov   Dec   Jan                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined summary metrics
- ✅ All credit cards from both partners
- ✅ Owner badges on each card
- ✅ Edit/delete your own cards
- ✅ View-only on partner's cards
- ✅ Household utilization tracking
- ✅ Combined rewards tracking

---

## Page 4: Recurring Transactions (`/finance/recurring`)

**Purpose:** Manage recurring transactions and review pending transactions

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🔄 Recurring Transactions                            [+ Add Recurring]    │
├────────────────────────────────────────────────────────────────────────────┤
│  Pending Review (Auto-generated from recurring templates)                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Feb 1   Netflix Subscription    -$15.99   Entertainment  [Me]       │  │
│  │         [✓ Approve] [✗ Skip] [✏️ Edit]                               │  │
│  │                                                                       │  │
│  │ Feb 1   Spotify Premium         -$9.99    Entertainment  [Sarah]    │  │
│  │         [✓ Approve] [✗ Skip] [✏️ Edit]                               │  │
│  │                                                                       │  │
│  │ Feb 1   Rent Payment            -$2,000   Housing       [Me]        │  │
│  │         [✓ Approve] [✗ Skip] [✏️ Edit]                               │  │
│  │                                                                       │  │
│  │ Feb 5   Gym Membership          -$29.99   Health        [Sarah]     │  │
│  │         [✓ Approve] [✗ Skip] [✏️ Edit]                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Recurring Templates                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 Monthly (1st of month)                                            │  │
│  │    Netflix          -$15.99   Entertainment  [Me]      [✏️] [🗑️]    │  │
│  │    Rent             -$2,000   Housing        [Me]      [✏️] [🗑️]    │  │
│  │    Spotify          -$9.99    Entertainment  [Sarah]   [✏️] [🗑️]    │  │
│  │                                                                       │  │
│  │ 📅 Monthly (5th of month)                                            │  │
│  │    Gym Membership   -$29.99   Health        [Sarah]   [✏️] [🗑️]     │  │
│  │    Car Insurance    -$125.00  Transport     [Me]      [✏️] [🗑️]     │  │
│  │                                                                       │  │
│  │ 📅 Bi-weekly (Every other Friday)                                    │  │
│  │    My Salary        +$2,500   Income        [Me]      [✏️] [🗑️]     │  │
│  │    Sarah's Salary   +$1,750   Income        [Sarah]   [✏️] [🗑️]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Pending transactions auto-generated from templates
- ✅ Owner badges on all recurring items `[Me]` / `[Sarah]`
- ✅ Can only edit/delete your own recurring templates
- ✅ Can view partner's recurring templates (read-only)
- ✅ Approve/skip/edit pending transactions before they're added

---

## Page 8: Loans (`/finance/loans`)

**Purpose:** Track all loans with payment history and payoff projections

```
┌────────────────────────────────────────────────────────────────────────────┐
│  💳 Loans                                                  [+ Add Loan]    │
├────────────────────────────────────────────────────────────────────────────┤
│  Summary                                                                   │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  Total Balance   │  Monthly Payment │  Interest Paid   │                │
│  │  $45,230.00      │  $1,245.00       │  $12,450.00      │                │
│  │  (Both partners) │  (Combined)      │  (All time)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Active Loans                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🚗 My Car Loan                                          [Me]         │  │
│  │    Balance: $18,500 / $25,000                                        │  │
│  │    [████████████░░░░░░░░] 74% paid                                   │  │
│  │    APR: 4.5% • Monthly: $425 • Target: Dec 2027                      │  │
│  │    Interest Paid: $3,200 • Principal Paid: $6,500                    │  │
│  │    Status: 🟢 On track                                               │  │
│  │    [Record Payment] [View History] [✏️ Edit]                         │  │
│  │                                                                       │  │
│  │ 🏠 Sarah's Student Loan                                 [Sarah] 👁️  │  │
│  │    Balance: $26,730 / $35,000                                        │  │
│  │    [███████████████░░░░░] 76% paid                                   │  │
│  │    APR: 5.2% • Monthly: $820 • Target: Jun 2029                      │  │
│  │    Interest Paid: $9,250 • Principal Paid: $8,270                    │  │
│  │    Status: 🟢 On track                                               │  │
│  │    [View Only - Cannot edit partner's loan]                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Paid Off Loans                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ My Credit Card Debt                                  [Me]         │  │
│  │    Original: $5,000 • Paid off: Jan 2025                             │  │
│  │    Total Interest Paid: $450                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined summary metrics (all loans from both partners)
- ✅ Owner badges on all loans `[Me]` / `[Sarah]`
- ✅ Can only edit/record payments for your own loans
- ✅ Can view partner's loans (read-only)
- ✅ Payment history and projections
- ✅ Interest tracking and payoff status

---

## Page 10: Projections (`/finance/projections`)

**Purpose:** Financial projections and forecasting

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📈 Financial Projections                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│  Household Projection Settings                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Projection Period: [12 months ▼]                                     │  │
│  │ Include Recurring: [✓] Include Loans: [✓] Include Goals: [✓]        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Projected Cash Flow (Next 12 Months)                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  $10K ┤                                                               │  │
│  │       │     ╱╲    ╱╲    ╱╲    ╱╲    ╱╲    ╱╲                        │  │
│  │   $5K ┤    ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲                       │  │
│  │       │   ╱    ╲╱    ╲╱    ╲╱    ╲╱    ╲╱    ╲                      │  │
│  │    $0 ┼──────────────────────────────────────────                    │  │
│  │       │  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan │  │
│  │       │                                                               │  │
│  │  💚 Income (Combined)  💸 Expenses (Combined)  💰 Net Savings        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Projected Milestones                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Mar 2026  Emergency Fund Goal Reached        $10,000  [Household]   │  │
│  │ Jun 2026  Car Loan 50% Paid Off              $12,500  [Me]          │  │
│  │ Sep 2026  Vacation Fund Goal Reached         $5,000   [Household]   │  │
│  │ Dec 2026  Student Loan 80% Paid Off          $28,000  [Sarah]       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined household projections
- ✅ Includes both partners' income, expenses, loans, goals
- ✅ Milestone tracking with owner badges
- ✅ Forecasting based on historical data and recurring transactions

---

## Page 11: Calculators (`/finance/calculators`)

**Purpose:** Interactive financial calculators

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🧮 Financial Calculators                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│  Calculator Selection                                                      │
│  ┌────────────┬────────────┬────────────┬────────────┐                     │
│  │ Compound   │ Debt       │ Retirement │ Goal       │                     │
│  │ Interest   │ Payoff     │ Planning   │ Savings    │                     │
│  │ [Active]   │            │            │            │                     │
│  ├────────────┼────────────┼────────────┼────────────┤                     │
│  │ Rule of 72 │ Tax        │ 50/30/20   │ Real       │                     │
│  │            │ Estimator  │ Budget     │ Return     │                     │
│  └────────────┴────────────┴────────────┴────────────┘                     │
│                                                                             │
│  Compound Interest Calculator                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Initial Investment:     [$10,000        ]                            │  │
│  │ Monthly Contribution:   [$500           ]                            │  │
│  │ Annual Return Rate:     [7%             ]                            │  │
│  │ Time Period (years):    [30             ]                            │  │
│  │                                                                       │  │
│  │ ─────────────────────────────────────────────────────────────────    │  │
│  │                                                                       │  │
│  │ 📊 Results:                                                           │  │
│  │    Final Balance:        $612,438.00                                 │  │
│  │    Total Contributions:  $190,000.00                                 │  │
│  │    Total Interest:       $422,438.00                                 │  │
│  │                                                                       │  │
│  │ 📈 Growth Chart:                                                      │  │
│  │    [Visual chart showing growth over 30 years]                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ 8 different calculators available
- ✅ No owner badges needed (calculators are tools, not data)
- ✅ Both partners can use all calculators
- ✅ Results can inform household financial planning

---

## Page 13: Insurance (`/finance/insurance`)

**Purpose:** Track all insurance policies with coverage and renewals

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🛡️ Insurance Policies                                [+ Add Policy]      │
├────────────────────────────────────────────────────────────────────────────┤
│  Summary                                                                   │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  Active Policies │  Annual Premium  │  Total Coverage  │                │
│  │  6               │  $8,450/year     │  $2,500,000      │                │
│  │  (Both partners) │  (Combined)      │  (Combined)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Active Policies                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🚗 My Auto Insurance - State Farm                      [Me]          │  │
│  │    Coverage: $500,000 • Premium: $125/month                          │  │
│  │    Renewal: Mar 15, 2026 (45 days) • Status: 🟢 Active               │  │
│  │    Policy #: AUTO-123456                                             │  │
│  │    [✏️ Edit] [📄 View Details]                                        │  │
│  │                                                                       │  │
│  │ 🏠 Home Insurance - Allstate                           [Household]   │  │
│  │    Coverage: $750,000 • Premium: $150/month                          │  │
│  │    Renewal: Jun 1, 2026 (122 days) • Status: 🟢 Active               │  │
│  │    Policy #: HOME-789012                                             │  │
│  │    [✏️ Edit] [📄 View Details]                                        │  │
│  │                                                                       │  │
│  │ ❤️ Sarah's Health Insurance - Blue Cross              [Sarah] 👁️    │  │
│  │    Coverage: $1,000,000 • Premium: $350/month                        │  │
│  │    Renewal: Jan 1, 2027 (336 days) • Status: 🟢 Active               │  │
│  │    Policy #: HEALTH-345678                                           │  │
│  │    [View Only - Cannot edit partner's policy]                        │  │
│  │                                                                       │  │
│  │ 🛡️ My Life Insurance - Northwestern Mutual            [Me]          │  │
│  │    Coverage: $250,000 • Premium: $45/month                           │  │
│  │    Renewal: Dec 15, 2026 (319 days) • Status: 🟢 Active              │  │
│  │    Policy #: LIFE-901234                                             │  │
│  │    [✏️ Edit] [📄 View Details]                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  Upcoming Renewals (Next 90 Days)                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ My Auto Insurance - Renews in 45 days (Mar 15)     [Me]          │  │
│  │ ⚠️ Home Insurance - Renews in 122 days (Jun 1)        [Household]   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined summary metrics (all policies from both partners)
- ✅ Owner badges on all policies `[Me]` / `[Sarah]` / `[Household]`
- ✅ Can only edit your own policies
- ✅ Can view partner's policies (read-only)
- ✅ Household policies can be edited by both partners
- ✅ Renewal reminders and status tracking

---

## Page 14: Settings (`/finance/settings`)

**Purpose:** Configure finance module settings

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Finance Settings                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Merged Mode Settings                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Merged mode is ACTIVE                                             │  │
│  │                                                                       │  │
│  │ You and Sarah have merged finances permission.                       │  │
│  │ You can see all of each other's financial data.                      │  │
│  │                                                                       │  │
│  │ [Manage Connection Settings]                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Display Preferences                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Currency: [USD - $ ▼]                                                │  │
│  │ Date Format: [MM/DD/YYYY ▼]                                          │  │
│  │ First Day of Week: [Sunday ▼]                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Categories                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [Manage My Categories]                                               │  │
│  │                                                                       │  │
│  │ Note: Categories are personal. You and Sarah each have your own      │  │
│  │ category system. When viewing partner's transactions, you'll see     │  │
│  │ their category names.                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Data & Privacy                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [Export My Data]                                                     │  │
│  │ [Import Transactions]                                                │  │
│  │ [Delete All My Data]                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Shows merged mode status
- ✅ Link to manage connection settings
- ✅ Personal preferences (currency, date format)
- ✅ Category management (personal)
- ✅ Data export/import
- ✅ No owner badges needed (settings are personal)

---

## Summary of Design Patterns

### Owner Badges
- **Blue `[Me]`** - Your own data
- **Purple `[Sarah]`** - Partner's data
- **Green `[Household]`** - Shared/combined items (budgets, goals)

### Permissions
- **Your data:** Full edit/delete access
- **Partner's data:** View-only (cannot edit/delete)
- **Household data:** Both can edit

### No Filtering
- Always show ALL data from both partners
- No "Me/Partner/Both" toggle buttons
- Simpler UX, clearer household view

### Metrics
- All metrics show **combined household totals**
- Income = Your income + Partner's income
- Expenses = Your expenses + Partner's expenses
- Net Worth = All accounts from both partners

---

**Document Version:** 1.0
**Created:** 2026-01-30
**Status:** Ready for Review & Approval

