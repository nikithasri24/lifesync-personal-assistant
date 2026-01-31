# Finances Merged Mode - UI Mockup

## Visual Examples of How Merged Mode Will Look

**Key Principle:** When both partners have "merged" permission, they see ALL data from both partners combined - no filter needed!

---

## 1. Dashboard Page - Merged View (Always Shows Both)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  💰 Finance Dashboard                              January 2026 ▼       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 Monthly Summary                                                      │
│  ┌──────────────────┬──────────────────┬──────────────────┐            │
│  │  💵 Income       │  💸 Expenses     │  💰 Cash Flow    │            │
│  │  $8,500.00       │  $6,200.00       │  +$2,300.00      │            │
│  │  ↑ 12% vs last   │  ↓ 5% vs last    │  ↑ 25% vs last   │            │
│  └──────────────────┴──────────────────┴──────────────────┘            │
│                                                                          │
│  📈 Net Worth: $125,450.00  (↑ $2,300 this month)                       │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Recent Transactions                                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Jan 28  Salary Deposit           +$5,000.00  Groceries    [Me]   │ │
│  │ Jan 27  Whole Foods              -$87.32     Groceries    [Sarah]│ │
│  │ Jan 27  Starbucks Coffee         -$5.50      Dining       [Me]   │ │
│  │ Jan 26  Salary Deposit           +$3,500.00  Income       [Sarah]│ │
│  │ Jan 25  Amazon Purchase          -$124.99    Shopping     [Me]   │ │
│  │ Jan 25  Target                   -$45.67     Shopping     [Sarah]│ │
│  │ Jan 24  Gas Station              -$52.00     Transport    [Me]   │ │
│  │ Jan 23  Gym Membership           -$29.99     Health       [Sarah]│ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Accounts Overview                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🏦 Chase Checking              $3,250.45              [Me]      │   │
│  │ 🏦 Bank of America Checking    $2,100.00              [Sarah]   │   │
│  │ 💳 Chase Freedom Credit        -$450.32 / $5,000      [Me]      │   │
│  │ 💳 Amex Gold                   -$1,234.56 / $10,000   [Sarah]   │   │
│  │ 📈 Robinhood Brokerage         $12,050.00             [Me]      │   │
│  │ 📈 Vanguard IRA                $45,000.00             [Sarah]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **NO owner filter** - always shows both partners' data
- **Blue badges** `[Me]` for current user's items
- **Purple badges** `[Sarah]` for partner's items
- **Combined metrics** showing household totals (both incomes, both expenses)
- **All accounts and transactions** from both partners visible together
- **Simpler UX** - no need to toggle between views

---

## 2. Transactions Page - Merged View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  💸 Transactions                                                         │
│                                                                          │
│  Filters: [All Categories ▼] [All Accounts ▼] [Jan 2026 ▼]            │
│  Search: [________________]                              [+ Add]        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📅 January 28, 2026                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Salary Deposit                                                    │ │
│  │ Chase Checking • Income                    +$5,000.00    [Me]    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📅 January 27, 2026                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Whole Foods                                                       │ │
│  │ BofA Checking • Groceries                  -$87.32       [Sarah] │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ Starbucks Coffee                                                  │ │
│  │ Chase Freedom • Dining Out                 -$5.50        [Me]    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📅 January 26, 2026                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Salary Deposit                                                    │ │
│  │ BofA Checking • Income                     +$3,500.00    [Sarah] │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Total: 156 transactions • Income: $8,500 • Expenses: $6,200           │
└─────────────────────────────────────────────────────────────────────────┘
```

---


