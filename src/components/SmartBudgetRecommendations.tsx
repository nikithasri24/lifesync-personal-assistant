// TypeScript type checking is enabled for this file
import React, { useState, useEffect, useCallback } from 'react';
import { Target, Lightbulb, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { FinancialTransactionData, FinancialAccountData } from '../services/types';
import { logger } from '../services/logger';
import { BudgetOverviewCards } from './budget/BudgetOverviewCards';
import { BudgetStrategiesSection } from './budget/BudgetStrategiesSection';
import { CategoryRecommendationsSection } from './budget/CategoryRecommendationsSection';
import type { SmartBudgetPlan } from './budget/types';
import { generateSmartBudgetPlan } from './budget/budgetCalculations';

export default function SmartBudgetRecommendations(): React.ReactElement {
  const [budgetPlan, setBudgetPlan] = useState<SmartBudgetPlan | null>(null);
  const [_transactions, setTransactions] = useState<FinancialTransactionData[]>([]);
  const [_accounts, setAccounts] = useState<FinancialAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [showDetails, setShowDetails] = useState(true);
  const [_customBudgets, setCustomBudgets] = useState<{ [category: string]: number }>({});
  const [_editingBudget, _setEditingBudget] = useState<string | null>(null);

  useEffect(() => {
    void loadFinancialData();
  }, [loadFinancialData]);

  const loadFinancialData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [transactionData, accountData] = await Promise.all([
        apiClient.getFinancialTransactions(),
        apiClient.getFinancialAccounts()
      ]);

      setTransactions(transactionData);
      setAccounts(accountData);

      const budget = generateSmartBudgetPlan(transactionData, accountData);
      setBudgetPlan(budget);
    } catch (error) {
      logger.error('Failed to load financial data:', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  const _handleCustomBudgetChange = (category: string, amount: number): void => {
    setCustomBudgets(prev => ({
      ...prev,
      [category]: amount
    }));
  };

  const applyBudgetStrategy = (strategyId: string): void => {
    const strategy = budgetPlan?.strategies.find(s => s.id === strategyId);
    if (strategy && budgetPlan) {
      const newCustomBudgets: { [category: string]: number } = {};

      budgetPlan.recommendations.forEach(rec => {
        const allocation = strategy.allocations[rec.category] ?? 0.05;
        newCustomBudgets[rec.category] = budgetPlan.totalIncome * allocation;
      });

      setCustomBudgets(newCustomBudgets);
      setSelectedStrategy(strategyId);
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
            onClick={() => void loadFinancialData()}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <BudgetOverviewCards
        totalIncome={budgetPlan.totalIncome}
        totalExpenses={budgetPlan.totalExpenses}
        currentSavingsRate={budgetPlan.currentSavingsRate}
        totalSavings={budgetPlan.totalSavings}
      />

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

      <BudgetStrategiesSection
        strategies={budgetPlan.strategies}
        selectedStrategy={selectedStrategy}
        totalIncome={budgetPlan.totalIncome}
        showDetails={showDetails}
        onStrategySelect={applyBudgetStrategy}
      />

      <CategoryRecommendationsSection recommendations={budgetPlan.recommendations} />
    </div>
  );
}
