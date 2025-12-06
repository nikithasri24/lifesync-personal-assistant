// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  Search,
  TrendingUp,
  PieChart,
  Calendar,
  DollarSign,
  Tag,
  ArrowRight,
  Lightbulb,
  Target
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { expenseCategorizationEngine, type CategorySuggestion } from '../services/expenseCategorizationEngine';
import type { FinancialTransactionData } from '../services/types';

interface TransactionCategorization {
  transaction: FinancialTransactionData;
  suggestions: CategorySuggestion[];
  selectedCategory?: string;
  isConfirmed: boolean;
}

export default function SmartExpenseCategorizer() {
  const [transactions, setTransactions] = useState<FinancialTransactionData[]>([]);
  const [categorizations, setCategorizations] = useState<TransactionCategorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'uncategorized' | 'needs_review'>('uncategorized');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const [insights, setInsights] = useState<{ insights: string[]; anomalies: any[] }>({ insights: [], anomalies: [] });
  const [potentialBills, setPotentialBills] = useState<FinancialTransactionData[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFinancialTransactions();

      // Filter recent transactions (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentTransactions = data.filter(t =>
        new Date(t.date) >= threeMonthsAgo && t.type === 'expense'
      );

      setTransactions(recentTransactions);
      processCategorizations(recentTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCategorizations = async (transactionData: FinancialTransactionData[]) => {
    setProcessing(true);

    try {
      // Bulk categorize all transactions
      const results = expenseCategorizationEngine.bulkCategorize(transactionData);

      const categorizations: TransactionCategorization[] = transactionData.map(transaction => ({
        transaction,
        suggestions: results.get(transaction.id) || [],
        selectedCategory: transaction.category_id,
        isConfirmed: !!transaction.category_id
      }));

      setCategorizations(categorizations);

      // Generate insights
      const spendingInsights = expenseCategorizationEngine.generateSpendingInsights(transactionData);
      setInsights(spendingInsights);

      // Detect potential bills
      const bills = expenseCategorizationEngine.detectPotentialBills(transactionData);
      setPotentialBills(bills);

    } catch (error) {
      console.error('Failed to process categorizations:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCategorySelection = async (transactionId: string, categoryId: string) => {
    try {
      // Update transaction in database
      await apiClient.updateFinancialTransaction(transactionId, {
        category_id: categoryId
      });

      // Update local state
      setCategorizations(prev => prev.map(cat =>
        cat.transaction.id === transactionId
          ? { ...cat, selectedCategory: categoryId, isConfirmed: true }
          : cat
      ));

      // Learn from user selection
      const transaction = categorizations.find(c => c.transaction.id === transactionId)?.transaction;
      if (transaction) {
        expenseCategorizationEngine.learnFromUserCategorization(transaction, categoryId);
      }

    } catch (error) {
      console.error('Failed to update transaction category:', error);
    }
  };

  const handleBulkCategorize = async () => {
    setProcessing(true);

    try {
      const updates = categorizations
        .filter(cat => !cat.isConfirmed && cat.suggestions.length > 0)
        .map(async (cat) => {
          const bestSuggestion = cat.suggestions[0];
          if (bestSuggestion.confidence > 0.7) {
            await handleCategorySelection(cat.transaction.id, bestSuggestion.categoryId);
          }
        });

      await Promise.all(updates);

    } catch (error) {
      console.error('Failed to bulk categorize:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredCategorizations = categorizations.filter(cat => {
    const transaction = cat.transaction;
    const matchesSearch = searchTerm === '' ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'uncategorized':
        return !cat.isConfirmed;
      case 'needs_review':
        return cat.suggestions.length > 0 && cat.suggestions[0].confidence < 0.7;
      default:
        return true;
    }
  });

  const getCategoryIcon = (categoryId: string) => {
    const rules = expenseCategorizationEngine.getCategoryRules();
    const rule = rules.find(r => r.id === categoryId);
    return rule?.icon || '📊';
  };

  const getCategoryColor = (categoryId: string) => {
    const rules = expenseCategorizationEngine.getCategoryRules();
    const rule = rules.find(r => r.id === categoryId);
    return rule?.color || '#6366F1';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading transactions...</span>
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
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            Smart Expense Categorizer
          </h3>
          <p className="text-gray-600">AI-powered transaction categorization and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkCategorize}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4 mr-2" />
            {processing ? 'Processing...' : 'Auto-Categorize'}
          </button>
          <button
            onClick={() => processCategorizations(transactions)}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Insights Panel */}
      {showInsights && (insights.insights.length > 0 || insights.anomalies.length > 0 || potentialBills.length > 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-blue-900 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Smart Insights
            </h4>
            <button
              onClick={() => setShowInsights(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Spending Insights */}
            {insights.insights.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Spending Patterns
                </h5>
                <ul className="space-y-1 text-sm text-blue-800">
                  {insights.insights.map((insight, index) => (
                    <li key={index}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Anomalies */}
            {insights.anomalies.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <h5 className="font-medium text-orange-900 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Unusual Expenses
                </h5>
                <div className="space-y-2 text-sm">
                  {insights.anomalies.slice(0, 3).map((anomaly, index) => (
                    <div key={index} className="text-orange-800">
                      <div className="font-medium">${Math.abs(anomaly.transaction.amount).toFixed(2)} - {anomaly.transaction.payee}</div>
                      <div className="text-xs text-orange-600">{anomaly.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Bills */}
            {potentialBills.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h5 className="font-medium text-green-900 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Recurring Bills Detected
                </h5>
                <div className="space-y-1 text-sm">
                  {potentialBills.slice(0, 3).map((bill, index) => (
                    <div key={index} className="text-green-800">
                      • {bill.payee} - ${Math.abs(bill.amount).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Transactions</option>
            <option value="uncategorized">Uncategorized</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredCategorizations.map((cat) => {
          const transaction = cat.transaction;
          const bestSuggestion = cat.suggestions[0];

          return (
            <div
              key={transaction.id}
              className={`bg-white rounded-lg border p-4 transition-all ${
                cat.isConfirmed
                  ? 'border-green-200 bg-green-50'
                  : bestSuggestion?.confidence > 0.7
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {transaction.payee || transaction.description}
                        </h4>
                        {cat.isConfirmed && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        <span className="font-medium text-red-600">
                          -${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="flex items-center gap-3">
                      {bestSuggestion && !cat.isConfirmed && (
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">AI Suggestion</div>
                          <button
                            onClick={() => handleCategorySelection(transaction.id, bestSuggestion.categoryId)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <span>{getCategoryIcon(bestSuggestion.categoryId)}</span>
                            <span className="text-sm font-medium">{bestSuggestion.categoryName}</span>
                            <span className="text-xs">
                              ({Math.round(bestSuggestion.confidence * 100)}%)
                            </span>
                          </button>
                          <div className="text-xs text-gray-500 mt-1">{bestSuggestion.reason}</div>
                        </div>
                      )}

                      {cat.isConfirmed && cat.selectedCategory && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                          <span>{getCategoryIcon(cat.selectedCategory)}</span>
                          <span className="text-sm font-medium">
                            {expenseCategorizationEngine.getCategoryRules().find(r => r.id === cat.selectedCategory)?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alternative Suggestions */}
                  {!cat.isConfirmed && cat.suggestions.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Other suggestions:</div>
                      <div className="flex flex-wrap gap-2">
                        {cat.suggestions.slice(1, 4).map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleCategorySelection(transaction.id, suggestion.categoryId)}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            {getCategoryIcon(suggestion.categoryId)} {suggestion.categoryName}
                            <span className="ml-1 text-gray-500">
                              ({Math.round(suggestion.confidence * 100)}%)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCategorizations.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'uncategorized' ? 'All transactions categorized!' : 'No transactions found'}
            </h3>
            <p className="text-gray-600">
              {filter === 'uncategorized'
                ? 'Great job! Your transactions are properly categorized.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {categorizations.filter(c => c.isConfirmed).length}
            </div>
            <div className="text-sm text-gray-600">Categorized</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {categorizations.filter(c => !c.isConfirmed && c.suggestions.length > 0 && c.suggestions[0].confidence > 0.7).length}
            </div>
            <div className="text-sm text-gray-600">High Confidence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {potentialBills.length}
            </div>
            <div className="text-sm text-gray-600">Bills Detected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
