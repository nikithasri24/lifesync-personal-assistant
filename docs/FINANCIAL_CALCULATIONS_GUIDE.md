# Financial Calculations Guide

This document explains all the important financial calculations used in the finance app, helping users understand how their money works and how projections are made.

---

## 📊 Core Metrics

### 1. Net Worth
**Formula:** `Assets - Liabilities = Net Worth`

**Example:**
```
Assets:
  Checking: $5,000
  Savings: $15,000
  401k: $50,000
  Home: $300,000
  Total Assets: $370,000

Liabilities:
  Mortgage: $250,000
  Car Loan: $15,000
  Credit Card: $2,000
  Total Liabilities: $267,000

Net Worth = $370,000 - $267,000 = $103,000
```

**Why it matters:** Net worth is the single best indicator of overall financial health. It shows your actual wealth, not just your income.

---

### 2. Savings Rate
**Formula:** `(Income - Expenses) / Income × 100 = Savings Rate %`

**Example:**
```
Monthly Income: $7,000
Monthly Expenses: $4,500
Monthly Savings: $2,500

Savings Rate = ($2,500 / $7,000) × 100 = 35.7%
```

**Why it matters:** Your savings rate is the #1 factor in reaching financial independence. A 50% savings rate means you can retire in ~17 years, regardless of income level.

**Benchmarks:**
- 10-15%: Good (standard retirement planning)
- 20-30%: Excellent (early retirement possible)
- 50%+: FIRE territory (Financial Independence, Retire Early)

---

### 3. Debt-to-Income Ratio (DTI)
**Formula:** `Total Monthly Debt Payments / Gross Monthly Income × 100`

**Example:**
```
Monthly Income: $6,000
Mortgage: $1,500
Car Payment: $400
Student Loan: $300
Credit Card Minimum: $100
Total Debt Payments: $2,300

DTI = ($2,300 / $6,000) × 100 = 38.3%
```

**Why it matters:** Lenders use DTI to determine loan eligibility. It also indicates financial stress.

**Benchmarks:**
- <36%: Good (can qualify for most loans)
- 36-43%: Manageable (limited borrowing capacity)
- >43%: High risk (difficult to get approved, high stress)

---

### 4. Emergency Fund Coverage
**Formula:** `Emergency Fund Balance / Average Monthly Expenses = Months Covered`

**Example:**
```
Emergency Fund: $18,000
Monthly Expenses: $4,500

Coverage = $18,000 / $4,500 = 4 months
```

**Why it matters:** Shows how long you could survive without income.

**Benchmarks:**
- 3-6 months: Standard recommendation
- 6-12 months: Conservative/self-employed
- <3 months: Risky, prioritize building this

---

## 💰 Budgeting Calculations

### 5. 50/30/20 Budget Rule
**Formula:**
- Needs: 50% of after-tax income
- Wants: 30% of after-tax income
- Savings: 20% of after-tax income

**Example:**
```
After-tax monthly income: $5,000

Needs (50%): $2,500
  - Rent/mortgage
  - Utilities
  - Groceries
  - Insurance
  - Minimum debt payments

Wants (30%): $1,500
  - Dining out
  - Entertainment
  - Shopping
  - Hobbies

Savings (20%): $1,000
  - Emergency fund
  - Retirement
  - Investments
  - Extra debt payments
```

**Why it matters:** Simple framework for balanced spending. Can be adjusted based on goals (e.g., 50/20/30 for aggressive savers).

---

### 6. Cost Per Use
**Formula:** `Total Cost / Number of Uses = Cost Per Use`

**Example:**
```
Gym membership: $50/month
Visited 8 times
Cost per use = $50 / 8 = $6.25 per visit

vs.

Drop-in rate: $15 per visit
Total cost for 8 visits: $120

Decision: Keep membership (saves $70/month)
```

**Why it matters:** Helps evaluate subscriptions and purchases. Is that rarely-used service worth it?

---

## 🏠 Housing Calculations

### 7. 28/36 Rule (Housing Affordability)
**Formula:**
- Front-end ratio: Housing costs ≤ 28% of gross monthly income
- Back-end ratio: Total debt ≤ 36% of gross monthly income

**Example:**
```
Gross monthly income: $8,000

Max housing (28%): $8,000 × 0.28 = $2,240
  (includes mortgage, taxes, insurance, HOA)

Max total debt (36%): $8,000 × 0.36 = $2,880
  (includes housing + car + student loans + credit cards)

Available for other debt: $2,880 - $2,240 = $640
```

**Why it matters:** Prevents house-poor syndrome. Just because you're approved doesn't mean you should buy.

---

### 8. Rent vs Buy Breakeven Analysis
**Formula:** `(Home Price - Down Payment + Closing Costs) / Monthly Rent Savings = Months to Break Even`

**Simplified example:**
```
Home price: $400,000
Down payment: $80,000
Closing costs: $10,000
Monthly mortgage (PITI): $2,400
Current rent: $2,000

Monthly cost increase: $400

Upfront costs: $90,000
Breakeven: $90,000 / $400 = 225 months (18.75 years)

Note: This is simplified. Full calculation includes:
- Tax benefits
- Home appreciation
- Opportunity cost of down payment
- Maintenance costs
- Transaction costs when selling
```

**Why it matters:** Renting isn't "throwing money away" - sometimes it's the smarter choice.

---

## 💳 Credit & Debt Calculations

### 9. Credit Card Interest
**Formula:**
```
Daily Rate = APR / 365
Daily Interest = Balance × Daily Rate
Monthly Interest ≈ Balance × (APR / 12)
```

**Example:**
```
Balance: $5,000
APR: 18%

Daily rate = 18% / 365 = 0.0493%
Daily interest = $5,000 × 0.000493 = $2.47/day

Over 30 days: $2.47 × 30 = $74.10
```

**Why it matters:** Shows why carrying a balance is expensive. That $5,000 balance costs you $74/month if you don't pay it off.

---

### 10. Debt Payoff Time (With Extra Payments)
**Formula:** `N = -log(1 - (r × B / P)) / log(1 + r)`

Where:
- N = Number of payments
- r = Monthly interest rate (APR / 12)
- B = Current balance
- P = Payment amount

**Example (simplified):**
```
Credit card balance: $10,000
APR: 18% (1.5% monthly)
Minimum payment: $200/month

Minimum only:
- Time: 94 months (7.8 years)
- Total interest: $8,700

With $400/month:
- Time: 31 months (2.6 years)
- Total interest: $2,300
- Savings: $6,400 + 5.2 years of freedom
```

**Why it matters:** Small extra payments have huge impact. Doubling payment cuts time by 2/3 and saves thousands.

---

### 11. Credit Utilization Ratio
**Formula:** `Total Credit Card Balances / Total Credit Limits × 100`

**Example:**
```
Card 1: $500 balance, $5,000 limit
Card 2: $1,200 balance, $10,000 limit
Card 3: $0 balance, $3,000 limit

Total balances: $1,700
Total limits: $18,000

Utilization = ($1,700 / $18,000) × 100 = 9.4%
```

**Why it matters:** Major factor in credit score (30% of FICO score).

**Benchmarks:**
- <10%: Excellent (optimal for credit score)
- 10-30%: Good
- 30-50%: Fair (starts hurting score)
- >50%: Poor (significant negative impact)

---

## 📈 Investment Calculations

### 12. Compound Interest (Future Value)
**Formula:** `FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]`

Where:
- FV = Future value
- PV = Present value (starting amount)
- r = Interest rate per period
- n = Number of periods
- PMT = Regular payment

**Example:**
```
Starting: $10,000
Monthly contribution: $500
Annual return: 7% (0.583% monthly)
Time: 30 years (360 months)

Future value ≈ $10,000 × (1.07)^30 + $500 × [((1.07)^30 - 1) / 0.07/12]
            ≈ $76,123 + $566,764
            ≈ $642,887

Total contributed: $10,000 + ($500 × 360) = $190,000
Investment gains: $642,887 - $190,000 = $452,887
```

**Why it matters:** Shows the power of starting early and being consistent. Time in market > timing the market.

---

### 13. Rule of 72
**Formula:** `Years to Double = 72 / Annual Return Rate`

**Examples:**
```
7% return: 72 / 7 = 10.3 years to double
10% return: 72 / 10 = 7.2 years to double
3% inflation: 72 / 3 = 24 years until purchasing power halves
```

**Why it matters:** Quick mental math to understand growth. At 7% return, your money doubles every ~10 years:
- Year 0: $10,000
- Year 10: $20,000
- Year 20: $40,000
- Year 30: $80,000
- Year 40: $160,000

---

### 14. Real Rate of Return (Inflation-Adjusted)
**Formula:** `Real Return = [(1 + Nominal Return) / (1 + Inflation Rate)] - 1`

**Example:**
```
Portfolio return: 8%
Inflation: 3%

Real return = [(1.08 / 1.03) - 1] × 100
            = 4.85%
```

**Why it matters:** Your money needs to beat inflation or you're losing purchasing power. An 8% return with 3% inflation is really only 4.85% growth in buying power.

---

### 15. Asset Allocation & Expected Return
**Formula:** `Portfolio Return = Σ(Weight × Expected Return)`

**Example:**
```
60% Stocks (expected 9% return): 0.60 × 9% = 5.4%
30% Bonds (expected 4% return): 0.30 × 4% = 1.2%
10% Cash (expected 1% return): 0.10 × 1% = 0.1%

Expected portfolio return = 5.4% + 1.2% + 0.1% = 6.7%
```

**Why it matters:** Helps set realistic expectations and choose appropriate asset mix for goals.

---

### 16. Cost Basis & Capital Gains
**Formula:**
```
Capital Gain = Sale Price - Purchase Price - Fees
Tax Owed = Capital Gain × Tax Rate
```

**Example:**
```
Bought 100 shares at $50: $5,000
Sold 100 shares at $75: $7,500
Trading fees: $10

Short-term gain (held <1 year):
  Gain: $7,500 - $5,000 - $10 = $2,490
  Tax (24% bracket): $2,490 × 0.24 = $597.60
  Net profit: $2,490 - $597.60 = $1,892.40

Long-term gain (held >1 year):
  Gain: $2,490
  Tax (15% rate): $2,490 × 0.15 = $373.50
  Net profit: $2,490 - $373.50 = $2,116.50

Savings by holding >1 year: $224.10
```

**Why it matters:** Patience pays. Long-term capital gains are taxed more favorably.

---

## 🎯 Goal & Retirement Planning

### 17. Required Monthly Savings for Goal
**Formula:** `PMT = FV × [r / ((1 + r)^n - 1)]`

**Example:**
```
Goal: $30,000 down payment
Time: 3 years (36 months)
Expected return: 4% annual (0.33% monthly)

Required monthly savings:
PMT = $30,000 × [0.0033 / ((1.0033)^36 - 1)]
    = $30,000 × 0.0264
    = $792/month
```

**Why it matters:** Turns vague goals into actionable monthly targets.

---

### 18. Retirement Savings Multiplier
**Rule of thumb:** By age X, have X times your salary saved

**Benchmarks:**
```
Age 30: 1× salary
Age 35: 2× salary
Age 40: 3× salary
Age 45: 4× salary
Age 50: 6× salary
Age 55: 7× salary
Age 60: 8× salary
Age 67: 10× salary
```

**Example:**
```
Age: 35
Salary: $80,000
Target: 2× = $160,000

Current retirement savings: $120,000
Gap: $40,000 (need to catch up)
```

**Why it matters:** Simple checkpoint to see if you're on track. Not perfect, but a good gut check.

---

### 19. 4% Rule (Safe Withdrawal Rate)
**Formula:** `Annual Safe Withdrawal = Portfolio Value × 4%`

**Example:**
```
Retirement portfolio: $1,000,000
Safe annual withdrawal: $1,000,000 × 4% = $40,000

Monthly income: $40,000 / 12 = $3,333

This amount can be adjusted for inflation each year with ~95%
probability of lasting 30 years based on historical data.
```

**Why it matters:** Helps calculate how much you need to retire:
```
Annual expenses: $60,000
Required portfolio: $60,000 / 0.04 = $1,500,000
```

**Modern adjustments:**
- 3-3.5%: More conservative (longer retirements, lower returns)
- 4-4.5%: Traditional (30-year retirement)
- Variable: Adjust based on market performance

---

### 20. Years to Financial Independence
**Formula:** `Years = log(1 + (Savings Rate × 25)) / log(1 + Real Return)`

**Simplified (assuming 5% real return):**
```
Savings Rate → Years to FI:
10% → 51 years
20% → 37 years
30% → 28 years
40% → 22 years
50% → 17 years
60% → 13 years
70% → 9 years
```

**Example:**
```
Income: $100,000
Expenses: $50,000
Savings: $50,000
Savings rate: 50%

Years to FI ≈ 17 years

Why: At 50% savings rate, you save 1 year of expenses
for every 1 year worked. With investment returns,
this accelerates to ~17 years.
```

**Why it matters:** Shows that income level matters less than savings rate. Someone making $50k and saving 50% reaches FI faster than someone making $200k and saving 10%.

---

## 💼 Insurance Calculations

### 21. Life Insurance Needs (DIME Method)
**Formula:** `Debt + Income × 10 + Mortgage + Education = Coverage Needed`

**Example:**
```
Debt (credit cards, car loans): $30,000
Income replacement (10 years): $80,000 × 10 = $800,000
Mortgage balance: $250,000
Kids' education (2 kids, $50k each): $100,000

Total needed: $30,000 + $800,000 + $250,000 + $100,000 = $1,180,000

Recommend: $1,200,000 policy
```

**Why it matters:** Ensures family can maintain lifestyle if primary earner dies.

---

### 22. Disability Insurance Coverage
**Formula:** `Recommended Coverage = 60-70% of Gross Income`

**Example:**
```
Annual income: $90,000
Recommended: $90,000 × 0.65 = $58,500/year = $4,875/month

Why not 100%? Tax-free benefits + removes incentive to not return to work
```

**Why it matters:** You're more likely to become disabled than die during working years. Protects income.

---

### 23. Health Insurance Deductible Analysis
**Formula:** `Total Cost = Premium × 12 + Expected Out-of-Pocket`

**Example comparing two plans:**
```
Plan A (Low deductible):
  Premium: $500/month
  Deductible: $1,000
  Max out-of-pocket: $3,000

  Healthy year: $500 × 12 = $6,000
  Moderate use: $6,000 + $1,500 = $7,500
  Bad year: $6,000 + $3,000 = $9,000

Plan B (High deductible):
  Premium: $300/month
  Deductible: $5,000
  Max out-of-pocket: $7,000

  Healthy year: $300 × 12 = $3,600
  Moderate use: $3,600 + $4,000 = $7,600
  Bad year: $3,600 + $7,000 = $10,600

Best choice depends on expected healthcare usage.
If healthy: Plan B saves $2,400/year
If moderate: Plans roughly equal
If heavy user: Plan A saves $1,600/year
```

**Why it matters:** Lower premiums aren't always cheaper. Model different scenarios.

---

## 📊 Tax Calculations

### 24. Effective Tax Rate vs Marginal Tax Rate
**Formulas:**
- `Marginal Rate = Tax rate on next dollar earned`
- `Effective Rate = Total Tax / Taxable Income × 100`

**Example (2025 single filer):**
```
Taxable income: $100,000

Tax calculation (brackets):
  10% on first $11,600: $1,160
  12% on $11,600-$47,150: $4,266
  22% on $47,150-$100,000: $11,627

Total tax: $17,053

Marginal rate: 22% (rate on last dollar earned)
Effective rate: $17,053 / $100,000 = 17.05%

Why it matters:
- Marginal: Used for decision making (is overtime worth it?)
- Effective: Shows actual tax burden
```

---

### 25. Tax-Deferred vs Roth Comparison
**Traditional (Tax-deferred):**
```
Income: $80,000
401k contribution: $10,000
Taxable income: $70,000
Tax saved now (22% bracket): $2,200

At retirement (12% bracket):
Withdrawal: $10,000
Tax owed: $1,200
Net benefit: $2,200 - $1,200 = $1,000
```

**Roth (After-tax):**
```
Income: $80,000
Roth 401k contribution: $10,000
Taxable income: $80,000
Tax paid now (22% bracket): $2,200

At retirement:
Withdrawal: $10,000
Tax owed: $0
Net benefit: $2,200 (if in same bracket)

Better choice: Roth if you expect higher tax rate in retirement
```

**Why it matters:** Matching your retirement account type to expected future tax rate maximizes after-tax wealth.

---

### 26. FICA Tax (Self-Employment)
**Formula:**
```
Employee: 7.65% (SS: 6.2%, Medicare: 1.45%)
Employer: 7.65%
Self-employed: 15.3% (both sides)
```

**Example:**
```
W-2 employee earning $60,000:
  Employee FICA: $60,000 × 7.65% = $4,590
  (Employer pays other $4,590)

Self-employed earning $60,000:
  Self-employment tax: $60,000 × 92.35% × 15.3% = $8,478
  (Can deduct 50% as business expense: $4,239 deduction)
```

**Why it matters:** Self-employed need to budget extra for taxes. That $60k freelance gig isn't equivalent to $60k W-2 salary.

---

## 🏦 Banking & Savings Calculations

### 27. Annual Percentage Yield (APY)
**Formula:** `APY = (1 + r/n)^n - 1`

Where:
- r = Annual interest rate
- n = Compounding frequency

**Example:**
```
Interest rate: 4.5%
Compounded daily (n = 365)

APY = (1 + 0.045/365)^365 - 1
    = 1.046 - 1
    = 4.6%

$10,000 deposit:
Simple interest (4.5%): $450
Actual earnings (4.6% APY): $460
Extra $10 from compounding
```

**Why it matters:** APY accounts for compounding - use it to compare savings accounts.

---

### 28. Inflation Impact on Savings
**Formula:** `Real Value = Nominal Value / (1 + Inflation)^Years`

**Example:**
```
Today: $50,000 in savings
Inflation: 3% per year
No growth (0% interest)

Purchasing power:
Year 5: $50,000 / (1.03)^5 = $43,136 (-14%)
Year 10: $50,000 / (1.03)^10 = $37,205 (-26%)
Year 20: $50,000 / (1.03)^20 = $27,681 (-45%)

Lesson: Cash loses value. Need investments that beat inflation.
```

**Why it matters:** Sitting in cash is a guaranteed loss in purchasing power.

---

## 🎓 Education Planning

### 29. 529 Plan Future Value
**Formula:** Same as compound interest (FV formula)

**Example:**
```
Starting: $5,000
Monthly: $200
Years until college: 15
Expected return: 6%

Future value ≈ $73,500

Total contributed: $5,000 + ($200 × 180) = $41,000
Investment gains: $73,500 - $41,000 = $32,500 (tax-free!)
```

**Why it matters:** Tax-free growth for education makes 529 plans powerful.

---

### 30. Student Loan Affordability
**Formula:** `Max affordable = Expected Starting Salary × 1.0`

**Example:**
```
Expected career: Software Engineer
Starting salary: $85,000
Max affordable student loans: $85,000

Monthly payment (10-year plan at 5%):
$85,000 at 5% = ~$900/month
As % of gross: $900 / ($85,000/12) = 12.7%

Guideline: Keep below 10-15% of gross income
```

**Why it matters:** Prevents crippling debt. If you need to borrow >1× expected salary, reconsider school choice or major.

---

## 📉 Risk Calculations

### 31. Sharpe Ratio (Risk-Adjusted Return)
**Formula:** `Sharpe Ratio = (Portfolio Return - Risk-Free Rate) / Standard Deviation`

**Example:**
```
Portfolio A: 9% return, 12% volatility
Portfolio B: 7% return, 6% volatility
Risk-free rate: 2%

Sharpe A = (9% - 2%) / 12% = 0.58
Sharpe B = (7% - 2%) / 6% = 0.83

Portfolio B is better on risk-adjusted basis despite lower return.
```

**Why it matters:** Higher returns don't mean better investment if volatility is extreme.

---

### 32. Sequence of Returns Risk
**Example:**
```
Portfolio: $1,000,000
Annual withdrawal: $40,000 (4%)

Scenario A (good early years):
Year 1: +10% → $1,060,000
Year 2: +8% → $1,104,800
Year 3: -15% → $898,880
Withdrawal $40k each year...

Scenario B (bad early years):
Year 1: -15% → $810,000
Year 2: +8% → $834,800
Year 3: +10% → $878,280
Withdrawal $40k each year...

After 3 years:
Scenario A: ~$900k remaining
Scenario B: ~$780k remaining

Same average returns, $120k difference!
```

**Why it matters:** Early losses during retirement are devastating. This is why retirees shift to bonds.

---

## 🔄 Cash Flow Calculations

### 33. Break-Even Point (Business/Side Hustle)
**Formula:** `Break-Even = Fixed Costs / (Price - Variable Cost per Unit)`

**Example:**
```
Side business (online store):
Fixed costs: $500/month (website, tools, marketing)
Product price: $50
Variable cost per unit: $20 (product + shipping)

Break-even = $500 / ($50 - $20) = 16.67 units

Need to sell 17 units/month to break even.
18+ units = profit
```

**Why it matters:** Know your numbers before quitting your day job.

---

### 34. Hourly Rate Equivalent
**Formula:** `Hourly Rate = Annual Salary / (Hours per Week × 50 weeks)`

**Example:**
```
Salary: $75,000
Hours: 40/week

Hourly: $75,000 / (40 × 50) = $37.50/hour

Side hustle paying $30/hour?
Might not be worth it if it reduces job performance.

Side hustle paying $60/hour?
Definitely worth the time.
```

**Why it matters:** Helps evaluate opportunities and understand true cost of unpaid overtime.

---

## 🏘️ Real Estate Calculations

### 35. Rental Property Cap Rate
**Formula:** `Cap Rate = Net Operating Income / Property Value × 100`

**Example:**
```
Property price: $300,000
Monthly rent: $2,000
Annual rent: $24,000
Expenses (property tax, insurance, maintenance): $6,000
Net operating income: $18,000

Cap rate = $18,000 / $300,000 = 6%

Benchmarks:
4-6%: Low return (stable markets)
7-10%: Good return
10%+: High return (higher risk markets)
```

**Why it matters:** Quick way to evaluate rental properties. Compare to stock market returns (7-10% historical).

---

### 36. 1% Rule (Rental Property)
**Formula:** `Monthly Rent ≥ 1% of Purchase Price`

**Example:**
```
Property: $250,000
1% rule: Rent should be ≥ $2,500/month

Actual rent: $1,800/month = 0.72%
Doesn't meet 1% rule → probably not great investment

Actual rent: $2,600/month = 1.04%
Meets 1% rule → likely cash-flow positive
```

**Why it matters:** Quick filter for rental properties. Doesn't guarantee profit but rules out bad deals fast.

---

## 📱 Subscription & Recurring Cost Analysis

### 37. Annual Cost of Subscriptions
**Formula:** `Annual Cost = Monthly × 12 + Annual Services`

**Example:**
```
Netflix: $15/month = $180/year
Spotify: $11/month = $132/year
Gym: $50/month = $600/year
Amazon Prime: $139/year
iCloud: $3/month = $36/year
News: $10/month = $120/year

Total: $1,207/year

In 10 years at 7% return if invested instead:
$1,207/year for 10 years = $16,673
Lost opportunity cost: ~$4,600
```

**Why it matters:** Small monthly fees add up. Audit annually and cancel unused services.

---

### 38. Cost of Convenience
**Formula:** `Annual Cost = Cost per Use × Uses per Year`

**Examples:**
```
Coffee shop ($5 × 250 days): $1,250/year
  vs. Home brew ($0.50 × 250): $125/year
  Savings: $1,125/year

Uber Eats ($15 delivery fee × 52 weeks × 2): $1,560/year
  vs. Pickup: $0
  Savings: $1,560/year

Gym ($50/month, use 4×/month): $12.50/visit
  vs. Home workout ($200/year): $4/visit equivalent
```

**Why it matters:** Convenience has a price. Calculate if it's worth it to you.

---

## 🎯 Summary: Most Important Calculations to Know

### For Everyone:
1. **Net Worth** - Overall financial health
2. **Savings Rate** - #1 factor in building wealth
3. **Compound Interest** - Why starting early matters
4. **Real Rate of Return** - Beat inflation or lose money
5. **Emergency Fund Coverage** - Financial safety

### For Debt Management:
6. **Credit Card Interest** - Cost of carrying balances
7. **Debt Payoff Time** - Impact of extra payments
8. **Debt-to-Income** - Borrowing capacity & stress level

### For Long-term Planning:
9. **4% Rule** - How much you need to retire
10. **Required Monthly Savings** - Turn goals into action
11. **Years to Financial Independence** - Savings rate impact
12. **Tax Rates (Effective vs Marginal)** - Decision making

### For Investing:
13. **Rule of 72** - Mental math for growth
14. **Asset Allocation Return** - Portfolio expectations
15. **Cost Basis** - Tax implications of selling

---

## 💡 How to Use This Guide

1. **Bookmark formulas** you use regularly (Net Worth, Savings Rate, Goals)
2. **Set up spreadsheets** for complex calculations (retirement, debt payoff)
3. **Review quarterly** to track progress toward goals
4. **Teach concepts** to family members to improve household finances
5. **Make decisions** based on math, not emotions

**Remember:** These calculations are tools, not rules. Use them to inform decisions, but adjust for your unique situation, risk tolerance, and values.

---

## 🔗 Tools & Resources

### Calculators to Build:
- Net Worth Tracker (Assets - Liabilities)
- Savings Rate Calculator (Income - Expenses / Income)
- Goal Timeline (FV formula with regular payments)
- Debt Payoff Comparison (Avalanche vs Snowball)
- Retirement Readiness (4% rule + current savings)
- Tax Estimator (Marginal + Effective rates)
- Investment Growth (Compound interest)
- Real Estate Analysis (Cap rate, cash flow)

### External Resources:
- Bankrate.com - Various financial calculators
- Investor.gov - SEC's compound interest calculator
- IRS.gov - Tax brackets and deduction rules
- SSA.gov - Social Security benefit estimator
- Calculator.net - Comprehensive financial calculators

---

*Last updated: 2025-11-18*
