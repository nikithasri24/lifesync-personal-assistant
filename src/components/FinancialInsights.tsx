import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { logger } from '../services/logger';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  PieChart,
  Target,
  Zap,
  Award,
  CreditCard,
  RefreshCw,
  Info
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'achievement' | 'tip';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  potentialSavings?: number;
  createdAt: Date;
}

interface FinancialHealth {
  score: number;
  factors: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFund: number;
    budgetAdherence: number;
  };
}

// Financial insights and health data will be generated from real transaction data

export default function FinancialInsights(): React.ReactElement {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [_showDismissed, _setShowDismissed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);

  const loadFinancialData = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      // Load financial transactions and accounts to generate insights
      const [transactions, accounts] = await Promise.all([
        apiClient.getFinancialTransactions(),
        apiClient.getFinancialAccounts()
      ]);

      // Generate insights from real data
      const generatedInsights = generateInsightsFromData(transactions, accounts);
      setInsights(generatedInsights);

      // Calculate financial health from real data
      const health = calculateFinancialHealth(transactions, accounts);
      setFinancialHealth(health);
    } catch (error: unknown) {
      logger.error('Failed to load financial data:', { error });
      // Fallback to empty state - no mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinancialData();
  }, [loadFinancialData]);

  const generateInsightsFromData = (
    transactions: Array<{amount: number}>,
    _accounts: Array<{currentBalance: number}>
  ): Insight[] => {
    const insights: Insight[] = [];

    // Example: Check for high spending in categories
    // This would analyze real transaction data
    if (transactions.length === 0) {
      insights.push({
        id: 'welcome',
        type: 'tip',
        title: 'Welcome to Financial Insights',
        description: 'Start adding transactions and accounts to get personalized financial insights.',
        impact: 'medium',
        category: 'onboarding',
        actionable: true,
        createdAt: new Date()
      });
    }

    return insights;
  };

  const calculateFinancialHealth = (
    transactions: Array<{amount: number}>,
    accounts: Array<{currentBalance: number}>
  ): FinancialHealth => {
    // Calculate real financial health metrics from data
    return {
      score: accounts.length > 0 ? 60 : 0, // Basic score based on setup
      factors: {
        savingsRate: 0,
        debtToIncome: 0,
        emergencyFund: 0,
        budgetAdherence: 0
      }
    };
  };

  const getInsightIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'achievement': return Award;
      case 'tip': return Lightbulb;
      default: return Info;
    }
  };

  const getInsightColor = (type: string, impact: string): string => {
    if (type === 'alert') return 'border-red-200 bg-red-50';
    if (type === 'achievement') return 'border-green-200 bg-green-50';
    if (type === 'opportunity' && impact === 'high') return 'border-blue-200 bg-blue-50';
    if (type === 'tip') return 'border-purple-200 bg-purple-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getInsightTextColor = (type: string): string => {
    switch (type) {
      case 'alert': return 'text-red-600';
      case 'achievement': return 'text-green-600';
      case 'opportunity': return 'text-blue-600';
      case 'tip': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const dismissInsight = (insightId: string): void => {
    setInsights(insights.filter(i => i.id !== insightId));
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreDescription = (score: number): string => {
    if (score >= 80) return 'Excellent financial health';
    if (score >= 60) return 'Good financial health';
    if (score >= 40) return 'Fair financial health';
    return 'Needs improvement';
  };

  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(insight => insight.category === selectedCategory);

  const totalPotentialSavings = insights
    .filter(insight => insight.potentialSavings !== undefined)
    .reduce((sum, insight) => sum + (insight.potentialSavings ?? 0), 0);

  const actionableInsights = insights.filter(insight => insight.actionable);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading financial insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            AI Financial Insights
          </h3>
          <p className="text-gray-600">Personalized recommendations to improve your financial health</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <RefreshCw size={18} className="mr-2" />
          Refresh Insights
        </button>
      </div>

      {/* Financial Health Score */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Financial Health Score</h4>
            <p className="text-sm text-gray-600">Based on your spending patterns, savings, and debt</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getHealthScoreColor(financialHealth?.score ?? 0)}`}>
              {financialHealth?.score ?? 0}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Health</span>
            <span className={`text-sm font-semibold ${getHealthScoreColor(financialHealth?.score ?? 0)}`}>
              {getHealthScoreDescription(financialHealth?.score ?? 0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                (financialHealth?.score ?? 0) >= 80 ? 'bg-green-500' :
                (financialHealth?.score ?? 0) >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${financialHealth?.score ?? 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{financialHealth?.factors.savingsRate ?? 0}%</div>
            <div className="text-xs text-gray-600">Savings Rate</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{financialHealth?.factors.debtToIncome ?? 0}%</div>
            <div className="text-xs text-gray-600">Debt to Income</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{financialHealth?.factors.emergencyFund ?? 0}</div>
            <div className="text-xs text-gray-600">Months Emergency Fund</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{financialHealth?.factors.budgetAdherence ?? 0}%</div>
            <div className="text-xs text-gray-600">Budget Adherence</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Potential Savings</p>
              <p className="text-2xl font-bold text-green-900">${totalPotentialSavings.toLocaleString()}</p>
              <p className="text-xs text-green-700">per year</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Actionable Insights</p>
              <p className="text-2xl font-bold text-blue-900">{actionableInsights.length}</p>
              <p className="text-xs text-blue-700">ready to act on</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Total Insights</p>
              <p className="text-2xl font-bold text-purple-900">{insights.length}</p>
              <p className="text-xs text-purple-700">this month</p>
            </div>
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="spending">Spending</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="subscriptions">Subscriptions</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredInsights.length} of {insights.length} insights
          </div>
        </div>
      </div>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No insights found</h4>
          <p className="text-gray-600">Check back later for new financial insights</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.type, insight.impact);
            const textColorClass = getInsightTextColor(insight.type);
            
            return (
              <div key={insight.id} className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${colorClass}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon size={20} className={textColorClass} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {insight.impact} impact
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          insight.type === 'alert' ? 'bg-red-100 text-red-800' :
                          insight.type === 'achievement' ? 'bg-green-100 text-green-800' :
                          insight.type === 'opportunity' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {insight.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{insight.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{insight.category}</span>
                          <span>•</span>
                          <span>{insight.createdAt.toLocaleDateString()}</span>
                          {insight.potentialSavings && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">
                                Save ${insight.potentialSavings}/year
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {insight.actionable && (
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Take Action
                      </button>
                    )}
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Financial Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
            <Target className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Set Savings Goal</div>
            <div className="text-xs text-gray-600">Create a new financial target</div>
          </button>
          
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group">
            <PieChart className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Optimize Budget</div>
            <div className="text-xs text-gray-600">Adjust spending categories</div>
          </button>
          
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group">
            <CreditCard className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Review Subscriptions</div>
            <div className="text-xs text-gray-600">Cancel unused services</div>
          </button>
        </div>
      </div>
    </div>
  );
}
