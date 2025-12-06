import { expenseCategorizationEngine } from '../../services/expenseCategorizationEngine';
import type { FinancialTransactionData, FinancialAccountData } from '../../services/types';
import type { BudgetRecommendation, BudgetStrategy, SmartBudgetPlan } from './types';

export const calculateMonthlyIncome = (transactions: FinancialTransactionData[]): number => {
  const income = transactions.filter(t => t.type === 'income');
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  return totalIncome / 3;
};

export const calculateTotalExpenses = (transactions: FinancialTransactionData[]): number => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  return totalExpenses / 3;
};

export const calculateCategorySpending = (transactions: FinancialTransactionData[]): { [category: string]: number } => {
  const categorySpending: { [category: string]: number } = {};

  transactions.filter(t => t.type === 'expense').forEach(transaction => {
    const suggestions = expenseCategorizationEngine.categorizeTransaction(transaction);
    const category = suggestions[0]?.categoryId ?? 'other';

    categorySpending[category] = (categorySpending[category] ?? 0) + Math.abs(transaction.amount);
  });

  Object.keys(categorySpending).forEach(category => {
    categorySpending[category] = categorySpending[category] / 3;
  });

  return categorySpending;
};

const generateRecommendationReason = (status: string, category: string, percentage: number): string => {
  if (status === 'over') {
    if (percentage > 15) {
      return `This category is consuming ${percentage.toFixed(1)}% of your income, significantly above recommended levels. Consider reducing expenses here.`;
    }
    return `Spending is above recommended levels for this category. Look for ways to optimize without sacrificing quality of life.`;
  }
  if (status === 'under') {
    if (category === 'investments' || category === 'emergency_fund') {
      return `You have room to increase investments or savings in this category to improve long-term financial health.`;
    }
    return `Spending is below typical levels. This could indicate good financial discipline or missed opportunities.`;
  }
  return `Your spending in this category is well-balanced and within recommended guidelines.`;
};

export const generateCategoryRecommendations = (
  categorySpending: { [category: string]: number },
  monthlyIncome: number
): BudgetRecommendation[] => {
  const rules = expenseCategorizationEngine.getCategoryRules();
  const recommendations: BudgetRecommendation[] = [];

  const standardAllocations: { [category: string]: number } = {
    groceries: 0.10,
    dining_out: 0.05,
    gas_fuel: 0.04,
    rideshare: 0.02,
    public_transport: 0.02,
    electricity: 0.03,
    internet_phone: 0.03,
    streaming: 0.02,
    entertainment: 0.05,
    clothing: 0.05,
    electronics: 0.03,
    healthcare: 0.08,
    bank_fees: 0.01,
    investments: 0.15
  };

  Object.entries(categorySpending).forEach(([categoryId, currentSpending]) => {
    const rule = rules.find(r => r.id === categoryId);
    const standardAllocation = standardAllocations[categoryId] ?? 0.05;
    const recommendedBudget = monthlyIncome * standardAllocation;
    const percentageOfIncome = (currentSpending / monthlyIncome) * 100;

    let status: 'under' | 'over' | 'optimal' = 'optimal';
    let savings = 0;
    let priority: 'high' | 'medium' | 'low' = 'medium';

    if (currentSpending > recommendedBudget * 1.2) {
      status = 'over';
      savings = currentSpending - recommendedBudget;
      priority = savings > monthlyIncome * 0.05 ? 'high' : 'medium';
    } else if (currentSpending < recommendedBudget * 0.8) {
      status = 'under';
      savings = 0;
      priority = 'low';
    } else {
      status = 'optimal';
      savings = 0;
      priority = 'low';
    }

    recommendations.push({
      category: categoryId,
      categoryName: rule?.name ?? categoryId,
      currentSpending,
      recommendedBudget,
      percentageOfIncome,
      status,
      savings,
      reason: generateRecommendationReason(status, categoryId, percentageOfIncome),
      priority,
      icon: rule?.icon ?? '📊',
      color: rule?.color ?? '#6366F1'
    });
  });

  return recommendations.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.savings - a.savings;
  });
};

const generateZeroBasedAllocations = (categorySpending: { [category: string]: number }, income: number): { [category: string]: number } => {
  const allocations: { [category: string]: number } = {};

  Object.entries(categorySpending).forEach(([category, amount]) => {
    allocations[category] = (amount / income) * 0.75;
  });

  allocations['savings'] = 0.25;
  return allocations;
};

const generateAggressiveSavingsAllocations = (categorySpending: { [category: string]: number }, income: number): { [category: string]: number } => {
  const allocations: { [category: string]: number } = {};

  Object.entries(categorySpending).forEach(([category, amount]) => {
    const reduction = ['dining_out', 'entertainment', 'clothing', 'streaming'].includes(category) ? 0.5 : 0.2;
    allocations[category] = Math.max((amount / income) * (1 - reduction), 0.01);
  });

  allocations['savings'] = 0.35;
  return allocations;
};

const generateBalancedGrowthAllocations = (categorySpending: { [category: string]: number }, income: number): { [category: string]: number } => {
  const allocations: { [category: string]: number } = {};

  Object.entries(categorySpending).forEach(([category, amount]) => {
    allocations[category] = (amount / income) * 0.9;
  });

  allocations['savings'] = 0.22;
  return allocations;
};

const calculateStrategySuitability = (strategyId: string, categorySpending: { [category: string]: number }, income: number): number => {
  const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
  const currentSavingsRate = (income - totalSpending) / income;

  let score = 70;

  if (strategyId === '50-30-20') {
    if (currentSavingsRate < 0.1) score += 20;
    if (income < 60000) score += 10;
  }

  if (strategyId === 'aggressive-savings') {
    if (currentSavingsRate > 0.15) score += 20;
    if (income > 80000) score += 15;
    if (income < 50000) score -= 25;
  }

  if (strategyId === 'zero-based') {
    if (currentSavingsRate < 0.05) score += 15;
    score += 10;
  }

  if (strategyId === 'balanced-growth') {
    score += 15;
    if (currentSavingsRate > 0.1 && currentSavingsRate < 0.3) score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
};

export const generateBudgetStrategies = (
  monthlyIncome: number,
  categorySpending: { [category: string]: number }
): BudgetStrategy[] => {
  const strategies: BudgetStrategy[] = [
    {
      id: '50-30-20',
      name: '50/30/20 Rule',
      description: 'Allocate 50% to needs, 30% to wants, and 20% to savings and debt payment',
      allocations: {
        needs: 0.50,
        wants: 0.30,
        savings: 0.20
      },
      totalSavingsRate: 0.20,
      suitability: calculateStrategySuitability('50-30-20', categorySpending, monthlyIncome),
      pros: ['Simple to follow', 'Balanced approach', 'Good for beginners'],
      cons: ['May not suit high-income earners', 'Rigid categories']
    },
    {
      id: 'zero-based',
      name: 'Zero-Based Budgeting',
      description: 'Every dollar is assigned a purpose, with income minus expenses equaling zero',
      allocations: generateZeroBasedAllocations(categorySpending, monthlyIncome),
      totalSavingsRate: 0.25,
      suitability: calculateStrategySuitability('zero-based', categorySpending, monthlyIncome),
      pros: ['Maximum control', 'Forces intentional spending', 'Maximizes savings'],
      cons: ['Time-intensive', 'Requires discipline', 'Less flexible']
    },
    {
      id: 'aggressive-savings',
      name: 'Aggressive Savings',
      description: 'Minimize expenses to maximize savings rate (30%+ savings)',
      allocations: generateAggressiveSavingsAllocations(categorySpending, monthlyIncome),
      totalSavingsRate: 0.35,
      suitability: calculateStrategySuitability('aggressive-savings', categorySpending, monthlyIncome),
      pros: ['Fast wealth building', 'Early retirement potential', 'Financial independence'],
      cons: ['Restrictive lifestyle', 'May not be sustainable', 'Requires high income']
    },
    {
      id: 'balanced-growth',
      name: 'Balanced Growth',
      description: 'Moderate approach balancing current enjoyment with future financial goals',
      allocations: generateBalancedGrowthAllocations(categorySpending, monthlyIncome),
      totalSavingsRate: 0.22,
      suitability: calculateStrategySuitability('balanced-growth', categorySpending, monthlyIncome),
      pros: ['Sustainable long-term', 'Good quality of life', 'Steady wealth building'],
      cons: ['Slower wealth accumulation', 'May not suit aggressive savers']
    }
  ];

  return strategies.sort((a, b) => b.suitability - a.suitability);
};

export const generateBudgetInsights = (
  recommendations: BudgetRecommendation[],
  monthlyIncome: number,
  currentSavingsRate: number
): string[] => {
  const insights: string[] = [];

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
  if (totalPotentialSavings > monthlyIncome * 0.05) {
    insights.push(`You could save an additional $${totalPotentialSavings.toFixed(2)} per month by optimizing your spending.`);
  }

  const highSpendingCategories = recommendations.filter(r => r.status === 'over' && r.priority === 'high');
  if (highSpendingCategories.length > 0) {
    insights.push(`Focus on reducing spending in ${highSpendingCategories.length} high-priority categories for maximum impact.`);
  }

  if (currentSavingsRate < 0.1) {
    insights.push('Your current savings rate is below the recommended 20%. Consider implementing one of the suggested budget strategies.');
  } else if (currentSavingsRate > 0.25) {
    insights.push('Excellent savings rate! You\'re on track for strong financial independence.');
  }

  const topCategory = recommendations.find(r => r.currentSpending === Math.max(...recommendations.map(rec => rec.currentSpending)));
  if (topCategory) {
    insights.push(`${topCategory.categoryName} is your largest expense category at $${topCategory.currentSpending.toFixed(2)} per month.`);
  }

  return insights;
};

export const generateBudgetWarnings = (
  recommendations: BudgetRecommendation[],
  accounts: FinancialAccountData[]
): string[] => {
  const warnings: string[] = [];

  const highRiskCategories = recommendations.filter(r => r.percentageOfIncome > 20);
  if (highRiskCategories.length > 0) {
    warnings.push(`Warning: ${highRiskCategories.length} categories are consuming over 20% of your income each.`);
  }

  const totalOverspending = recommendations.filter(r => r.status === 'over').reduce((sum, r) => sum + r.savings, 0);
  if (totalOverspending > recommendations[0]?.currentSpending * 0.5) {
    warnings.push('Your total overspending is significant and may impact long-term financial goals.');
  }

  const emergencyFund = accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);
  const monthlyExpenses = recommendations.reduce((sum, r) => sum + r.currentSpending, 0);
  if (emergencyFund < monthlyExpenses * 3) {
    warnings.push('Your emergency fund appears insufficient (less than 3 months of expenses).');
  }

  return warnings;
};

export const generateSmartBudgetPlan = (
  transactions: FinancialTransactionData[],
  accounts: FinancialAccountData[]
): SmartBudgetPlan => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
  const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);

  const monthlyIncome = calculateMonthlyIncome(recentTransactions);
  const totalExpenses = calculateTotalExpenses(recentTransactions);
  const currentSavingsRate = (monthlyIncome - totalExpenses) / monthlyIncome;

  const categorySpending = calculateCategorySpending(recentTransactions);
  const recommendations = generateCategoryRecommendations(categorySpending, monthlyIncome);
  const strategies = generateBudgetStrategies(monthlyIncome, categorySpending);

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
  const recommendedSavingsRate = Math.max(0.2, currentSavingsRate + (totalSavings / monthlyIncome));

  const insights = generateBudgetInsights(recommendations, monthlyIncome, currentSavingsRate);
  const warnings = generateBudgetWarnings(recommendations, accounts);

  return {
    totalIncome: monthlyIncome,
    totalExpenses,
    currentSavingsRate,
    recommendedSavingsRate,
    totalSavings,
    recommendations,
    strategies,
    insights,
    warnings
  };
};
