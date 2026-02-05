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
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
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
      className={`rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl ring-1 ring-slate-700/50 p-6 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-2xl hover:ring-slate-600/50' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 shadow-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Financial Insights</h3>
            <p className="text-sm text-slate-300">
              <span className={`font-bold ${getHealthColor(healthScore)}`}>
                {getHealthLabel(healthScore)}
              </span>
              {' '} • {healthScore.toFixed(0)}/100 Health Score
            </p>
          </div>
        </div>
        {onClick && <ChevronRight className="h-5 w-5 text-slate-400" />}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Savings Rate */}
        <div className="p-4 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Savings Rate</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {savingsRate.savingsRate.toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400">
            {formatCurrency(savingsRate.monthlySavings)}/mo
          </p>
        </div>

        {/* Emergency Fund */}
        <div className="p-4 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Emergency Fund</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {emergencyFund.monthsCovered.toFixed(1)}
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            {emergencyFund.monthsCovered < 3 ? (
              <span className="text-amber-400">⚠️</span>
            ) : (
              <span className="text-emerald-400">✓</span>
            )}
            months covered
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(emergencyFundBalance)} ÷ {formatCurrency(monthlyExpenses)}/mo
          </p>
        </div>

        {/* Net Worth */}
        <div className="p-4 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Net Worth</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(netWorth.netWorth)}
          </p>
          <p className="text-sm text-slate-400">
            Total wealth
          </p>
        </div>

        {/* Years to FI */}
        <div className="p-4 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Years to FI</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {yearsToFI.yearsToFI === Infinity ? '∞' : yearsToFI.yearsToFI.toFixed(0)}
          </p>
          <p className="text-sm text-slate-400">
            {yearsToFI.currentProgress.toFixed(0)}% there
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2.5">
        <p className="text-sm font-bold text-white mb-3">Key Insights</p>

        {/* Emergency Fund Insight - Priority */}
        {emergencyFund.monthsCovered < 6 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">Build emergency fund:</span>
              {' '}Need {formatCurrency(emergencyFund.shortfall)} more for 6 months coverage
            </p>
          </div>
        )}

        {/* Savings Rate Insight */}
        {savingsRate.savingsRate > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            {savingsRate.savingsRate >= 20 ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">{savingsRate.interpretation}</span>
              {savingsRate.savingsRate >= 50 && (
                <span className="ml-1">
                  {' '}At this rate, you could achieve financial independence in ~
                  {yearsToFI.yearsToFI.toFixed(0)} years!
                </span>
              )}
            </p>
          </div>
        )}

        {/* Credit Utilization Warning */}
        {creditUtil.utilizationRate > 30 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">High credit utilization:</span>
              {' '}{creditUtil.utilizationRate.toFixed(1)}% - {creditUtil.impact}
            </p>
          </div>
        )}

        {/* Retirement Progress */}
        {netWorth.netWorth > 0 && retirementRule.monthlyWithdrawal > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <DollarSign className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">4% Rule:</span>
              {' '}Current net worth supports {formatCurrency(retirementRule.monthlyWithdrawal)}/month in retirement
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          💡 Based on last 3 months of data • Updated daily
        </p>
      </div>
    </div>
  );
};

export default FinancialInsightsCard;
