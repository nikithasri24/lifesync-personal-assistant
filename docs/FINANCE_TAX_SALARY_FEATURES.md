# Finance Feature: Salary Tracking & California Tax Optimization

**Zero-Cost Addition to Finance Module**

---

## Overview

Add comprehensive salary tracking, tax visualization, and California-specific tax optimization features using local calculations (no paid APIs).

---

## **Phase 8: Salary & Income Tracking (Week 11)**

### 8.1 Salary Setup & Tracking

**Database Schema:**
```sql
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_type TEXT CHECK (source_type IN ('salary','hourly','freelance','investment','rental','business','other')) NOT NULL,
  employer_name TEXT,

  -- For salary/hourly
  is_primary BOOLEAN DEFAULT FALSE,
  salary_amount DECIMAL(12,2),
  salary_frequency TEXT CHECK (salary_frequency IN ('hourly','weekly','biweekly','semimonthly','monthly','annual')),
  hours_per_week DECIMAL(5,2), -- for hourly

  -- Pay schedule
  pay_day_of_week INT, -- 0-6 for weekly
  pay_dates INT[], -- [1,15] for semimonthly, [15] for monthly

  -- Tax info
  withholding_federal DECIMAL(5,2), -- percentage
  withholding_state DECIMAL(5,2),
  withholding_additional DECIMAL(10,2), -- fixed amount

  -- Benefits
  pre_tax_deductions JSONB, -- 401k, HSA, etc
  post_tax_deductions JSONB, -- Roth 401k, etc

  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paychecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  income_source_id UUID REFERENCES income_sources(id),

  pay_date DATE NOT NULL,
  pay_period_start DATE,
  pay_period_end DATE,

  -- Gross amounts
  gross_pay DECIMAL(10,2) NOT NULL,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  commission DECIMAL(10,2) DEFAULT 0,
  other_pay DECIMAL(10,2) DEFAULT 0,

  -- Pre-tax deductions
  pretax_401k DECIMAL(10,2) DEFAULT 0,
  pretax_hsa DECIMAL(10,2) DEFAULT 0,
  pretax_insurance DECIMAL(10,2) DEFAULT 0,
  pretax_other DECIMAL(10,2) DEFAULT 0,

  -- Taxes
  federal_income_tax DECIMAL(10,2) DEFAULT 0,
  state_income_tax DECIMAL(10,2) DEFAULT 0,
  social_security_tax DECIMAL(10,2) DEFAULT 0,
  medicare_tax DECIMAL(10,2) DEFAULT 0,
  ca_sdi_tax DECIMAL(10,2) DEFAULT 0, -- California SDI
  local_taxes DECIMAL(10,2) DEFAULT 0,

  -- Post-tax deductions
  roth_401k DECIMAL(10,2) DEFAULT 0,
  roth_ira DECIMAL(10,2) DEFAULT 0,
  post_tax_other DECIMAL(10,2) DEFAULT 0,

  -- Net
  net_pay DECIMAL(10,2) NOT NULL,

  -- Employer contributions (for tracking only)
  employer_401k_match DECIMAL(10,2) DEFAULT 0,
  employer_hsa_contribution DECIMAL(10,2) DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_paychecks_user_date ON paychecks(user_id, pay_date DESC);
```

### 8.2 Paycheck Entry UI

**Create:** `src/finance/pages/SalaryPage.tsx`

```tsx
<SalaryPage>
  <PageHeader>
    <Title>Salary & Income</Title>
    <QuickActions>
      <Button onClick={addPaycheck}>Record Paycheck</Button>
      <Button variant="ghost" onClick={manageIncomeSources}>
        Manage Income Sources
      </Button>
    </QuickActions>
  </PageHeader>

  {/* Current income summary */}
  <SummaryCards>
    <Card>
      <Label>Annual Salary (Gross)</Label>
      <Value>{formatCurrency(annualGross)}</Value>
      <Sublabel>Based on {primarySource.employer_name}</Sublabel>
    </Card>

    <Card>
      <Label>Effective Take-Home Rate</Label>
      <Value>{takeHomeRate}%</Value>
      <Sublabel>{formatCurrency(annualNet)} net per year</Sublabel>
    </Card>

    <Card>
      <Label>Total Tax Rate</Label>
      <Value>{effectiveTaxRate}%</Value>
      <Sublabel>
        Federal: {federalRate}% • State: {stateRate}% • Payroll: {payrollRate}%
      </Sublabel>
    </Card>

    <Card>
      <Label>Next Paycheck</Label>
      <Value>{formatCurrency(estimatedNextPaycheck)}</Value>
      <Sublabel>Expected {formatDate(nextPayDate)}</Sublabel>
    </Card>
  </SummaryCards>

  {/* Paycheck history */}
  <Card title="Paycheck History">
    <DataTable
      columns={[
        { key: 'pay_date', header: 'Date' },
        { key: 'gross_pay', header: 'Gross', render: formatCurrency },
        { key: 'total_taxes', header: 'Taxes', render: formatCurrency },
        { key: 'total_deductions', header: 'Deductions', render: formatCurrency },
        { key: 'net_pay', header: 'Net Pay', render: formatCurrency, className: 'font-bold' }
      ]}
      rows={paychecks}
      onRowClick={viewPaycheckDetails}
    />
  </Card>

  {/* YTD Summary */}
  <Grid cols={2}>
    <Card title="Year-to-Date Summary">
      <StatGrid>
        <Stat label="Gross Income" value={formatCurrency(ytd.gross)} />
        <Stat label="Federal Tax" value={formatCurrency(ytd.federal)} />
        <Stat label="State Tax" value={formatCurrency(ytd.state)} />
        <Stat label="Payroll Tax" value={formatCurrency(ytd.payroll)} />
        <Stat label="Pre-Tax Savings" value={formatCurrency(ytd.pretax)} />
        <Stat label="Net Income" value={formatCurrency(ytd.net)} />
      </StatGrid>
    </Card>

    <Card title="Pay Breakdown">
      <DonutChart
        data={[
          { label: 'Net Pay', value: ytd.net, color: '#10b981' },
          { label: 'Federal Tax', value: ytd.federal, color: '#ef4444' },
          { label: 'State Tax', value: ytd.state, color: '#f59e0b' },
          { label: 'Payroll Tax', value: ytd.payroll, color: '#ec4899' },
          { label: 'Pre-Tax Savings', value: ytd.pretax, color: '#3b82f6' }
        ]}
      />
    </Card>
  </Grid>
</SalaryPage>
```

### 8.3 Paycheck Entry Modal

```tsx
<PaycheckModal>
  <Form onSubmit={recordPaycheck}>
    {/* Auto-detect from income source or manual */}
    <Select
      label="Income Source"
      options={incomeSources}
      onChange={autoFillFromSource}
    />

    <DatePicker
      label="Pay Date"
      value={payDate}
      onChange={setPayDate}
    />

    {/* Gross section */}
    <Section title="Gross Income">
      <CurrencyInput label="Base Pay" value={grossPay} onChange={setGrossPay} />
      <CurrencyInput label="Overtime" value={overtime} optional />
      <CurrencyInput label="Bonus" value={bonus} optional />
      <CurrencyInput label="Commission" value={commission} optional />

      <Total>Gross Total: {formatCurrency(calculateGrossTotal())}</Total>
    </Section>

    {/* Pre-tax deductions */}
    <Collapsible trigger="Pre-Tax Deductions" defaultOpen>
      <CurrencyInput label="401(k)" value={pretax401k} />
      <CurrencyInput label="HSA" value={pretaxHSA} />
      <CurrencyInput label="Health Insurance" value={pretaxInsurance} />
      <CurrencyInput label="Other" value={pretaxOther} />
    </Collapsible>

    {/* Taxes */}
    <Section title="Taxes Withheld">
      <CurrencyInput label="Federal Income Tax" value={federalTax} />
      <CurrencyInput label="CA State Income Tax" value={stateTax} />
      <CurrencyInput label="Social Security" value={socialSecurity} />
      <CurrencyInput label="Medicare" value={medicare} />
      <CurrencyInput label="CA SDI" value={caSDI} />

      <Total>Total Taxes: {formatCurrency(calculateTotalTaxes())}</Total>
    </Section>

    {/* Post-tax deductions */}
    <Collapsible trigger="Post-Tax Deductions">
      <CurrencyInput label="Roth 401(k)" value={roth401k} />
      <CurrencyInput label="Other" value={postTaxOther} />
    </Collapsible>

    {/* Net pay */}
    <NetPayDisplay>
      <Label>Net Pay</Label>
      <Value>{formatCurrency(calculateNetPay())}</Value>
    </NetPayDisplay>

    <ButtonGroup>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button type="submit">Record Paycheck</Button>
    </ButtonGroup>
  </Form>
</PaycheckModal>
```

### 8.4 Auto-Import from Pay Stub (Future)

```typescript
// Use Tesseract.js (free OCR) to extract data from pay stub images
import Tesseract from 'tesseract.js';

async function extractPayStubData(imageFile: File): Promise<PaycheckData> {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');

  // Parse common pay stub formats
  const grossPay = extractAmount(text, /gross\s+pay:?\s*\$?([\d,]+\.?\d*)/i);
  const netPay = extractAmount(text, /net\s+pay:?\s*\$?([\d,]+\.?\d*)/i);
  const federalTax = extractAmount(text, /federal\s+income\s+tax:?\s*\$?([\d,]+\.?\d*)/i);
  const stateTax = extractAmount(text, /(state|ca)\s+income\s+tax:?\s*\$?([\d,]+\.?\d*)/i);
  const socialSecurity = extractAmount(text, /social\s+security:?\s*\$?([\d,]+\.?\d*)/i);
  const medicare = extractAmount(text, /medicare:?\s*\$?([\d,]+\.?\d*)/i);

  return {
    grossPay,
    netPay,
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    // User can fill in remaining fields
  };
}

function extractAmount(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}
```

---

## **Phase 9: California Tax Calculator & Optimizer (Week 12)**

### 9.1 California Tax Calculator (2025 Rates)

**Create:** `src/finance/services/tax/CaliforniaTaxCalculator.ts`

```typescript
// 2025 California state income tax brackets (example - update with actual rates)
const CA_TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 10412, rate: 0.01 },
    { min: 10412, max: 24684, rate: 0.02 },
    { min: 24684, max: 38959, rate: 0.04 },
    { min: 38959, max: 54081, rate: 0.06 },
    { min: 54081, max: 68350, rate: 0.08 },
    { min: 68350, max: 349137, rate: 0.093 },
    { min: 349137, max: 418961, rate: 0.103 },
    { min: 418961, max: 698271, rate: 0.113 },
    { min: 698271, max: Infinity, rate: 0.123 }
  ],
  married: [
    { min: 0, max: 20824, rate: 0.01 },
    { min: 20824, max: 49368, rate: 0.02 },
    { min: 49368, max: 77918, rate: 0.04 },
    { min: 77918, max: 108162, rate: 0.06 },
    { min: 108162, max: 136700, rate: 0.08 },
    { min: 136700, max: 698274, rate: 0.093 },
    { min: 698274, max: 837922, rate: 0.103 },
    { min: 837922, max: 1396542, rate: 0.113 },
    { min: 1396542, max: Infinity, rate: 0.123 }
  ],
  head_of_household: [
    { min: 0, max: 20839, rate: 0.01 },
    { min: 20839, max: 49371, rate: 0.02 },
    { min: 49371, max: 63644, rate: 0.04 },
    { min: 63644, max: 78765, rate: 0.06 },
    { min: 78765, max: 93037, rate: 0.08 },
    { min: 93037, max: 474824, rate: 0.093 },
    { min: 474824, max: 569790, rate: 0.103 },
    { min: 569790, max: 949649, rate: 0.113 },
    { min: 949649, max: Infinity, rate: 0.123 }
  ]
};

// Federal tax brackets 2025 (example)
const FEDERAL_TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ]
};

const STANDARD_DEDUCTIONS_2025 = {
  single: 14600,
  married: 29200,
  head_of_household: 21900
};

const SOCIAL_SECURITY_RATE = 0.062;
const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2025
const MEDICARE_RATE = 0.0145;
const MEDICARE_ADDITIONAL_RATE = 0.009; // For income > $200k
const MEDICARE_ADDITIONAL_THRESHOLD = 200000;
const CA_SDI_RATE = 0.009; // 2025 CA State Disability Insurance
const CA_SDI_WAGE_BASE = 153164;

interface TaxCalculation {
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;

  federalTax: number;
  stateTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  caSDI: number;

  totalTax: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;

  netIncome: number;
  takeHomeRate: number;

  breakdown: {
    bracket: string;
    amount: number;
    tax: number;
  }[];
}

class CaliforniaTaxCalculator {
  calculate(
    grossIncome: number,
    filingStatus: 'single' | 'married' | 'head_of_household',
    deductions: {
      standardDeduction?: boolean;
      itemizedDeductions?: number;
      pretax401k?: number;
      pretaxHSA?: number;
      otherPretax?: number;
    } = {}
  ): TaxCalculation {
    // Calculate AGI (Adjusted Gross Income)
    const pretaxTotal = (deductions.pretax401k || 0) +
                       (deductions.pretaxHSA || 0) +
                       (deductions.otherPretax || 0);
    const adjustedGrossIncome = grossIncome - pretaxTotal;

    // Calculate taxable income
    const totalDeductions = deductions.standardDeduction !== false
      ? STANDARD_DEDUCTIONS_2025[filingStatus]
      : (deductions.itemizedDeductions || 0);
    const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions);

    // Calculate federal tax
    const federalTax = this.calculateBracketTax(
      taxableIncome,
      FEDERAL_TAX_BRACKETS_2025[filingStatus]
    );

    // Calculate CA state tax
    const stateTax = this.calculateBracketTax(
      taxableIncome,
      CA_TAX_BRACKETS_2025[filingStatus]
    );

    // Calculate payroll taxes
    const socialSecurityTax = Math.min(
      grossIncome * SOCIAL_SECURITY_RATE,
      SOCIAL_SECURITY_WAGE_BASE * SOCIAL_SECURITY_RATE
    );

    let medicareTax = grossIncome * MEDICARE_RATE;
    if (grossIncome > MEDICARE_ADDITIONAL_THRESHOLD) {
      medicareTax += (grossIncome - MEDICARE_ADDITIONAL_THRESHOLD) * MEDICARE_ADDITIONAL_RATE;
    }

    const caSDI = Math.min(
      grossIncome * CA_SDI_RATE,
      CA_SDI_WAGE_BASE * CA_SDI_RATE
    );

    // Calculate totals
    const totalTax = federalTax + stateTax + socialSecurityTax + medicareTax + caSDI;
    const effectiveTaxRate = (totalTax / grossIncome) * 100;
    const netIncome = grossIncome - totalTax - pretaxTotal;
    const takeHomeRate = (netIncome / grossIncome) * 100;

    // Get marginal rates
    const federalMarginalRate = this.getMarginalRate(taxableIncome, FEDERAL_TAX_BRACKETS_2025[filingStatus]);
    const stateMarginalRate = this.getMarginalRate(taxableIncome, CA_TAX_BRACKETS_2025[filingStatus]);
    const marginalTaxRate = federalMarginalRate + stateMarginalRate + SOCIAL_SECURITY_RATE + MEDICARE_RATE;

    return {
      grossIncome,
      adjustedGrossIncome,
      taxableIncome,
      federalTax,
      stateTax,
      socialSecurityTax,
      medicareTax,
      caSDI,
      totalTax,
      effectiveTaxRate,
      marginalTaxRate: marginalTaxRate * 100,
      netIncome,
      takeHomeRate,
      breakdown: this.getBreakdown(taxableIncome, FEDERAL_TAX_BRACKETS_2025[filingStatus], 'Federal')
        .concat(this.getBreakdown(taxableIncome, CA_TAX_BRACKETS_2025[filingStatus], 'CA State'))
    };
  }

  private calculateBracketTax(income: number, brackets: typeof CA_TAX_BRACKETS_2025.single): number {
    let tax = 0;

    for (const bracket of brackets) {
      if (income <= bracket.min) break;

      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }

    return tax;
  }

  private getMarginalRate(income: number, brackets: typeof CA_TAX_BRACKETS_2025.single): number {
    for (const bracket of brackets) {
      if (income <= bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }

  private getBreakdown(income: number, brackets: typeof CA_TAX_BRACKETS_2025.single, label: string) {
    const breakdown = [];

    for (const bracket of brackets) {
      if (income <= bracket.min) break;

      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      const tax = taxableInBracket * bracket.rate;

      breakdown.push({
        bracket: `${label} ${bracket.rate * 100}%`,
        amount: taxableInBracket,
        tax
      });
    }

    return breakdown;
  }

  // Calculate estimated quarterly taxes for self-employed
  calculateQuarterly(annualIncome: number, filingStatus: 'single' | 'married' | 'head_of_household'): {
    quarterlyAmount: number;
    dueDate: Date[];
  } {
    const yearlyTax = this.calculate(annualIncome, filingStatus);

    // Self-employed pay both employee and employer portion
    const selfEmploymentTax = (annualIncome * 0.9235) * 0.153; // 15.3%

    const totalAnnualTax = yearlyTax.federalTax + yearlyTax.stateTax + selfEmploymentTax;
    const quarterlyAmount = totalAnnualTax / 4;

    // CA quarterly due dates
    const year = new Date().getFullYear();
    const dueDate = [
      new Date(year, 3, 15),  // April 15
      new Date(year, 5, 15),  // June 15
      new Date(year, 8, 15),  // September 15
      new Date(year + 1, 0, 15)  // January 15 (next year)
    ];

    return { quarterlyAmount, dueDate };
  }
}

export const taxCalculator = new CaliforniaTaxCalculator();
```

### 9.2 Tax Dashboard

**Create:** `src/finance/pages/TaxPage.tsx`

```tsx
<TaxPage>
  <PageHeader>
    <Title>Tax Dashboard</Title>
    <YearSelector value={selectedYear} onChange={setSelectedYear} />
  </PageHeader>

  {/* Tax Summary Cards */}
  <Grid cols={4}>
    <SummaryCard
      title="Total Tax Burden"
      value={formatCurrency(ytd.totalTax)}
      subtitle={`${ytd.effectiveTaxRate.toFixed(1)}% effective rate`}
      color="red"
    />
    <SummaryCard
      title="Federal Tax"
      value={formatCurrency(ytd.federalTax)}
      subtitle={`${ytd.federalRate.toFixed(1)}% of gross`}
      color="rose"
    />
    <SummaryCard
      title="CA State Tax"
      value={formatCurrency(ytd.stateTax)}
      subtitle={`${ytd.stateRate.toFixed(1)}% of gross`}
      color="orange"
    />
    <SummaryCard
      title="Payroll Tax"
      value={formatCurrency(ytd.payrollTax)}
      subtitle="SS + Medicare + SDI"
      color="amber"
    />
  </Grid>

  {/* Tax breakdown visualization */}
  <Grid cols={2}>
    <Card title="Where Your Money Goes">
      <WaterfallChart
        data={[
          { label: 'Gross Income', value: ytd.grossIncome, type: 'total' },
          { label: 'Federal Tax', value: -ytd.federalTax, type: 'negative' },
          { label: 'State Tax', value: -ytd.stateTax, type: 'negative' },
          { label: 'Payroll Tax', value: -ytd.payrollTax, type: 'negative' },
          { label: 'Pre-Tax Savings', value: -ytd.pretaxSavings, type: 'positive' },
          { label: 'Net Income', value: ytd.netIncome, type: 'total' }
        ]}
      />
    </Card>

    <Card title="Marginal vs Effective Rate">
      <div className="space-y-4">
        <RateComparison>
          <Label>Marginal Tax Rate</Label>
          <Value>{ytd.marginalRate.toFixed(1)}%</Value>
          <Description>
            Rate on next dollar earned
          </Description>
          <ProgressBar value={ytd.marginalRate} max={50} color="rose" />
        </RateComparison>

        <RateComparison>
          <Label>Effective Tax Rate</Label>
          <Value>{ytd.effectiveTaxRate.toFixed(1)}%</Value>
          <Description>
            Overall tax burden
          </Description>
          <ProgressBar value={ytd.effectiveTaxRate} max={50} color="amber" />
        </RateComparison>
      </div>
    </Card>
  </Grid>

  {/* Monthly tax trend */}
  <Card title="Tax Payments Over Time">
    <StackedBarChart
      data={monthlyTaxData}
      bars={[
        { key: 'federal', label: 'Federal', color: '#ef4444' },
        { key: 'state', label: 'State', color: '#f97316' },
        { key: 'payroll', label: 'Payroll', color: '#f59e0b' }
      ]}
    />
  </Card>

  {/* Tax bracket breakdown */}
  <Grid cols={2}>
    <Card title="Federal Tax Brackets">
      <BracketBreakdown brackets={federalBreakdown} />
    </Card>

    <Card title="CA State Tax Brackets">
      <BracketBreakdown brackets={stateBreakdown} />
    </Card>
  </Grid>

  {/* Tax documents */}
  <Card title="Tax Documents">
    <DocumentList>
      <DocumentRow
        name="Form W-2"
        year={selectedYear}
        status={w2Available ? 'ready' : 'pending'}
        onDownload={downloadW2}
      />
      <DocumentRow
        name="Tax Summary Report"
        year={selectedYear}
        status="ready"
        onGenerate={generateTaxSummary}
      />
    </DocumentList>
  </Card>
</TaxPage>
```

### 9.3 California Tax Optimizer

**Create:** `src/finance/services/tax/TaxOptimizer.ts`

```typescript
interface TaxSavingStrategy {
  id: string;
  title: string;
  description: string;
  category: 'deductions' | 'credits' | 'retirement' | 'health' | 'other';
  estimatedSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  actionable: boolean;
  steps: string[];
  deadline?: string;
  links: { label: string; url: string }[];
}

class CaliforniaTaxOptimizer {
  generateStrategies(
    income: number,
    currentDeductions: any,
    filingStatus: 'single' | 'married' | 'head_of_household'
  ): TaxSavingStrategy[] {
    const strategies: TaxSavingStrategy[] = [];
    const currentTax = taxCalculator.calculate(income, filingStatus, currentDeductions);

    // 1. Maximize 401(k) contributions
    const current401k = currentDeductions.pretax401k || 0;
    const max401k = 23000; // 2025 limit
    if (current401k < max401k) {
      const additional = Math.min(max401k - current401k, income * 0.15); // Suggest 15% of income
      const newTax = taxCalculator.calculate(income, filingStatus, {
        ...currentDeductions,
        pretax401k: current401k + additional
      });
      const savings = currentTax.totalTax - newTax.totalTax;

      strategies.push({
        id: '401k-max',
        title: 'Maximize 401(k) Contributions',
        description: `Increase your 401(k) contribution to save ${formatCurrency(savings)} in taxes while building retirement savings.`,
        category: 'retirement',
        estimatedSavings: savings,
        difficulty: 'easy',
        actionable: true,
        steps: [
          'Log into your employer\'s 401(k) portal',
          `Increase contribution to $${(additional / 12).toFixed(0)}/month`,
          'Verify change in next paycheck'
        ],
        deadline: 'December 31',
        links: [
          { label: 'IRS 401(k) Limits', url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits' }
        ]
      });
    }

    // 2. HSA contributions
    if (!currentDeductions.pretaxHSA) {
      const maxHSA = filingStatus === 'married' ? 8300 : 4150; // 2025 family/individual
      const suggestedHSA = Math.min(maxHSA, income * 0.05);
      const newTax = taxCalculator.calculate(income, filingStatus, {
        ...currentDeductions,
        pretaxHSA: suggestedHSA
      });
      const savings = currentTax.totalTax - newTax.totalTax;

      strategies.push({
        id: 'hsa',
        title: 'Open a Health Savings Account (HSA)',
        description: `HSA contributions are triple tax-advantaged: tax-deductible, grow tax-free, and withdrawals for medical expenses are tax-free. Save ${formatCurrency(savings)}/year.`,
        category: 'health',
        estimatedSavings: savings,
        difficulty: 'medium',
        actionable: true,
        steps: [
          'Verify you have a High Deductible Health Plan (HDHP)',
          'Open HSA through your employer or bank',
          `Contribute $${(suggestedHSA / 12).toFixed(0)}/month`,
          'Use for qualified medical expenses'
        ],
        deadline: 'April 15 (for prior year)',
        links: [
          { label: 'HSA Eligibility', url: 'https://www.irs.gov/publications/p969' },
          { label: 'Compare HSA providers', url: 'https://www.hsasearch.com/' }
        ]
      });
    }

    // 3. CA-specific: Mortgage interest deduction
    if (filingStatus !== 'single' && !currentDeductions.itemizedDeductions) {
      const estimatedMortgageInterest = 15000; // Example
      if (estimatedMortgageInterest > STANDARD_DEDUCTIONS_2025[filingStatus]) {
        const newTax = taxCalculator.calculate(income, filingStatus, {
          ...currentDeductions,
          standardDeduction: false,
          itemizedDeductions: estimatedMortgageInterest
        });
        const savings = currentTax.totalTax - newTax.totalTax;

        strategies.push({
          id: 'itemize-mortgage',
          title: 'Itemize Deductions for Mortgage Interest',
          description: `If you own a home, itemizing deductions for mortgage interest could save ${formatCurrency(savings)}.`,
          category: 'deductions',
          estimatedSavings: savings,
          difficulty: 'medium',
          actionable: true,
          steps: [
            'Get Form 1098 from your mortgage lender',
            'Track other itemizable deductions (property tax, charity)',
            'Use Schedule A when filing taxes',
            'Compare itemized vs standard deduction'
          ],
          deadline: 'Tax filing deadline (April 15)',
          links: [
            { label: 'IRS Schedule A', url: 'https://www.irs.gov/forms-pubs/about-schedule-a-form-1040' },
            { label: 'CA Itemized Deductions', url: 'https://www.ftb.ca.gov/forms/2023/2023-540-scha.html' }
          ]
        });
      }
    }

    // 4. CA-specific: Earned Income Tax Credit (EITC)
    if (income < 63398 && (filingStatus === 'married' || filingStatus === 'head_of_household')) {
      strategies.push({
        id: 'ca-eitc',
        title: 'Claim California Earned Income Tax Credit',
        description: 'California offers EITC for low-to-moderate income workers. This is a refundable credit that reduces tax owed.',
        category: 'credits',
        estimatedSavings: 3000, // Estimate, varies by income
        difficulty: 'easy',
        actionable: true,
        steps: [
          'Check eligibility at ftb.ca.gov',
          'Claim on CA tax return (Schedule CA 3514)',
          'May also qualify for federal EITC'
        ],
        deadline: 'Tax filing deadline',
        links: [
          { label: 'CA EITC Calculator', url: 'https://www.ftb.ca.gov/file/personal/credits/california-earned-income-tax-credit.html' }
        ]
      });
    }

    // 5. CA-specific: Child and Dependent Care Credit
    if (filingStatus !== 'single') {
      strategies.push({
        id: 'ca-childcare-credit',
        title: 'Child and Dependent Care Credit',
        description: 'California offers a credit for child and dependent care expenses to allow you to work.',
        category: 'credits',
        estimatedSavings: 1000, // Estimate
        difficulty: 'easy',
        actionable: true,
        steps: [
          'Track childcare expenses throughout the year',
          'Get provider\'s EIN or SSN',
          'Claim on CA Form 3506',
          'Also claim federal credit (Form 2441)'
        ],
        deadline: 'Tax filing deadline',
        links: [
          { label: 'CA Form 3506', url: 'https://www.ftb.ca.gov/forms/2023/2023-3506.html' }
        ]
      });
    }

    // 6. Charitable donations
    strategies.push({
      id: 'charitable-donations',
      title: 'Donate to Charity (Strategically)',
      description: 'Donate appreciated assets (stocks) instead of cash to avoid capital gains tax and get full deduction.',
      category: 'deductions',
      estimatedSavings: income * 0.02 * currentTax.marginalTaxRate / 100, // Assume 2% of income
      difficulty: 'medium',
      actionable: true,
      steps: [
        'Identify appreciated stocks (held >1 year)',
        'Donate through donor-advised fund or directly to charity',
        'Avoid selling (no capital gains tax)',
        'Deduct full market value',
        'Keep donation receipts'
      ],
      deadline: 'December 31',
      links: [
        { label: 'Donor-Advised Funds', url: 'https://www.fidelitycharitable.org/' },
        { label: 'IRS Charitable Deductions', url: 'https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contribution-deductions' }
      ]
    });

    // 7. CA-specific: 529 College Savings
    strategies.push({
      id: 'ca-529',
      title: 'Contribute to CA 529 College Savings Plan (ScholarShare 529)',
      description: 'While CA doesn\'t offer state tax deduction, earnings grow tax-free and withdrawals for education are tax-free.',
      category: 'other',
      estimatedSavings: 500, // Future savings, not immediate
      difficulty: 'easy',
      actionable: true,
      steps: [
        'Open ScholarShare 529 account',
        'Set up automatic contributions',
        'Use for qualified education expenses',
        'Earnings grow tax-free'
      ],
      links: [
        { label: 'ScholarShare 529', url: 'https://www.scholarshare529.com/' }
      ]
    });

    // 8. Backdoor Roth IRA (for high earners)
    if (income > 161000) { // 2025 Roth IRA phase-out for single
      strategies.push({
        id: 'backdoor-roth',
        title: 'Backdoor Roth IRA Contribution',
        description: 'Income too high for direct Roth IRA? Use backdoor strategy to contribute $7,000/year tax-free growth.',
        category: 'retirement',
        estimatedSavings: 2000, // Long-term savings
        difficulty: 'hard',
        actionable: true,
        steps: [
          'Contribute $7,000 to traditional IRA (non-deductible)',
          'Immediately convert to Roth IRA',
          'Pay tax on earnings during conversion (minimal if immediate)',
          'File Form 8606 with tax return',
          'Consult tax professional if you have existing IRA balances'
        ],
        deadline: 'April 15 (for prior year)',
        links: [
          { label: 'Backdoor Roth Guide', url: 'https://www.whitecoatinvestor.com/backdoor-roth-ira-tutorial/' },
          { label: 'Form 8606', url: 'https://www.irs.gov/forms-pubs/about-form-8606' }
        ]
      });
    }

    // 9. Mega Backdoor Roth (if employer plan allows)
    strategies.push({
      id: 'mega-backdoor-roth',
      title: 'Mega Backdoor Roth (Advanced)',
      description: 'Contribute up to $46,000 to after-tax 401(k) and convert to Roth. Check if your employer plan allows.',
      category: 'retirement',
      estimatedSavings: 5000, // Long-term
      difficulty: 'hard',
      actionable: false,
      steps: [
        'Verify your 401(k) plan allows after-tax contributions',
        'Verify plan allows in-service conversions to Roth',
        'Max out regular 401(k) first ($23,000)',
        'Contribute to after-tax 401(k) (up to $69,000 total limit)',
        'Convert to Roth 401(k) or Roth IRA',
        'Consult with HR and tax professional'
      ],
      links: [
        { label: 'Mega Backdoor Roth Guide', url: 'https://www.madfientist.com/after-tax-contributions/' }
      ]
    });

    // 10. CA-specific: Energy-efficient home improvements
    strategies.push({
      id: 'energy-credit',
      title: 'Federal Tax Credit for Energy-Efficient Home Improvements',
      description: 'Get up to 30% credit for solar panels, heat pumps, insulation, and more (federal credit).',
      category: 'credits',
      estimatedSavings: 2000, // Example for solar
      difficulty: 'hard',
      actionable: true,
      steps: [
        'Identify eligible improvements (solar, heat pump, insulation)',
        'Get quotes from certified installers',
        'Complete installation',
        'Claim credit on Form 5695',
        'Up to 30% of cost (no cap for solar)'
      ],
      deadline: 'End of year for installation',
      links: [
        { label: 'Energy Star Tax Credits', url: 'https://www.energystar.gov/about/federal_tax_credits' },
        { label: 'IRS Form 5695', url: 'https://www.irs.gov/forms-pubs/about-form-5695' }
      ]
    });

    return strategies.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }
}

export const taxOptimizer = new CaliforniaTaxOptimizer();
```

### 9.4 Tax Optimizer UI

```tsx
<TaxOptimizerPage>
  <PageHeader>
    <Title>Tax Savings Strategies</Title>
    <Subtitle>Personalized recommendations to reduce your California tax burden</Subtitle>
  </PageHeader>

  {/* Total potential savings */}
  <HeroCard>
    <Label>Potential Annual Tax Savings</Label>
    <Value>{formatCurrency(totalPotentialSavings)}</Value>
    <Description>
      Based on {strategies.length} strategies tailored to your income and situation
    </Description>
  </HeroCard>

  {/* Filter strategies */}
  <FilterBar>
    <Select
      label="Category"
      options={['All', 'Retirement', 'Deductions', 'Credits', 'Health', 'Other']}
      value={categoryFilter}
      onChange={setCategoryFilter}
    />
    <Select
      label="Difficulty"
      options={['All', 'Easy', 'Medium', 'Hard']}
      value={difficultyFilter}
      onChange={setDifficultyFilter}
    />
    <Toggle
      label="Actionable only"
      checked={showActionableOnly}
      onChange={setShowActionableOnly}
    />
  </FilterBar>

  {/* Strategy cards */}
  <StrategiesGrid>
    {filteredStrategies.map(strategy => (
      <StrategyCard key={strategy.id}>
        <CardHeader>
          <Badge category={strategy.category} />
          <DifficultyBadge level={strategy.difficulty} />
        </CardHeader>

        <CardTitle>{strategy.title}</CardTitle>
        <CardDescription>{strategy.description}</CardDescription>

        <SavingsHighlight>
          Save {formatCurrency(strategy.estimatedSavings)}/year
        </SavingsHighlight>

        {strategy.deadline && (
          <Deadline>
            ⏰ Deadline: {strategy.deadline}
          </Deadline>
        )}

        {strategy.actionable && (
          <Collapsible trigger="How to do this">
            <StepsList>
              {strategy.steps.map((step, i) => (
                <Step key={i}>
                  <StepNumber>{i + 1}</StepNumber>
                  <StepText>{step}</StepText>
                </Step>
              ))}
            </StepsList>
          </Collapsible>
        )}

        <ResourceLinks>
          {strategy.links.map(link => (
            <ExternalLink href={link.url} target="_blank">
              {link.label} ↗
            </ExternalLink>
          ))}
        </ResourceLinks>

        <CardActions>
          <Button onClick={() => markCompleted(strategy.id)}>
            {completed.includes(strategy.id) ? '✓ Completed' : 'Mark as Done'}
          </Button>
          <Button variant="ghost" onClick={() => dismissStrategy(strategy.id)}>
            Not for me
          </Button>
        </CardActions>
      </StrategyCard>
    ))}
  </StrategiesGrid>

  {/* Tax calculator tool */}
  <Card title="Tax Calculator">
    <TaxCalculatorForm>
      <CurrencyInput
        label="Annual Gross Income"
        value={income}
        onChange={setIncome}
      />
      <Select
        label="Filing Status"
        options={['Single', 'Married Filing Jointly', 'Head of Household']}
        value={filingStatus}
        onChange={setFilingStatus}
      />
      <CurrencyInput
        label="401(k) Contributions"
        value={pretax401k}
        onChange={setPretax401k}
      />
      <CurrencyInput
        label="HSA Contributions"
        value={pretaxHSA}
        onChange={setPretaxHSA}
      />

      <Button onClick={calculateTax}>Calculate</Button>
    </TaxCalculatorForm>

    {taxResult && (
      <TaxResultDisplay>
        <ResultRow>
          <Label>Federal Tax</Label>
          <Value>{formatCurrency(taxResult.federalTax)}</Value>
        </ResultRow>
        <ResultRow>
          <Label>CA State Tax</Label>
          <Value>{formatCurrency(taxResult.stateTax)}</Value>
        </ResultRow>
        <ResultRow>
          <Label>Payroll Tax</Label>
          <Value>{formatCurrency(taxResult.socialSecurityTax + taxResult.medicareTax + taxResult.caSDI)}</Value>
        </ResultRow>
        <Divider />
        <ResultRow className="font-bold">
          <Label>Total Tax</Label>
          <Value>{formatCurrency(taxResult.totalTax)}</Value>
        </ResultRow>
        <ResultRow>
          <Label>Effective Rate</Label>
          <Value>{taxResult.effectiveTaxRate.toFixed(1)}%</Value>
        </ResultRow>
        <ResultRow>
          <Label>Marginal Rate</Label>
          <Value>{taxResult.marginalTaxRate.toFixed(1)}%</Value>
        </ResultRow>
        <ResultRow className="text-lg">
          <Label>Take-Home Pay</Label>
          <Value className="text-emerald-600">{formatCurrency(taxResult.netIncome)}</Value>
        </ResultRow>
      </TaxResultDisplay>
    )}
  </Card>
</TaxOptimizerPage>
```

---

## Integration with Existing Finance Module

### Dashboard Widget

Add tax summary to main dashboard:

```tsx
<Card title="Tax Summary (YTD)">
  <Grid cols={2}>
    <Stat
      label="Total Tax Paid"
      value={formatCurrency(ytdTax)}
      change={vsLastYear}
    />
    <Stat
      label="Effective Rate"
      value={`${effectiveRate}%`}
    />
  </Grid>

  <ProgressBar
    label="Tax savings strategies implemented"
    value={completedStrategies}
    max={totalStrategies}
  />

  <Link to="/finance/tax">View Tax Dashboard →</Link>
</Card>
```

### Salary Integration with Calendar

Auto-create payday calendar events:

```typescript
// When paycheck recorded, create calendar event
async function recordPaycheck(paycheck: Paycheck) {
  await supabase.from('paychecks').insert(paycheck);

  // Create calendar event
  await createCalendarEvent({
    title: `💰 Paycheck: ${formatCurrency(paycheck.netPay)}`,
    date: paycheck.payDate,
    allDay: false,
    time: '00:01',
    category: 'income',
    color: 'green',
    notes: `Gross: ${formatCurrency(paycheck.grossPay)} | Taxes: ${formatCurrency(paycheck.totalTaxes())}`
  });
}
```

### Tax Deadline Reminders

```typescript
const TAX_DEADLINES = [
  { date: '01-15', title: 'Q4 Estimated Tax Payment Due', type: 'quarterly' },
  { date: '04-15', title: 'File Federal & CA Tax Returns', type: 'annual' },
  { date: '04-15', title: 'Q1 Estimated Tax Payment Due', type: 'quarterly' },
  { date: '06-15', title: 'Q2 Estimated Tax Payment Due', type: 'quarterly' },
  { date: '09-15', title: 'Q3 Estimated Tax Payment Due', type: 'quarterly' },
  { date: '10-15', title: 'File Extension Tax Returns', type: 'extension' }
];

// Create calendar events and todos
async function setupTaxDeadlines(year: number) {
  for (const deadline of TAX_DEADLINES) {
    const [month, day] = deadline.date.split('-');
    const date = new Date(year, parseInt(month) - 1, parseInt(day));

    // Calendar event
    await createCalendarEvent({
      title: `📋 ${deadline.title}`,
      date,
      allDay: true,
      category: 'tax',
      color: 'red'
    });

    // Todo 7 days before
    await createTodo({
      title: deadline.title,
      dueDate: subDays(date, 7),
      category: 'finance',
      priority: 'high'
    });
  }
}
```

---

## Summary

**What We Added:**

1. **Salary Tracking:**
   - Multiple income sources
   - Detailed paycheck recording
   - YTD summaries
   - Automatic payday calendar events

2. **Tax Calculations:**
   - 2025 federal & CA tax brackets
   - Payroll taxes (SS, Medicare, CA SDI)
   - Marginal vs effective rates
   - Quarterly estimated tax calculator

3. **Tax Visualizations:**
   - Tax burden breakdown
   - Waterfall charts
   - Monthly tax trends
   - Bracket visualizations

4. **CA Tax Optimization:**
   - 10+ personalized strategies
   - Estimated savings calculations
   - Step-by-step instructions
   - Resource links

5. **Zero-Cost Implementation:**
   - All calculations local
   - No tax API required
   - Open-source algorithms
   - Free tools (jsPDF, Recharts)

**Total Development Time:** +2 weeks (Weeks 11-12)

**Ongoing Costs:** $0 (all local calculations)

**User Value:** High - tax savings strategies alone could save users $1000s/year
