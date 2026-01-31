# Finances Merged Mode - Quick Summary

## How It Works for Both Partners

### 🎯 Core Concept
When **both partners** set finances permission to **"merged"**, they see a **unified household financial view** with all data from both partners combined.

---

## 📊 What Each Partner Sees

### Dashboard View
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Finance Dashboard              January 2026 ▼           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Household Summary (Combined)                            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Income       │ Expenses     │ Cash Flow    │            │
│  │ $8,500       │ $6,200       │ +$2,300      │            │
│  │ (Both)       │ (Both)       │ (Both)       │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                              │
│  📈 Net Worth: $125,450 (Both partners combined)            │
│                                                              │
│  Recent Transactions (All)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Jan 28  My Salary         +$5,000.00    [Me]        │  │
│  │ Jan 27  Whole Foods       -$87.32       [Sarah]     │  │
│  │ Jan 27  Starbucks         -$5.50        [Me]        │  │
│  │ Jan 26  Sarah's Salary    +$3,500.00    [Sarah]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Accounts (All)                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏦 My Chase Checking      $3,250.45     [Me]        │  │
│  │ 🏦 Sarah's BofA Checking  $2,100.00     [Sarah]     │  │
│  │ 💳 My Chase Credit        -$450.32      [Me]        │  │
│  │ 💳 Sarah's Amex Gold      -$1,234.56    [Sarah]     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

### 1. **No Filtering Needed**
- ✅ Always shows **both partners' data** together
- ✅ No "Me/Partner/Both" toggle - simpler UX
- ✅ One unified household view

### 2. **Owner Badges**
- 🔵 **Blue badge `[Me]`** - Your own accounts/transactions
- 🟣 **Purple badge `[Sarah]`** - Partner's accounts/transactions
- Badges appear on **every** transaction and account

### 3. **Combined Metrics**
- **Income** = Your income + Partner's income
- **Expenses** = Your expenses + Partner's expenses
- **Cash Flow** = Combined income - Combined expenses
- **Net Worth** = All your accounts + All partner's accounts

### 4. **Categories**
- Each partner keeps their **own categories**
- When viewing partner's transaction, you see **their category name**
- Example: You use "Groceries", partner uses "Food" - both are shown as-is

### 5. **Budgets**
- **Personal budgets** - Track only your own spending
- **Household budgets** - Track combined spending from both partners
- You can create both types

---

## 👥 Example Scenario

### Partner A (You) sees:
```
Income: $8,500 (Your $5,000 + Sarah's $3,500)
Expenses: $6,200 (Your $3,800 + Sarah's $2,400)
Net Worth: $125,450 (Your $68,850 + Sarah's $56,600)

Transactions:
- Your salary: $5,000 [Me]
- Sarah's salary: $3,500 [Sarah]
- Your Starbucks: -$5.50 [Me]
- Sarah's Whole Foods: -$87.32 [Sarah]
```

### Partner B (Sarah) sees:
```
Income: $8,500 (My $3,500 + Partner's $5,000)
Expenses: $6,200 (My $2,400 + Partner's $3,800)
Net Worth: $125,450 (My $56,600 + Partner's $68,850)

Transactions:
- My salary: $3,500 [Me]
- Partner's salary: $5,000 [Partner]
- My Whole Foods: -$87.32 [Me]
- Partner's Starbucks: -$5.50 [Partner]
```

**Note:** Same data, just different perspective (badges show "Me" vs "Partner" based on who's logged in)

---

## 🔒 Privacy & Security

### What You CAN Do:
- ✅ **View** all partner's accounts and transactions
- ✅ **See** all partner's financial data
- ✅ **Create** your own accounts/transactions

### What You CANNOT Do:
- ❌ **Edit** partner's accounts or transactions
- ❌ **Delete** partner's data
- ❌ **Modify** partner's categories or budgets

**Security:** RLS policies ensure you can only edit your own data, even in merged mode.

---

## 🎨 Visual Design

### Color Scheme
- **Blue** = Your data (consistent with Travel, Visa modules)
- **Purple** = Partner's data (consistent with Travel, Visa modules)
- **Green** = Shared/Household items (budgets, goals)

### Badge Placement
- Right side of each transaction row
- Right side of each account card
- Small, unobtrusive, but always visible

---

## 📱 All Pages Affected

1. **Dashboard** - Combined metrics, all transactions, all accounts
2. **Transactions** - All transactions from both partners with badges
3. **Accounts** - All accounts from both partners with badges
4. **Budgets** - Personal + Household budgets
5. **Net Worth** - Combined net worth chart
6. **Goals** - All financial goals from both partners
7. **Loans** - All loans from both partners
8. **Retirement** - All retirement accounts from both partners
9. **Credit Cards** - All credit cards from both partners

---

## 🚀 Benefits

1. **Complete household financial picture** - See everything in one place
2. **Better budgeting** - Track household spending together
3. **Shared goals** - Work towards financial goals as a team
4. **Transparency** - Both partners see the same data
5. **Simple UX** - No complex filtering, just one unified view

---

## ❓ FAQs

**Q: Can I hide some of my accounts from my partner?**
A: No, merged mode shows everything. If you want privacy, use "view" or "none" permission instead.

**Q: What if we have different category names?**
A: Each partner keeps their own categories. You'll see your partner's category names on their transactions.

**Q: Can we create shared budgets?**
A: Yes! You can create household budgets that track spending from both partners.

**Q: What happens if we disconnect?**
A: Each partner only sees their own data again. No data is lost.

**Q: Can my partner edit my transactions?**
A: No, you can only edit your own data. Your partner can view but not modify.

---

**Document Version:** 1.0  
**Created:** 2026-01-30  
**Status:** Ready for Implementation

