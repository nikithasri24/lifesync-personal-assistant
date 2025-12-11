/**
 * Financial Insights Card Component
 * Shows key financial metrics and calculations on the dashboard
 */

import React from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Shield,
  PiggyBank,
  Calculator,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import type { Transaction, Account, Goal } from '../../types';
// Unused import removed
import {
  calculateSavingsRate,
  calculateNetWorth,
  calculateDebtToIncome,
  calculateEmergencyFund,
  calculateYearsToFI,
  calculate4PercentRule,
  calculateCreditUtilization,
} from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { logger } from '../../../services/logger';

interface FinancialInsightsCardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  onClick?: () => void;
  className?: string;
}

export const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({
  transactions,
  accounts,
  goals,
  onClick,
  className = '',
}) => {
  // Calculate time period for analysis (last 3 months or available data)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = transactions.filter(
    t => new Date(t.dateISO) >= threeMonthsAgo
  );

  // Group transactions by month and calculate averages
  const calculateMonthlyAverage = (txns: Transaction[], type: 'credit' | 'debit'): number => {
    if (txns.length === 0) return 0;

    // Group transactions by month (YYYY-MM format)
    const monthlyTotals = txns
      .filter(t => t.type === type)
      .reduce((acc, t) => {
        const monthKey = t.dateISO.substring(0, 7); // Extract YYYY-MM
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Get all monthly totals
    const totals = Object.values(monthlyTotals);

    if (totals.length === 0) return 0;

    // Calculate average of the monthly totals
    const sum = totals.reduce((a, b) => a + b, 0);
    return sum / totals.length;
  };

  // Calculate monthly income and expenses based on actual monthly averages
  const monthlyIncome = calculateMonthlyAverage(recentTransactions, 'credit');
  const monthlyExpenses = calculateMonthlyAverage(recentTransactions, 'debit');

  // Core calculations
  const netWorth = calculateNetWorth(accounts);
  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);

  // Emergency fund calculation - use goal's current amount
  const emergencyFundGoal = goals.find(
    g => g.name.toLowerCase().includes('emergency') && g.type === 'savings'
  );

  // Debug logging
  logger.debug('FinancialInsights', 'Emergency fund calculation', {
    goalsCount: goals.length,
    emergencyFundGoalFound: !!emergencyFundGoal
  });

  let emergencyFundBalance = 0;

  if (emergencyFundGoal) {
    // Use the goal's current amount
    emergencyFundBalance = emergencyFundGoal.currentAmount;
    logger.debug('FinancialInsights', 'Using emergency fund goal currentAmount', { emergencyFundBalance });
  } else {
    // Fallback: use all savings and checking accounts
    const emergencyAccounts = accounts.filter(
      a => a.type === 'savings' || a.type === 'checking'
    );
    emergencyFundBalance = emergencyAccounts.reduce((sum, a) => sum + a.balance, 0);
    logger.debug('FinancialInsights', 'Using fallback savings/checking balance', { emergencyFundBalance });
  }

  const emergencyFund = calculateEmergencyFund(emergencyFundBalance, monthlyExpenses);

  // Debt calculations
  const debtTransactions = recentTransactions.filter((t): t is Transaction & { categoryId: string } => {
    if (t.type !== 'debit' || t.categoryId == null) return false;
    const categoryId = t.categoryId as string;
    const lowercaseCategory = categoryId.toLowerCase();
    const debtTypes = ['loan', 'debt', 'mortgage'] as const;
    return debtTypes.some(type => lowercaseCategory.includes(type));
  });

  // Group debt payments by month and calculate average
  const monthlyDebtTotals = debtTransactions.reduce((acc, t) => {
    const monthKey = t.dateISO.substring(0, 7);
    acc[monthKey] = (acc[monthKey] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const debtTotals = Object.values(monthlyDebtTotals);
  const monthlyDebtPayments = debtTotals.length > 0
    ? debtTotals.reduce((a, b) => a + b, 0) / debtTotals.length
    : 0;

  const dti = calculateDebtToIncome(monthlyDebtPayments, monthlyIncome);
  const creditUtil = calculateCreditUtilization(accounts);

  // Financial independence calculations
  const annualExpenses = monthlyExpenses * 12;
  const yearsToFI = calculateYearsToFI(
    savingsRate.savingsRate,
    netWorth.netWorth,
    annualExpenses
  );

  // Retirement calculations
  const retirementRule = calculate4PercentRule(netWorth.netWorth);

  // Determine overall financial health score (0-100)
  let healthScore = 0;

  // Savings rate (0-30 points)
  healthScore += Math.min(30, savingsRate.savingsRate * 1.5);

  // Emergency fund (0-20 points)
  healthScore += Math.min(20, emergencyFund.monthsCovered * 3.33);

  // DTI (0-20 points)
  healthScore += Math.max(0, 20 - (dti.dti * 0.5));

  // Credit utilization (0-15 points)
  healthScore += Math.max(0, 15 - (creditUtil.utilizationRate * 0.3));

  // Net worth growth (0-15 points) - simplified
  healthScore += netWorth.netWorth > 0 ? 15 : 0;

  const getHealthColor = React.useCallback((score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getHealthLabel = React.useCallback((score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  }, []);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-primary opacity-70">Financial Insights</h3>
            <p className="text-xs text-primary opacity-60">
              <span className={`font-semibold ${getHealthColor(healthScore)}`}>
                {getHealthLabel(healthScore)}
              </span>
              {' '} • {healthScore.toFixed(0)}/100 Health Score
            </p>
          </div>
        </div>
        {onClick && <ChevronRight className="h-5 w-5 text-primary opacity-40" />}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Savings Rate */}
        <div className="p-3 rounded-lg bg-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-primary opacity-70">Savings Rate</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {savingsRate.savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {formatCurrency(savingsRate.monthlySavings)}/mo
          </p>
        </div>

        {/* Emergency Fund */}
        <div className="p-3 rounded-lg bg-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-primary opacity-70">Emergency Fund</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {emergencyFund.monthsCovered.toFixed(1)}
          </p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {emergencyFund.monthsCovered < 3 ? '⚠️ ' : '✓ '}
            months covered
          </p>
          <p className="text-xs text-primary opacity-40 mt-0.5">
            {formatCurrency(emergencyFundBalance)} ÷ {formatCurrency(monthlyExpenses)}/mo
          </p>
        </div>

        {/* Net Worth */}
        <div className="p-3 rounded-lg bg-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <p className="text-xs font-medium text-primary opacity-70">Net Worth</p>
          </div>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(netWorth.netWorth)}
          </p>
          <p className="text-xs text-primary opacity-60 mt-1">
            Total wealth
          </p>
        </div>

        {/* Years to FI */}
        <div className="p-3 rounded-lg bg-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-medium text-primary opacity-70">Years to FI</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {yearsToFI.yearsToFI === Infinity ? '∞' : yearsToFI.yearsToFI.toFixed(0)}
          </p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {yearsToFI.currentProgress.toFixed(0)}% there
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-primary opacity-70 mb-2">Key Insights</p>

        {/* Savings Rate Insight */}
        {savingsRate.savingsRate > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            {savingsRate.savingsRate >= 20 ? (
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-xs text-primary">
              <span className="font-semibold">{savingsRate.interpretation}</span>
              {savingsRate.savingsRate >= 50 && (
                <span className="ml-1">
                  At this rate, you could achieve financial independence in ~
                  {yearsToFI.yearsToFI.toFixed(0)} years!
                </span>
              )}
            </p>
          </div>
        )}

        {/* Emergency Fund Insight */}
        {emergencyFund.monthsCovered < 3 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary">
              <span className="font-semibold">Build emergency fund:</span>
              {' '}Need {formatCurrency(emergencyFund.shortfall)} more for 6 months coverage
            </p>
          </div>
        )}

        {/* Credit Utilization Warning */}
        {creditUtil.utilizationRate > 30 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-semibold">High credit utilization:</span>
              {' '}{creditUtil.utilizationRate.toFixed(1)}% - {creditUtil.impact}
            </p>
          </div>
        )}

        {/* Retirement Progress */}
        {netWorth.netWorth > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <DollarSign className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary">
              <span className="font-semibold">4% Rule:</span>
              {' '}Current net worth supports {formatCurrency(retirementRule.monthlyWithdrawal)}/month in retirement
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-primary/20">
        <p className="text-xs text-primary opacity-60">
          💡 Based on last 3 months of data • Updated daily
        </p>
      </div>
    </div>
  );
};

export default FinancialInsightsCard;
