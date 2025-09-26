// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Target,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  Calculator,
  Award,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Save,
  X,
  Info
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { expenseCategorizationEngine } from '../services/expenseCategorizationEngine';
import type { FinancialTransactionData, FinancialAccountData } from '../services/types';

interface BudgetRecommendation {
  category: string;
  categoryName: string;
  currentSpending: number;
  recommendedBudget: number;
  percentageOfIncome: number;
  status: 'under' | 'over' | 'optimal';
  savings: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

interface BudgetStrategy {
  id: string;
  name: string;
  description: string;
  allocations: { [category: string]: number };
  totalSavingsRate: number;
  suitability: number;
  pros: string[];
  cons: string[];
}

interface SmartBudgetPlan {
  totalIncome: number;
  totalExpenses: number;
  currentSavingsRate: number;
  recommendedSavingsRate: number;
  totalSavings: number;
  recommendations: BudgetRecommendation[];
  strategies: BudgetStrategy[];
  insights: string[];
  warnings: string[];
}

export default function SmartBudgetRecommendations() {
  const [budgetPlan, setBudgetPlan] = useState<SmartBudgetPlan | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransactionData[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [showDetails, setShowDetails] = useState(true);
  const [customBudgets, setCustomBudgets] = useState<{ [category: string]: number }>({});
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [transactionData, accountData] = await Promise.all([
        apiClient.getFinancialTransactions(),
        apiClient.getFinancialAccounts()
      ]);

      setTransactions(transactionData);
      setAccounts(accountData);

      // Generate smart budget recommendations
      const budget = generateSmartBudgetPlan(transactionData, accountData);
      setBudgetPlan(budget);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartBudgetPlan = (
    transactions: FinancialTransactionData[],
    accounts: FinancialAccountData[]
  ): SmartBudgetPlan => {
    // Filter recent transactions (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);

    // Calculate income and expenses
    const monthlyIncome = calculateMonthlyIncome(recentTransactions);
    const totalExpenses = calculateTotalExpenses(recentTransactions);
    const currentSavingsRate = (monthlyIncome - totalExpenses) / monthlyIncome;

    // Categorize expenses
    const categorySpending = calculateCategorySpending(recentTransactions);

    // Generate recommendations for each category
    const recommendations = generateCategoryRecommendations(categorySpending, monthlyIncome);

    // Generate budget strategies
    const strategies = generateBudgetStrategies(monthlyIncome, categorySpending);

    // Calculate potential savings
    const totalSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
    const recommendedSavingsRate = Math.max(0.2, currentSavingsRate + (totalSavings / monthlyIncome));

    // Generate insights and warnings
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

  const calculateMonthlyIncome = (transactions: FinancialTransactionData[]): number => {
    const income = transactions.filter(t => t.type === 'income');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    return totalIncome / 3; // 3 months average
  };

  const calculateTotalExpenses = (transactions: FinancialTransactionData[]): number => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
    return totalExpenses / 3; // 3 months average
  };

  const calculateCategorySpending = (transactions: FinancialTransactionData[]): { [category: string]: number } => {
    const categorySpending: { [category: string]: number } = {};

    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      const suggestions = expenseCategorizationEngine.categorizeTransaction(transaction);
      const category = suggestions[0]?.categoryId || 'other';

      categorySpending[category] = (categorySpending[category] || 0) + Math.abs(transaction.amount);
    });

    // Convert to monthly averages
    Object.keys(categorySpending).forEach(category => {
      categorySpending[category] = categorySpending[category] / 3;
    });

    return categorySpending;
  };

  const generateCategoryRecommendations = (
    categorySpending: { [category: string]: number },
    monthlyIncome: number
  ): BudgetRecommendation[] => {
    const rules = expenseCategorizationEngine.getCategoryRules();
    const recommendations: BudgetRecommendation[] = [];

    // Standard budget percentages based on financial best practices
    const standardAllocations: { [category: string]: number } = {
      groceries: 0.10,        // 10% of income
      dining_out: 0.05,       // 5% of income
      gas_fuel: 0.04,         // 4% of income
      rideshare: 0.02,        // 2% of income
      public_transport: 0.02, // 2% of income
      electricity: 0.03,      // 3% of income
      internet_phone: 0.03,   // 3% of income
      streaming: 0.02,        // 2% of income
      entertainment: 0.05,    // 5% of income
      clothing: 0.05,         // 5% of income
      electronics: 0.03,      // 3% of income
      healthcare: 0.08,       // 8% of income
      bank_fees: 0.01,        // 1% of income
      investments: 0.15       // 15% of income
    };

    Object.entries(categorySpending).forEach(([categoryId, currentSpending]) => {
      const rule = rules.find(r => r.id === categoryId);
      const standardAllocation = standardAllocations[categoryId] || 0.05; // Default 5%
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
        categoryName: rule?.name || categoryId,
        currentSpending,
        recommendedBudget,
        percentageOfIncome,
        status,
        savings,
        reason: generateRecommendationReason(status, categoryId, percentageOfIncome),
        priority,
        icon: rule?.icon || '📊',
        color: rule?.color || '#6366F1'
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

  const generateBudgetStrategies = (
    monthlyIncome: number,
    categorySpending: { [category: string]: number }
  ): BudgetStrategy[] => {
    const strategies: BudgetStrategy[] = [
      // 50/30/20 Rule
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

      // Zero-Based Budgeting
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

      // Aggressive Savings
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

      // Balanced Growth
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

  const generateZeroBasedAllocations = (categorySpending: { [category: string]: number }, income: number) => {
    const allocations: { [category: string]: number } = {};
    const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);

    Object.entries(categorySpending).forEach(([category, amount]) => {
      allocations[category] = (amount / income) * 0.75; // Reduce all categories by 25%
    });

    allocations['savings'] = 0.25;
    return allocations;
  };

  const generateAggressiveSavingsAllocations = (categorySpending: { [category: string]: number }, income: number) => {
    const allocations: { [category: string]: number } = {};

    Object.entries(categorySpending).forEach(([category, amount]) => {
      // Reduce non-essential spending by 40-50%
      const reduction = ['dining_out', 'entertainment', 'clothing', 'streaming'].includes(category) ? 0.5 : 0.2;
      allocations[category] = Math.max((amount / income) * (1 - reduction), 0.01);
    });

    allocations['savings'] = 0.35;
    return allocations;
  };

  const generateBalancedGrowthAllocations = (categorySpending: { [category: string]: number }, income: number) => {
    const allocations: { [category: string]: number } = {};

    Object.entries(categorySpending).forEach(([category, amount]) => {
      // Slight reduction across all categories
      allocations[category] = (amount / income) * 0.9;
    });

    allocations['savings'] = 0.22;
    return allocations;
  };

  const calculateStrategySuitability = (strategyId: string, categorySpending: { [category: string]: number }, income: number): number => {
    const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
    const currentSavingsRate = (income - totalSpending) / income;

    let score = 70; // Base suitability

    // Adjust based on current financial situation
    if (strategyId === '50-30-20') {
      if (currentSavingsRate < 0.1) score += 20; // Good for low savers
      if (income < 60000) score += 10; // Good for moderate income
    }

    if (strategyId === 'aggressive-savings') {
      if (currentSavingsRate > 0.15) score += 20; // Good if already saving well
      if (income > 80000) score += 15; // Better with higher income
      if (income < 50000) score -= 25; // Hard with lower income
    }

    if (strategyId === 'zero-based') {
      if (currentSavingsRate < 0.05) score += 15; // Good for poor savers
      score += 10; // Generally versatile
    }

    if (strategyId === 'balanced-growth') {
      score += 15; // Generally suitable for most
      if (currentSavingsRate > 0.1 && currentSavingsRate < 0.3) score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  };

  const generateBudgetInsights = (
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

  const generateBudgetWarnings = (
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

  const handleCustomBudgetChange = (category: string, amount: number) => {
    setCustomBudgets(prev => ({
      ...prev,
      [category]: amount
    }));
  };

  const applyBudgetStrategy = (strategyId: string) => {
    const strategy = budgetPlan?.strategies.find(s => s.id === strategyId);
    if (strategy && budgetPlan) {
      const newCustomBudgets: { [category: string]: number } = {};

      budgetPlan.recommendations.forEach(rec => {
        const allocation = strategy.allocations[rec.category] || 0.05;
        newCustomBudgets[rec.category] = budgetPlan.totalIncome * allocation;
      });

      setCustomBudgets(newCustomBudgets);
      setSelectedStrategy(strategyId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-50 border-red-200';
      case 'under': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating smart budget recommendations...</span>
        </div>
      </div>
    );
  }

  if (!budgetPlan) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Generate Budget Plan</h3>
          <p className="text-gray-600">Please ensure you have sufficient transaction data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="w-8 h-8 mr-3 text-green-600" />
            Smart Budget Recommendations
          </h3>
          <p className="text-gray-600">AI-powered budget optimization based on your spending patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={loadFinancialData}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-900">${budgetPlan.totalIncome.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Current Expenses</p>
              <p className="text-2xl font-bold text-red-900">${budgetPlan.totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Current Savings Rate</p>
              <p className="text-2xl font-bold text-yellow-900">{(budgetPlan.currentSavingsRate * 100).toFixed(1)}%</p>
            </div>
            <PieChart className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Potential Savings</p>
              <p className="text-2xl font-bold text-green-900">${budgetPlan.totalSavings.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Insights */}
      {budgetPlan.insights.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Budget Insights</h4>
          </div>
          <ul className="space-y-2">
            {budgetPlan.insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {budgetPlan.warnings.length > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            <h4 className="text-lg font-semibold text-red-900">Budget Warnings</h4>
          </div>
          <ul className="space-y-2">
            {budgetPlan.warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-red-800">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Budget Strategies */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Recommended Budget Strategies
          </h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budgetPlan.strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedStrategy === strategy.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => applyBudgetStrategy(strategy.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{strategy.name}</h5>
                  <div className="flex items-center">
                    <Award className={`w-4 h-4 mr-1 ${
                      strategy.suitability >= 80 ? 'text-green-500' :
                      strategy.suitability >= 60 ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{strategy.suitability}% match</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-gray-500">Savings Rate</span>
                    <div className="font-semibold text-green-600">
                      {(strategy.totalSavingsRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Monthly Savings</span>
                    <div className="font-semibold text-green-600">
                      ${(budgetPlan.totalIncome * strategy.totalSavingsRate).toLocaleString()}
                    </div>
                  </div>
                </div>

                {showDetails && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-green-700">Pros:</span>
                      <ul className="text-xs text-gray-600">
                        {strategy.pros.map((pro, index) => (
                          <li key={index}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-red-700">Cons:</span>
                      <ul className="text-xs text-gray-600">
                        {strategy.cons.map((con, index) => (
                          <li key={index}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Recommendations */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Category Recommendations</h4>
            <span className="text-sm text-gray-500">{budgetPlan.recommendations.length} categories</span>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {budgetPlan.recommendations.map((recommendation) => (
              <div
                key={recommendation.category}
                className={`p-4 rounded-lg border ${getStatusColor(recommendation.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{recommendation.icon}</span>
                    <div>
                      <h5 className="font-semibold text-gray-900">{recommendation.categoryName}</h5>
                      <div className="flex items-center text-sm text-gray-600">
                        {getPriorityIcon(recommendation.priority)}
                        <span className="ml-1 capitalize">{recommendation.priority} priority</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ${recommendation.currentSpending.toFixed(0)} / ${recommendation.recommendedBudget.toFixed(0)}
                    </div>
                    <div className="text-sm">
                      {recommendation.percentageOfIncome.toFixed(1)}% of income
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Budget Progress</span>
                    <span>{((recommendation.currentSpending / recommendation.recommendedBudget) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        recommendation.status === 'over' ? 'bg-red-500' :
                        recommendation.status === 'under' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((recommendation.currentSpending / recommendation.recommendedBudget) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{recommendation.reason}</p>

                {recommendation.savings > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Potential Monthly Savings:</span>
                      <span className="text-lg font-bold text-green-600">${recommendation.savings.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
