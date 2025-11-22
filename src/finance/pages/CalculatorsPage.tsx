/**
 * CalculatorsPage - Interactive financial calculators
 * Comprehensive tools for various financial calculations
 */

import React from 'react';
import {
  _Calculator,
  CreditCard,
  TrendingUp,
  _Home,
  PiggyBank,
  Percent,
  DollarSign,
  Target,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  calculateCreditCardPayoff,
  calculateCompoundInterest,
  calculate4PercentRule,
  calculateRequiredSavings,
  ruleOf72,
  calculateFederalTax,
  calculateFICATax,
  calculate503020Budget,
  calculateRealReturn,
} from '../utils/calculations';
import { formatCurrency } from '../utils/currency';

type CalculatorType =
  | 'debtPayoff'
  | 'compoundInterest'
  | 'retirement'
  | 'goalSavings'
  | 'ruleOf72'
  | 'taxEstimator'
  | 'budget'
  | 'realReturn';

const CalculatorsPage: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>('compoundInterest');

  const calculators = [
    { id: 'compoundInterest' as CalculatorType, name: 'Compound Interest', icon: TrendingUp, description: 'See your money grow over time' },
    { id: 'debtPayoff' as CalculatorType, name: 'Debt Payoff', icon: CreditCard, description: 'Calculate time to eliminate debt' },
    { id: 'retirement' as CalculatorType, name: 'Retirement', icon: PiggyBank, description: '4% rule & retirement planning' },
    { id: 'goalSavings' as CalculatorType, name: 'Goal Savings', icon: Target, description: 'Required savings for your goals' },
    { id: 'ruleOf72' as CalculatorType, name: 'Rule of 72', icon: Zap, description: 'How fast will your money double?' },
    { id: 'taxEstimator' as CalculatorType, name: 'Tax Estimator', icon: Percent, description: 'Estimate your tax liability' },
    { id: 'budget' as CalculatorType, name: '50/30/20 Budget', icon: DollarSign, description: 'Balanced budget allocation' },
    { id: 'realReturn' as CalculatorType, name: 'Real Return', icon: Calendar, description: 'Inflation-adjusted returns' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Financial Calculators</h2>
        <p className="text-sm text-primary opacity-70">
          Interactive tools to help you make informed financial decisions
        </p>
      </div>

      {/* Calculator Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {calculators.map(calc => (
          <button
            key={calc.id}
            onClick={() => setActiveCalculator(calc.id)}
            className={`p-4 rounded-xl text-left transition-all ${
              activeCalculator === calc.id
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <calc.icon className={`h-6 w-6 mb-2 ${
              activeCalculator === calc.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'
            }`} />
            <h3 className={`font-semibold text-sm mb-1 ${
              activeCalculator === calc.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {calc.name}
            </h3>
            <p className={`text-xs ${
              activeCalculator === calc.id ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {calc.description}
            </p>
          </button>
        ))}
      </div>

      {/* Active Calculator */}
      <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-6">
        {activeCalculator === 'compoundInterest' && <CompoundInterestCalculator />}
        {activeCalculator === 'debtPayoff' && <DebtPayoffCalculator />}
        {activeCalculator === 'retirement' && <RetirementCalculator />}
        {activeCalculator === 'goalSavings' && <GoalSavingsCalculator />}
        {activeCalculator === 'ruleOf72' && <RuleOf72Calculator />}
        {activeCalculator === 'taxEstimator' && <TaxEstimatorCalculator />}
        {activeCalculator === 'budget' && <BudgetCalculator />}
        {activeCalculator === 'realReturn' && <RealReturnCalculator />}
      </div>
    </div>
  );
};

// Compound Interest Calculator
const CompoundInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = React.useState(10000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);
  const [years, setYears] = React.useState(30);
  const [returnRate, setReturnRate] = React.useState(7);

  const result = calculateCompoundInterest(principal, monthlyContribution, returnRate, years);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Compound Interest Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Starting Amount
            </label>
            <input
              type="number"
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly Contribution
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Years to Grow
            </label>
            <input
              type="number"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Annual Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={returnRate}
              onChange={e => setReturnRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <p className="text-sm text-blue-700 mb-1">Future Value</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(result.futureValue)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Total Contributed</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(result.totalContributed)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Investment Gains</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.totalGains)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {((result.totalGains / result.totalContributed) * 100).toFixed(1)}% return on contributions
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Insight:</strong> Your {formatCurrency(monthlyContribution)}/month contribution
              will grow to {formatCurrency(result.futureValue)} in {years} years,
              earning {formatCurrency(result.totalGains)} in investment returns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Debt Payoff Calculator
const DebtPayoffCalculator: React.FC = () => {
  const [balance, setBalance] = React.useState(5000);
  const [apr, setApr] = React.useState(18);
  const [monthlyPayment, setMonthlyPayment] = React.useState(200);

  const result = calculateCreditCardPayoff(balance, apr, monthlyPayment);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-bold text-primary">Debt Payoff Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={e => setBalance(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              APR (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={apr}
              onChange={e => setApr(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly Payment
            </label>
            <input
              type="number"
              value={monthlyPayment}
              onChange={e => setMonthlyPayment(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50">
            <p className="text-sm text-red-700 mb-1">Time to Pay Off</p>
            <p className="text-4xl font-bold text-red-900">
              {result.monthsToPayoff} months
            </p>
            <p className="text-sm text-red-600 mt-1">
              ({(result.monthsToPayoff / 12).toFixed(1)} years)
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50">
            <p className="text-sm text-amber-700 mb-1">Total Interest Paid</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatCurrency(result.totalInterest)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-1">Total Amount Paid</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(result.totalPaid)}
            </p>
          </div>

          {/* Comparison */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 mb-2">
              💰 If you doubled your payment to {formatCurrency(monthlyPayment * 2)}/month:
            </p>
            <div className="space-y-1 text-xs text-emerald-700">
              <p>⏱ Pay off in {result.comparison.doubled.months} months (save {result.comparison.savings.months} months)</p>
              <p>💵 Save {formatCurrency(result.comparison.savings.interest)} in interest!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Retirement Calculator
const RetirementCalculator: React.FC = () => {
  const [currentSavings, setCurrentSavings] = React.useState(100000);
  const [annualExpenses, setAnnualExpenses] = React.useState(50000);

  const rule4Percent = calculate4PercentRule(currentSavings);
  const targetAmount = rule4Percent.requiredForExpenses(annualExpenses);
  const shortfall = Math.max(0, targetAmount - currentSavings);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <PiggyBank className="h-6 w-6 text-emerald-600" />
        <h3 className="text-xl font-bold text-primary">Retirement Calculator (4% Rule)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Retirement Savings
            </label>
            <input
              type="number"
              value={currentSavings}
              onChange={e => setCurrentSavings(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Desired Annual Expenses in Retirement
            </label>
            <input
              type="number"
              value={annualExpenses}
              onChange={e => setAnnualExpenses(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50">
            <p className="text-xs text-blue-700">
              📊 <strong>The 4% Rule:</strong> Withdraw 4% of your portfolio annually
              for a 30-year retirement with 95% success rate based on historical data.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-sm text-emerald-700 mb-1">Current Safe Withdrawal</p>
            <p className="text-4xl font-bold text-emerald-900">
              {formatCurrency(rule4Percent.monthlyWithdrawal)}
            </p>
            <p className="text-sm text-emerald-600 mt-1">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Target Retirement Amount</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(targetAmount)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              To support {formatCurrency(annualExpenses/12)}/month
            </p>
          </div>

          {shortfall > 0 ? (
            <div className="p-4 rounded-lg bg-amber-50">
              <p className="text-sm text-amber-700 mb-1">Still Need to Save</p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(shortfall)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {((currentSavings / targetAmount) * 100).toFixed(1)}% of target reached
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">
                🎉 Congratulations! You've reached your retirement target!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Goal Savings Calculator
const GoalSavingsCalculator: React.FC = () => {
  const [goalAmount, setGoalAmount] = React.useState(30000);
  const [currentSavings, setCurrentSavings] = React.useState(5000);
  const [years, setYears] = React.useState(3);
  const [returnRate, setReturnRate] = React.useState(5);

  const result = calculateRequiredSavings(goalAmount, currentSavings, years, returnRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Goal Savings Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Goal Amount
            </label>
            <input
              type="number"
              value={goalAmount}
              onChange={e => setGoalAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Savings
            </label>
            <input
              type="number"
              value={currentSavings}
              onChange={e => setCurrentSavings(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Years Until Goal
            </label>
            <input
              type="number"
              value={years}
              onChange={e => setYears(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Expected Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={returnRate}
              onChange={e => setReturnRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-sm text-blue-700 mb-1">Required Monthly Savings</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(result.requiredMonthlySavings)}
            </p>
            <p className="text-sm text-blue-600 mt-1">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Total You'll Contribute</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.totalContributions)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Investment Growth</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(result.totalGrowth)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              From your current savings + new contributions
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Plan:</strong> Save {formatCurrency(result.requiredMonthlySavings)}/month
              for {years} years to reach your {formatCurrency(goalAmount)} goal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rule of 72 Calculator
const RuleOf72Calculator: React.FC = () => {
  const [returnRate, setReturnRate] = React.useState(7);
  const result = ruleOf72(returnRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-6 w-6 text-yellow-600" />
        <h3 className="text-xl font-bold text-primary">Rule of 72 Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Annual Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={returnRate}
              onChange={e => setReturnRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>What is the Rule of 72?</strong>
            </p>
            <p className="text-xs text-blue-600">
              A quick way to estimate how long it takes for an investment to double.
              Simply divide 72 by your annual return rate.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <p className="text-sm text-yellow-700 mb-1">Years to Double Your Money</p>
            <p className="text-4xl font-bold text-yellow-900">
              {result.yearsToDouble.toFixed(1)} years
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm font-semibold text-purple-800 mb-3">
              Your Money Over Time (starting with $10,000)
            </p>
            {result.doublings.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-purple-200 last:border-0">
                <span className="text-sm text-purple-700">Year {d.years.toFixed(1)}</span>
                <span className="font-bold text-purple-900">
                  {formatCurrency(10000 * d.multiplier)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tax Estimator Calculator
const TaxEstimatorCalculator: React.FC = () => {
  const [income, setIncome] = React.useState(80000);
  const [filingStatus, setFilingStatus] = React.useState<'single' | 'married'>('single');
  const [selfEmployed, setSelfEmployed] = React.useState(false);

  const federalTax = calculateFederalTax(income, filingStatus);
  const ficaTax = calculateFICATax(income, selfEmployed);
  const totalTax = federalTax.totalTax + ficaTax.total;
  const takeHome = income - totalTax;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Percent className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-bold text-primary">Tax Estimator (2025)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Annual Income
            </label>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={e => setFilingStatus(e.target.value as 'single' | 'married')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="selfEmployed"
              checked={selfEmployed}
              onChange={e => setSelfEmployed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selfEmployed" className="ml-2 text-sm text-primary">
              Self-Employed (pay both halves of FICA)
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50">
            <p className="text-sm text-red-700 mb-1">Total Tax Liability</p>
            <p className="text-4xl font-bold text-red-900">
              {formatCurrency(totalTax)}
            </p>
            <p className="text-sm text-red-600 mt-1">
              {((totalTax / income) * 100).toFixed(1)}% of income
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-blue-50 flex items-center justify-between">
              <span className="text-sm text-blue-700">Federal Income Tax</span>
              <span className="font-bold text-blue-900">{formatCurrency(federalTax.totalTax)}</span>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 flex items-center justify-between">
              <span className="text-sm text-purple-700">FICA (SS + Medicare)</span>
              <span className="font-bold text-purple-900">{formatCurrency(ficaTax.total)}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Take-Home Pay</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(takeHome)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {formatCurrency(takeHome / 12)}/month
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 text-xs text-amber-700">
            <p className="font-semibold mb-1">Tax Rates:</p>
            <p>Marginal: {federalTax.marginalRate.toFixed(1)}%</p>
            <p>Effective: {federalTax.effectiveRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 50/30/20 Budget Calculator
const BudgetCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = React.useState(5000);
  const result = calculate503020Budget(monthlyIncome);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-6 w-6 text-green-600" />
        <h3 className="text-xl font-bold text-primary">50/30/20 Budget Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly After-Tax Income
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>The 50/30/20 Rule</strong>
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• 50% Needs (housing, utilities, groceries, insurance)</li>
              <li>• 30% Wants (dining out, entertainment, hobbies)</li>
              <li>• 20% Savings & Debt (emergency fund, retirement, extra debt payments)</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-sm text-emerald-700 mb-1">Needs (50%)</p>
            <p className="text-4xl font-bold text-emerald-900">
              {formatCurrency(result.needs)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Housing, food, utilities, insurance</p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-1">Wants (30%)</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(result.wants)}
            </p>
            <p className="text-xs text-blue-600 mt-1">Entertainment, dining, hobbies</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Savings & Debt (20%)</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.savings)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Emergency fund, retirement, extra payments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Real Return Calculator
const RealReturnCalculator: React.FC = () => {
  const [nominalReturn, setNominalReturn] = React.useState(8);
  const [inflationRate, setInflationRate] = React.useState(3);

  const result = calculateRealReturn(nominalReturn, inflationRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Real Return Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Nominal Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={nominalReturn}
              onChange={e => setNominalReturn(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={e => setInflationRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>Why It Matters</strong>
            </p>
            <p className="text-xs text-blue-600">
              Real return shows your actual purchasing power growth. An 8% return with 3% inflation
              means your money's buying power only grows 4.85% per year.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-sm text-blue-700 mb-1">Real Rate of Return</p>
            <p className="text-4xl font-bold text-blue-900">
              {result.realReturn.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-2">Interpretation</p>
            <p className="text-sm text-purple-900">
              {result.interpretation}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              Example: $10,000 invested for 10 years
            </p>
            <div className="space-y-2 text-sm text-emerald-700">
              <div className="flex justify-between">
                <span>Nominal growth:</span>
                <span className="font-bold">
                  {formatCurrency(10000 * Math.pow(1 + nominalReturn / 100, 10))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Real value (purchasing power):</span>
                <span className="font-bold">
                  {formatCurrency(10000 * Math.pow(1 + result.realReturn / 100, 10))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorsPage;
