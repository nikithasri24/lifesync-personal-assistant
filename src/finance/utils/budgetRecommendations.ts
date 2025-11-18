/**
 * Budget Recommendations Utility
 *
 * Calculates smart budget suggestions based on historical spending patterns
 */

import type { Transaction } from '../types';

export interface BudgetRecommendation {
  suggested: number;
  average: number;
  min: number;
  max: number;
  monthsAnalyzed: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate budget recommendation for a category based on historical transactions
 *
 * @param transactions - All user transactions
 * @param categoryId - Category to analyze
 * @param monthsToAnalyze - Number of months to look back (default: 3)
 * @returns Budget recommendation with statistics
 */
export function calculateBudgetRecommendation(
  transactions: Transaction[],
  categoryId: string,
  monthsToAnalyze: number = 3
): BudgetRecommendation | null {
  console.log('[BudgetRecommendation] Calculating for category:', categoryId);
  console.log('[BudgetRecommendation] Total transactions:', transactions.length);
  console.log('[BudgetRecommendation] Months to analyze:', monthsToAnalyze);

  // Filter transactions for this category (debit only = spending)
  const categoryTransactions = transactions.filter(
    (txn) => txn.categoryId === categoryId && txn.type === 'debit'
  );

  console.log('[BudgetRecommendation] Transactions for this category:', categoryTransactions.length);
  console.log('[BudgetRecommendation] Sample transactions:', categoryTransactions.slice(0, 3));

  if (categoryTransactions.length === 0) {
    console.log('[BudgetRecommendation] No transactions for this category');
    return null; // No historical data
  }

  // Group transactions by month
  const now = new Date();
  const monthlySpending = new Map<string, number>();

  // Go back N months
  for (let i = 0; i < monthsToAnalyze; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    monthlySpending.set(monthKey, 0);
  }

  console.log('[BudgetRecommendation] Analyzing months:', Array.from(monthlySpending.keys()));

  // Sum spending per month
  categoryTransactions.forEach((txn) => {
    const monthKey = txn.dateISO.slice(0, 7); // YYYY-MM
    if (monthlySpending.has(monthKey)) {
      monthlySpending.set(monthKey, monthlySpending.get(monthKey)! + txn.amount);
    }
  });

  console.log('[BudgetRecommendation] Monthly spending:', Object.fromEntries(monthlySpending));

  // Calculate statistics
  const monthlyAmounts = Array.from(monthlySpending.values()).filter((amount) => amount > 0);

  console.log('[BudgetRecommendation] Monthly amounts (non-zero):', monthlyAmounts);

  if (monthlyAmounts.length === 0) {
    console.log('[BudgetRecommendation] No spending in analyzed period');
    return null; // No spending in analyzed period
  }

  const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
  const average = total / monthlyAmounts.length;
  const min = Math.min(...monthlyAmounts);
  const max = Math.max(...monthlyAmounts);

  // Calculate suggested amount (average + 10% buffer for safety)
  const suggested = Math.ceil(average * 1.1);

  // Determine confidence based on data consistency
  const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / monthlyAmounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / average;

  let confidence: 'high' | 'medium' | 'low';
  if (coefficientOfVariation < 0.2 && monthlyAmounts.length >= 3) {
    confidence = 'high'; // Consistent spending, good data
  } else if (coefficientOfVariation < 0.5 && monthlyAmounts.length >= 2) {
    confidence = 'medium'; // Some variation, decent data
  } else {
    confidence = 'low'; // High variation or limited data
  }

  const recommendation = {
    suggested,
    average,
    min,
    max,
    monthsAnalyzed: monthlyAmounts.length,
    confidence,
  };

  console.log('[BudgetRecommendation] Final recommendation:', recommendation);

  return recommendation;
}

/**
 * Format recommendation message for display
 */
export function formatRecommendationMessage(rec: BudgetRecommendation): string {
  const { suggested, average, monthsAnalyzed, confidence } = rec;

  if (confidence === 'high') {
    return `Based on ${monthsAnalyzed} months of consistent spending, we recommend $${suggested.toFixed(0)} (avg: $${average.toFixed(0)})`;
  } else if (confidence === 'medium') {
    return `Based on ${monthsAnalyzed} months of data, we suggest $${suggested.toFixed(0)} (avg: $${average.toFixed(0)})`;
  } else {
    return `Limited data available. Estimated: $${suggested.toFixed(0)} (based on ${monthsAnalyzed} month${monthsAnalyzed > 1 ? 's' : ''})`;
  }
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'emerald';
    case 'medium':
      return 'blue';
    case 'low':
      return 'amber';
  }
}
