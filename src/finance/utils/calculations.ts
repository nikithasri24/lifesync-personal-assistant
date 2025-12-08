/**
 * Financial Calculations Utilities
 * Comprehensive financial formulas and calculations
 */

/**
 * ============================================================================
 * CORE METRICS
 * ============================================================================
 */

export interface NetWorthCalculation {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    liquidAssets: number;
    investments: number;
    realEstate: number;
    otherAssets: number;
    shortTermDebt: number;
    longTermDebt: number;
  };
}

/**
 * Calculate net worth from accounts
 */
export function calculateNetWorth(accounts: Array<{
  balance: number;
  type?: string;
  liability?: boolean;
}>): NetWorthCalculation {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let liquidAssets = 0;
  let investments = 0;
  let realEstate = 0;
  let otherAssets = 0;
  let shortTermDebt = 0;
  let longTermDebt = 0;

  accounts.forEach(account => {
    const balance = account.balance ?? 0;
    const type = (account.type ?? '').toLowerCase();
    const isLiability = account.liability ?? false;

    // Handle liabilities (credit cards, loans)
    if (isLiability) {
      const debtAmount = balance;
      if (type === 'credit') {
        shortTermDebt += debtAmount;
      } else {
        longTermDebt += debtAmount;
      }
      totalLiabilities += debtAmount;
    } else {
      // Assets
      if (['checking', 'savings', 'cash'].includes(type)) {
        liquidAssets += balance;
        totalAssets += balance;
      } else if (['investment', 'brokerage', 'retirement', '401k', 'ira', 'roth'].includes(type)) {
        investments += balance;
        totalAssets += balance;
      } else if (type === 'real_estate' || type === 'property') {
        realEstate += balance;
        totalAssets += balance;
      } else if (balance > 0) {
        otherAssets += balance;
        totalAssets += balance;
      }
    }
  });

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    breakdown: {
      liquidAssets,
      investments,
      realEstate,
      otherAssets,
      shortTermDebt,
      longTermDebt,
    },
  };
}

/**
 * Calculate savings rate
 * Formula: (Income - Expenses) / Income * 100
 */
export function calculateSavingsRate(
  income: number,
  expenses: number
): {
  savingsRate: number;
  monthlySavings: number;
  annualSavings: number;
  interpretation: string;
} {
  if (income <= 0) {
    return {
      savingsRate: 0,
      monthlySavings: 0,
      annualSavings: 0,
      interpretation: 'No income data',
    };
  }

  const monthlySavings = income - expenses;
  const savingsRate = (monthlySavings / income) * 100;
  const annualSavings = monthlySavings * 12;

  let interpretation = '';
  if (savingsRate < 0) {
    interpretation = 'Spending more than earning - urgent action needed';
  } else if (savingsRate < 10) {
    interpretation = 'Below recommended - aim for at least 10-15%';
  } else if (savingsRate < 20) {
    interpretation = 'Good - standard retirement planning range';
  } else if (savingsRate < 30) {
    interpretation = 'Excellent - early retirement possible';
  } else if (savingsRate < 50) {
    interpretation = 'Outstanding - fast track to financial independence';
  } else {
    interpretation = 'FIRE territory - financial independence in 10-20 years';
  }

  return {
    savingsRate,
    monthlySavings,
    annualSavings,
    interpretation,
  };
}

/**
 * Calculate Debt-to-Income ratio
 * Formula: Total Monthly Debt Payments / Gross Monthly Income * 100
 */
export function calculateDebtToIncome(
  monthlyDebtPayments: number,
  grossMonthlyIncome: number
): {
  dti: number;
  interpretation: string;
  lendingCapacity: string;
} {
  if (grossMonthlyIncome <= 0) {
    return {
      dti: 0,
      interpretation: 'No income data',
      lendingCapacity: 'Unable to assess',
    };
  }

  const dti = (monthlyDebtPayments / grossMonthlyIncome) * 100;

  let interpretation = '';
  let lendingCapacity = '';

  if (dti < 36) {
    interpretation = 'Good - healthy debt level';
    lendingCapacity = 'Can qualify for most loans';
  } else if (dti < 43) {
    interpretation = 'Manageable - but limited borrowing capacity';
    lendingCapacity = 'May qualify for some loans';
  } else if (dti < 50) {
    interpretation = 'High - difficult to get approved for new debt';
    lendingCapacity = 'Limited loan options';
  } else {
    interpretation = 'Very high - serious financial stress';
    lendingCapacity = 'Unlikely to qualify for loans';
  }

  return {
    dti,
    interpretation,
    lendingCapacity,
  };
}

/**
 * Calculate emergency fund coverage
 * Formula: Emergency Fund Balance / Average Monthly Expenses
 */
export function calculateEmergencyFund(
  emergencyFundBalance: number,
  averageMonthlyExpenses: number
): {
  monthsCovered: number;
  interpretation: string;
  recommended: number;
  shortfall: number;
} {
  if (averageMonthlyExpenses <= 0) {
    return {
      monthsCovered: 0,
      interpretation: 'Unable to calculate',
      recommended: 0,
      shortfall: 0,
    };
  }

  const monthsCovered = emergencyFundBalance / averageMonthlyExpenses;
  const recommended = averageMonthlyExpenses * 6; // 6 months recommended
  const shortfall = Math.max(0, recommended - emergencyFundBalance);

  let interpretation = '';
  if (monthsCovered < 1) {
    interpretation = 'Critical - less than 1 month of expenses';
  } else if (monthsCovered < 3) {
    interpretation = 'At risk - below minimum recommended (3 months)';
  } else if (monthsCovered < 6) {
    interpretation = 'Fair - meeting minimum, aim for 6 months';
  } else if (monthsCovered < 12) {
    interpretation = 'Good - well protected for most emergencies';
  } else {
    interpretation = 'Excellent - very secure emergency cushion';
  }

  return {
    monthsCovered,
    interpretation,
    recommended,
    shortfall,
  };
}

/**
 * ============================================================================
 * INVESTMENT CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate compound interest / future value
 * Formula: FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]
 */
export function calculateCompoundInterest(
  presentValue: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number
): {
  futureValue: number;
  totalContributed: number;
  totalGains: number;
  yearByYear: Array<{
    year: number;
    balance: number;
    contributions: number;
    gains: number;
  }>;
} {
  const monthlyRate = annualReturnRate / 12 / 100;
  const _months = years * 12;

  const yearByYear: Array<{
    year: number;
    balance: number;
    contributions: number;
    gains: number;
  }> = [];

  let balance = presentValue;
  let totalContributed = presentValue;

  for (let year = 1; year <= years; year++) {
    const startBalance = balance;
    const _startContributions = totalContributed;

    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
    }

    const yearContributions = monthlyContribution * 12;
    const _yearGains = balance - startBalance - yearContributions;

    yearByYear.push({
      year,
      balance,
      contributions: totalContributed,
      gains: balance - totalContributed,
    });
  }

  const futureValue = balance;
  const totalGains = futureValue - totalContributed;

  return {
    futureValue,
    totalContributed,
    totalGains,
    yearByYear,
  };
}

/**
 * Rule of 72 - Years to double investment
 * Formula: 72 / Annual Return Rate = Years to Double
 */
export function ruleOf72(annualReturnRate: number): {
  yearsToDouble: number;
  doublings: Array<{ years: number; multiplier: number }>;
} {
  if (annualReturnRate <= 0) {
    return {
      yearsToDouble: Infinity,
      doublings: [],
    };
  }

  const yearsToDouble = 72 / annualReturnRate;

  const doublings = [];
  for (let i = 1; i <= 5; i++) {
    doublings.push({
      years: yearsToDouble * i,
      multiplier: Math.pow(2, i),
    });
  }

  return {
    yearsToDouble,
    doublings,
  };
}

/**
 * Calculate real rate of return (inflation-adjusted)
 * Formula: [(1 + Nominal) / (1 + Inflation)] - 1
 */
export function calculateRealReturn(
  nominalReturn: number,
  inflationRate: number
): {
  realReturn: number;
  interpretation: string;
} {
  const realReturn = ((1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1) * 100;

  let interpretation = '';
  if (realReturn < 0) {
    interpretation = 'Losing purchasing power - returns not beating inflation';
  } else if (realReturn < 2) {
    interpretation = 'Barely beating inflation - consider higher-growth investments';
  } else if (realReturn < 5) {
    interpretation = 'Moderate real growth - reasonable for conservative portfolios';
  } else {
    interpretation = 'Strong real growth - portfolio growing faster than inflation';
  }

  return {
    realReturn,
    interpretation,
  };
}

/**
 * ============================================================================
 * RETIREMENT CALCULATIONS
 * ============================================================================
 */

/**
 * 4% Rule - Safe withdrawal rate
 * Formula: Portfolio Value × 4% = Annual Safe Withdrawal
 */
export function calculate4PercentRule(portfolioValue: number): {
  annualWithdrawal: number;
  monthlyWithdrawal: number;
  requiredForExpenses: (annualExpenses: number) => number;
} {
  const annualWithdrawal = portfolioValue * 0.04;
  const monthlyWithdrawal = annualWithdrawal / 12;

  const requiredForExpenses = (annualExpenses: number): number => {
    return annualExpenses / 0.04;
  };

  return {
    annualWithdrawal,
    monthlyWithdrawal,
    requiredForExpenses,
  };
}

/**
 * Calculate years to financial independence
 * Simplified formula based on savings rate
 */
export function calculateYearsToFI(
  savingsRate: number,
  currentNetWorth: number = 0,
  annualExpenses: number = 0,
  realReturnRate: number = 5
): {
  yearsToFI: number;
  targetNetWorth: number;
  currentProgress: number;
  interpretation: string;
} {
  if (savingsRate <= 0) {
    return {
      yearsToFI: Infinity,
      targetNetWorth: annualExpenses * 25,
      currentProgress: 0,
      interpretation: 'Cannot achieve FI without positive savings rate',
    };
  }

  // Target net worth using 4% rule (25x annual expenses)
  const targetNetWorth = annualExpenses * 25;

  // Simplified calculation based on savings rate
  // At 50% savings rate, you save 1 year of expenses per year worked
  // With investment returns, this accelerates
  const savingsRateDecimal = savingsRate / 100;

  // Approximate years to FI based on savings rate
  // Formula: log(1 + (savingsRate * 25)) / log(1 + realReturn)
  let yearsToFI: number;
  if (savingsRateDecimal >= 1) {
    yearsToFI = 0; // Already there
  } else {
    const numerator = Math.log(1 + (savingsRateDecimal * 25));
    const denominator = Math.log(1 + realReturnRate / 100);
    yearsToFI = numerator / denominator;
  }

  const currentProgress = targetNetWorth > 0
    ? (currentNetWorth / targetNetWorth) * 100
    : 0;

  let interpretation = '';
  if (yearsToFI < 10) {
    interpretation = 'On track for financial independence within a decade!';
  } else if (yearsToFI < 20) {
    interpretation = 'Good progress toward financial independence';
  } else if (yearsToFI < 30) {
    interpretation = 'Standard retirement timeline';
  } else {
    interpretation = 'Consider increasing savings rate to accelerate FI';
  }

  return {
    yearsToFI,
    targetNetWorth,
    currentProgress,
    interpretation,
  };
}

/**
 * Calculate required monthly savings for a goal
 * Formula: PMT = FV × [r / ((1 + r)^n - 1)]
 */
export function calculateRequiredSavings(
  goalAmount: number,
  currentSavings: number,
  years: number,
  annualReturnRate: number
): {
  requiredMonthlySavings: number;
  totalContributions: number;
  totalGrowth: number;
  onTrack: boolean;
} {
  const remainingAmount = goalAmount - currentSavings;
  const monthlyRate = annualReturnRate / 12 / 100;
  const months = years * 12;

  let requiredMonthlySavings = 0;

  if (monthlyRate === 0) {
    // No growth scenario
    requiredMonthlySavings = remainingAmount / months;
  } else {
    // With growth
    requiredMonthlySavings = remainingAmount * (monthlyRate / (Math.pow(1 + monthlyRate, months) - 1));
  }

  // Calculate future value of current savings
  const _futureValueOfCurrent = currentSavings * Math.pow(1 + annualReturnRate / 100, years);

  const totalContributions = requiredMonthlySavings * months;
  const totalGrowth = goalAmount - currentSavings - totalContributions;

  return {
    requiredMonthlySavings,
    totalContributions,
    totalGrowth,
    onTrack: requiredMonthlySavings > 0,
  };
}

/**
 * Retirement savings multiplier by age
 */
export function calculateRetirementMultiplier(
  age: number,
  currentSavings: number,
  annualSalary: number
): {
  currentMultiplier: number;
  targetMultiplier: number;
  onTrack: boolean;
  gap: number;
  interpretation: string;
} {
  // Standard multipliers by age
  const multipliers: { [key: number]: number } = {
    30: 1,
    35: 2,
    40: 3,
    45: 4,
    50: 6,
    55: 7,
    60: 8,
    67: 10,
  };

  // Find closest age bracket
  let targetMultiplier = 0;
  const ages = Object.keys(multipliers).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < ages.length; i++) {
    if (age <= ages[i]) {
      targetMultiplier = multipliers[ages[i]];
      break;
    }
  }

  if (targetMultiplier === 0 && age > 67) {
    targetMultiplier = 10;
  }

  const currentMultiplier = annualSalary > 0 ? currentSavings / annualSalary : 0;
  const gap = (targetMultiplier * annualSalary) - currentSavings;
  const onTrack = currentMultiplier >= targetMultiplier;

  let interpretation = '';
  if (onTrack) {
    interpretation = `On track! You have ${currentMultiplier.toFixed(1)}× your salary saved.`;
  } else {
    interpretation = `Behind target. Need ${gap.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} more to reach ${targetMultiplier}× salary goal.`;
  }

  return {
    currentMultiplier,
    targetMultiplier,
    onTrack,
    gap,
    interpretation,
  };
}

/**
 * ============================================================================
 * DEBT CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate credit card interest and payoff time
 */
export function calculateCreditCardPayoff(
  balance: number,
  apr: number,
  monthlyPayment: number
): {
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  comparison: {
    minimumOnly: { months: number; interest: number };
    doubled: { months: number; interest: number };
    savings: { months: number; interest: number };
  };
} {
  if (balance <= 0 || monthlyPayment <= 0) {
    return {
      monthsToPayoff: 0,
      totalInterest: 0,
      totalPaid: 0,
      comparison: {
        minimumOnly: { months: 0, interest: 0 },
        doubled: { months: 0, interest: 0 },
        savings: { months: 0, interest: 0 },
      },
    };
  }

  const monthlyRate = apr / 12 / 100;
  const minimumPayment = Math.max(25, balance * 0.02); // 2% or $25 minimum

  // Calculate with given payment
  let remainingBalance = balance;
  let totalInterest = 0;
  let months = 0;

  while (remainingBalance > 0 && months < 600) { // Cap at 50 years
    const interestCharge = remainingBalance * monthlyRate;
    totalInterest += interestCharge;
    remainingBalance = remainingBalance + interestCharge - monthlyPayment;
    months++;

    if (remainingBalance < monthlyPayment) {
      remainingBalance = 0;
      break;
    }
  }

  const monthsToPayoff = months;
  const totalPaid = balance + totalInterest;

  // Calculate with minimum payment only
  remainingBalance = balance;
  let minimumInterest = 0;
  let minimumMonths = 0;

  while (remainingBalance > 0 && minimumMonths < 600) {
    const interestCharge = remainingBalance * monthlyRate;
    minimumInterest += interestCharge;
    const payment = Math.max(minimumPayment, remainingBalance + interestCharge);
    remainingBalance = remainingBalance + interestCharge - payment;
    minimumMonths++;

    if (remainingBalance < payment) {
      remainingBalance = 0;
      break;
    }
  }

  // Calculate with doubled payment
  remainingBalance = balance;
  let doubledInterest = 0;
  let doubledMonths = 0;
  const doubledPayment = monthlyPayment * 2;

  while (remainingBalance > 0 && doubledMonths < 600) {
    const interestCharge = remainingBalance * monthlyRate;
    doubledInterest += interestCharge;
    remainingBalance = remainingBalance + interestCharge - doubledPayment;
    doubledMonths++;

    if (remainingBalance < doubledPayment) {
      remainingBalance = 0;
      break;
    }
  }

  return {
    monthsToPayoff,
    totalInterest,
    totalPaid,
    comparison: {
      minimumOnly: { months: minimumMonths, interest: minimumInterest },
      doubled: { months: doubledMonths, interest: doubledInterest },
      savings: {
        months: minimumMonths - doubledMonths,
        interest: minimumInterest - doubledInterest,
      },
    },
  };
}

/**
 * Calculate credit utilization ratio
 */
export function calculateCreditUtilization(
  accounts: Array<{
    balance: number;
    creditLimit?: number;
    type?: string;
  }>
): {
  utilizationRate: number;
  totalBalance: number;
  totalLimit: number;
  interpretation: string;
  impact: string;
} {
  let totalBalance = 0;
  let totalLimit = 0;

  accounts.forEach(account => {
    const type = (account.type ?? '').toLowerCase();
    if (type === 'credit') {
      totalBalance += account.balance ?? 0;
      totalLimit += account.creditLimit ?? 0;
    }
  });

  const utilizationRate = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  let interpretation = '';
  let impact = '';

  if (utilizationRate < 10) {
    interpretation = 'Excellent';
    impact = 'Optimal for credit score - keep it up!';
  } else if (utilizationRate < 30) {
    interpretation = 'Good';
    impact = 'Healthy credit usage - no negative impact';
  } else if (utilizationRate < 50) {
    interpretation = 'Fair';
    impact = 'Starting to hurt credit score - pay down balances';
  } else if (utilizationRate < 75) {
    interpretation = 'Poor';
    impact = 'Significant negative impact on credit score';
  } else {
    interpretation = 'Critical';
    impact = 'Severe impact on credit - prioritize paying down debt';
  }

  return {
    utilizationRate,
    totalBalance,
    totalLimit,
    interpretation,
    impact,
  };
}

/**
 * ============================================================================
 * TAX CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate federal income tax (simplified 2025 single filer)
 */
export function calculateFederalTax(
  taxableIncome: number,
  filingStatus: 'single' | 'married' | 'head_of_household' = 'single'
): {
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: Array<{ bracket: string; amount: number; tax: number }>;
} {
  // 2025 tax brackets (simplified - single filer)
  const brackets = filingStatus === 'single' ? [
    { max: 11600, rate: 0.10 },
    { max: 47150, rate: 0.12 },
    { max: 100525, rate: 0.22 },
    { max: 191950, rate: 0.24 },
    { max: 243725, rate: 0.32 },
    { max: 609350, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ] : [
    // Married filing jointly
    { max: 23200, rate: 0.10 },
    { max: 94300, rate: 0.12 },
    { max: 201050, rate: 0.22 },
    { max: 383900, rate: 0.24 },
    { max: 487450, rate: 0.32 },
    { max: 731200, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ];

  let totalTax = 0;
  let previousMax = 0;
  let marginalRate = 0;
  const breakdown: Array<{ bracket: string; amount: number; tax: number }> = [];

  for (const bracket of brackets) {
    const taxableInThisBracket = Math.max(0, Math.min(taxableIncome, bracket.max) - previousMax);

    if (taxableInThisBracket > 0) {
      const taxInBracket = taxableInThisBracket * bracket.rate;
      totalTax += taxInBracket;
      marginalRate = bracket.rate;

      breakdown.push({
        bracket: `${(bracket.rate * 100).toFixed(0)}%`,
        amount: taxableInThisBracket,
        tax: taxInBracket,
      });
    }

    if (taxableIncome <= bracket.max) {
      break;
    }

    previousMax = bracket.max;
  }

  const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

  return {
    totalTax,
    effectiveRate,
    marginalRate: marginalRate * 100,
    breakdown,
  };
}

/**
 * Calculate FICA tax (Social Security + Medicare)
 */
export function calculateFICATax(
  income: number,
  selfEmployed: boolean = false
): {
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  total: number;
  deduction?: number;
} {
  const ssWageBase = 168600; // 2025 SS wage base
  const additionalMedicareThreshold = 200000;

  const socialSecurity = Math.min(income, ssWageBase) * (selfEmployed ? 0.124 : 0.062);
  const medicare = income * (selfEmployed ? 0.029 : 0.0145);
  let additionalMedicare = 0;

  if (income > additionalMedicareThreshold) {
    additionalMedicare = (income - additionalMedicareThreshold) * 0.009;
  }

  const total = socialSecurity + medicare + additionalMedicare;

  // Self-employed can deduct half as business expense
  const deduction = selfEmployed ? total * 0.5 : undefined;

  return {
    socialSecurity,
    medicare,
    additionalMedicare,
    total,
    deduction,
  };
}

/**
 * ============================================================================
 * BUDGETING CALCULATIONS
 * ============================================================================
 */

/**
 * 50/30/20 Budget Rule
 */
export function calculate503020Budget(
  monthlyIncome: number
): {
  needs: number;
  wants: number;
  savings: number;
  breakdown: string;
} {
  return {
    needs: monthlyIncome * 0.50,
    wants: monthlyIncome * 0.30,
    savings: monthlyIncome * 0.20,
    breakdown: '50% Needs, 30% Wants, 20% Savings/Debt',
  };
}

/**
 * ============================================================================
 * PROJECTION CALCULATIONS
 * ============================================================================
 */

/**
 * Project net worth growth over time
 */
export function projectNetWorth(
  currentNetWorth: number,
  monthlySavings: number,
  annualReturnRate: number,
  years: number
): Array<{
  year: number;
  optimistic: number;
  baseCase: number;
  pessimistic: number;
  contributions: number;
}> {
  const projections = [];
  const optimisticRate = annualReturnRate + 3; // +3% optimistic
  const pessimisticRate = Math.max(0, annualReturnRate - 3); // -3% pessimistic

  for (let year = 1; year <= years; year++) {
    const months = year * 12;
    const monthlyRate = annualReturnRate / 12 / 100;
    const optimisticMonthlyRate = optimisticRate / 12 / 100;
    const pessimisticMonthlyRate = pessimisticRate / 12 / 100;

    // Calculate future value for each scenario
    const calculateFV = (rate: number): number => {
      let balance = currentNetWorth;
      for (let m = 0; m < months; m++) {
        balance = balance * (1 + rate) + monthlySavings;
      }
      return balance;
    };

    projections.push({
      year,
      optimistic: calculateFV(optimisticMonthlyRate),
      baseCase: calculateFV(monthlyRate),
      pessimistic: calculateFV(pessimisticMonthlyRate),
      contributions: currentNetWorth + (monthlySavings * months),
    });
  }

  return projections;
}
