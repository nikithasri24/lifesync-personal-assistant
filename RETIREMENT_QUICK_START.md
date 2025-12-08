# Retirement Accounts - Quick Start Guide

## 🎯 Where to Add Retirement Accounts

### Step 1: Create the Retirement Account ⭐
1. Go to **Finances** page in your app
2. Click the **"Accounts"** tab in the navigation
3. Click **"Add Manual Account"** button
4. Enter an account name (e.g., "My 401k", "Roth IRA")
5. Select account type from the **"Retirement Accounts"** dropdown section:
   - **401K** - Employer-sponsored 401(k) plan
   - **403B** - For non-profit employees
   - **TRADITIONAL IRA** - Traditional Individual Retirement Account
   - **ROTH IRA** - Roth Individual Retirement Account
   - **SEP IRA** - SEP IRA for self-employed
   - **SIMPLE IRA** - SIMPLE IRA
   - **HSA** - Health Savings Account
6. Enter the current balance
7. Click **"Save"**

### Step 2: Configure Retirement Settings
1. Click the **"Retirement"** tab in the finance navigation
2. Find your newly created account in the list
3. Click the **"Edit"** icon (pencil button) on the account card
4. Configure retirement-specific settings:
   - **Tax treatment** (Pre-tax, Post-tax, Tax-exempt)
   - **Contribution limits** (auto-populated with 2024 IRS limits)
   - **Current year contributions** (how much you've contributed so far)
   - **Employer match** (for 401k/403b only)
     - Match percentage
     - Match limit
     - Employer contributions YTD
   - **Vesting schedule** (if applicable)
     - Immediate, Cliff, or Graded
     - Years to vest
     - Current vesting percentage
   - **Investment allocation** (stocks, bonds, cash, etc.)
   - **Notes** (any additional information)
5. Click **"Save"**

### Step 3: Track Your Progress
The **Retirement** tab will now display:
- Total retirement value across all accounts
- Year-to-date contributions
- Total gains/performance
- Retirement readiness score (0-100)
- 4% rule safe withdrawal amounts
- Individual account cards with detailed metrics

---

## 📍 Navigation Structure

Your finance navigation now includes **"Accounts"** and **"Retirement"** tabs:

```
Dashboard → Accounts → Transactions → Recurring → Net Worth → Goals → Loans → Retirement → Projections → Calculators → Credit Cards → Insurance → Settings
```

- **Accounts** - Create and manage all financial accounts (including retirement accounts)
- **Retirement** - Configure retirement-specific settings and view retirement dashboard

---

## 🔧 How to Configure a Retirement Account

### Step 1: Create the Account
Go to **`/finance/accounts`** and create a retirement account (e.g., "My 401k")

### Step 2: Configure Retirement Settings
1. Go to **`/finance/retirement`**
2. Find your newly created account in the list
3. Click the **"Edit" icon** (pencil button)
4. Configure:
   - Tax treatment (Pre-tax, Post-tax, Tax-exempt)
   - Contribution limits (auto-populated with 2024 limits)
   - Current year contributions
   - Employer match (for 401k/403b)
   - Vesting schedule (if applicable)
   - Investment allocation
   - Notes

### Step 3: Track Progress
The Retirement Dashboard automatically shows:
- Total retirement value
- YTD contributions
- Total gains
- Retirement readiness score
- 4% rule safe withdrawal amounts
- Balance breakdown by account type

---

## 📊 Example: Adding a 401(k)

### Step 1: Create Account (Accounts Page)
```
Name: Company 401(k)
Type: 401K
Balance: $50,000
```

### Step 2: Configure (Retirement Page)
```
Tax Treatment: Pre-tax
Annual Limit: $23,000 (auto-filled)
Catch-up Limit: $7,500 (if age 50+)
YTD Contributions: $10,000
Employer Match: 100% up to 6% of salary
Vesting: Graded over 5 years
```

### Step 3: View Dashboard
Your Retirement page will now show:
- Total value: $50,000
- YTD contributions: $10,000
- Contribution progress bar
- Vesting timeline
- Retirement readiness score

---

## 🚀 Quick Deploy

### 1. Run Database Migration
```bash
cd /Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant
npx supabase db push
```

### 2. Start Your App
```bash
npm run dev
```

### 3. Navigate to Retirement
Open your browser and go to: **`http://localhost:XXXX/finance/retirement`**

---

## 📁 File Locations

### Pages
- **Accounts Page**: `/src/finance/pages/AccountsPage.tsx` - Create retirement accounts here
- **Retirement Page**: `/src/finance/pages/RetirementPage.tsx` - Configure & manage retirement accounts

### Routes
- **Routes Config**: `/src/finance/routes.tsx` - Navigation includes `/finance/retirement`

### Components (All in `/src/finance/components/retirement/`)
- `RetirementDashboard.tsx` - Main overview
- `RetirementAccountEditor.tsx` - Configuration form
- `RetirementAccountCard.tsx` - Account display card
- `ContributionTracker.tsx` - Progress visualization
- `VestingScheduleDisplay.tsx` - Vesting timeline
- `InvestmentAllocationEditor.tsx` - Asset allocation

---

## 🎨 UI Flow

```
User Flow:
┌─────────────────────────┐
│  1. Accounts Page       │
│  Add 401k account       │
│  (basic info + balance) │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Retirement Page     │
│  Configure 401k details │
│  (limits, match, vest)  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Dashboard Shows     │
│  - Total value          │
│  - Contributions        │
│  - Readiness score      │
│  - Individual accounts  │
└─────────────────────────┘
```

---

## ✅ What's Already Working

- ✅ **Database schema** deployed (after migration)
- ✅ **API methods** ready to use
- ✅ **Components** built and tested
- ✅ **Routes** configured
- ✅ **Accounts page** updated with retirement types
- ✅ **Navigation** includes Retirement tab
- ✅ **Net worth** calculations include retirement
- ✅ **Projections** can use retirement data

---

## 🎯 Features Available

### For Each Retirement Account:
- ✅ Contribution tracking with IRS limits
- ✅ Employer match configuration
- ✅ Vesting schedules (immediate/cliff/graded)
- ✅ Investment allocation management
- ✅ Performance tracking
- ✅ Tax treatment configuration

### Dashboard Features:
- ✅ Total retirement value
- ✅ YTD contribution summary
- ✅ Retirement readiness score (0-100)
- ✅ 4% rule calculations
- ✅ Balance breakdown by type
- ✅ Individual account cards

---

## 💡 Tips

1. **Annual Salary & Age**: Update in Settings for accurate employer match and readiness calculations
2. **Contribution Limits**: Automatically use 2024 IRS limits
3. **Vesting**: Track unvested employer contributions
4. **Allocation**: Use age-based suggestions or presets
5. **Goals**: Link retirement accounts to financial goals

---

## 🆘 Troubleshooting

**"Can't see retirement accounts in the list"**
- Make sure you created the account in Accounts page first
- Check that the account type is one of: 401k, 403b, traditional_ira, roth_ira, sep_ira, simple_ira, hsa

**"Edit button doesn't work"**
- The account may not have metadata yet - click Edit to create it
- Refresh the page and try again

**"Contribution limits are wrong"**
- These are 2024 IRS limits - they can be manually adjusted in the editor
- Future updates will include 2025+ limits

---

## 📞 Need Help?

Refer to the comprehensive guide: **`RETIREMENT_ACCOUNTS_GUIDE.md`**
