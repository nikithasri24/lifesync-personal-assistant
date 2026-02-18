/**
 * CalculatorsPage - Interactive financial calculators
 * Comprehensive tools for various financial calculations
 */

import React from 'react';
import {
  CreditCard,
  TrendingUp,
  PiggyBank,
  Percent,
  DollarSign,
  Target,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  CompoundInterestCalculator,
  DebtPayoffCalculator,
  RetirementCalculator,
  GoalSavingsCalculator,
  RuleOf72Calculator,
  TaxEstimatorCalculator,
  BudgetCalculator,
  RealReturnCalculator,
} from '../components/calculators';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();
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
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🧮</span>
            Financial Calculators
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
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
    </div>
  );
};

export default CalculatorsPage;
