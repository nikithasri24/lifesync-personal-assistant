# Credit Card Balance Display Fix

## Issue

Credit card balances were showing as positive numbers (e.g., `$21,440.26`) when they should display as negative numbers (e.g., `-$21,440.26`) to represent debt/liability.

## Root Cause

Account balances are stored as **positive numbers** in the database (representing the amount owed), but the display logic wasn't checking the `liability` flag to show them as negative.

## How It Works

### Database Storage
- **Credit cards** and **loans** have `liability = true`
- Balance is stored as a **positive number** (e.g., `21440.26` for $21,440.26 owed)
- When inserting/updating via `upsertAccount`, the API automatically sets `liability = true` for `type === 'credit'`

### Display Logic
- **Checking/Savings/Investment accounts**: Display as positive (assets)
  - Formula: `formatCurrency(balance)`
- **Credit cards/Loans**: Display as negative (liabilities)
  - Formula: `formatCurrency(liability ? -balance : balance)`

## Files Fixed

### 1. src/finance/pages/DashboardPage.tsx (line 297)
**Accounts Snapshot card**

**Before:**
```typescript
<div className="font-semibold">{formatCurrency(a.balance)}</div>
```

**After:**
```typescript
<div className="font-semibold">
  {formatCurrency(a.liability ? -a.balance : a.balance)}
</div>
```

### 2. src/finance/pages/AccountsPage.tsx (line 59)
**Accounts list page**

**Before:**
```typescript
<div className="font-semibold">{formatCurrency(a.balance)}</div>
```

**After:**
```typescript
<div className="font-semibold">{formatCurrency(a.liability ? -a.balance : a.balance)}</div>
```

### 3. src/finance/pages/NetWorthPage.tsx (line 195)
**Asset breakdown section**

**Before:**
```typescript
<span>{formatCurrency(a.balance)}</span>
```

**After:**
```typescript
<span>{formatCurrency(a.liability ? -a.balance : a.balance)}</span>
```

**Note**: The liabilities section (line 234) already used `Math.abs(a.balance)` which is correct for showing positive amounts in the breakdown.

## Result

Now credit card balances display correctly:

### Before Fix:
```
Slate - Nikki
credit
$21,440.26        ❌ WRONG
```

### After Fix:
```
Slate - Nikki
credit
-$21,440.26       ✅ CORRECT
```

## Examples

| Account Type | Database Balance | `liability` | Display |
|-------------|-----------------|-------------|---------|
| Checking | 1000.00 | false | $1,000.00 |
| Savings | 5000.00 | false | $5,000.00 |
| Credit Card | 2850.00 | true | **-$2,850.00** |
| Loan | 15000.00 | true | **-$15,000.00** |
| Investment | 10000.00 | false | $10,000.00 |

## Account Modal Form

The **AccountModal** form is correct as-is:
- When **creating** a credit card, you enter the amount owed as a positive number (e.g., `2850` for $2,850 owed)
- When **editing** a credit card, the form shows the positive amount (e.g., `21440.26`)
- The database stores it as `balance: 21440.26, liability: true`
- The display converts it to `-$21,440.26`

This makes data entry intuitive - you enter "how much you owe" as a positive number.

## Net Worth Calculation

With this fix, net worth calculations are now correct:

```
Net Worth = Assets - Liabilities
          = (Checking + Savings + Investments) - (Credit Cards + Loans)
          = $1,000 + $5,000 + $10,000 - $21,440.26 - $15,000
          = -$20,440.26
```

The display logic ensures:
- ✅ Asset accounts show positive balances
- ✅ Liability accounts show negative balances
- ✅ Net worth calculations are accurate
- ✅ User enters amounts intuitively (positive = amount owed)
