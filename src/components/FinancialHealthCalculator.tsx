// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  PieChart,
  BarChart3,
  Lightbulb,
  Award,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { FinancialTransactionData, FinancialAccountData } from '../services/types';

interface FinancialHealthMetric {
  id: string;
  name: string;
  category: 'debt' | 'savings' | 'spending' | 'income' | 'emergency';
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendation: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface HealthScoreBreakdown {
  overall: number;
  categories: {
    debt: number;
    savings: number;
    spending: number;
    income: number;
    emergency: number;
  };
  metrics: FinancialHealthMetric[];
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export default function FinancialHealthCalculator() {
  const [healthScore, setHealthScore] = useState<HealthScoreBreakdown | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransactionData[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

      // Calculate health score
      const score = calculateFinancialHealth(transactionData, accountData);
      setHealthScore(score);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialHealth = (
    transactions: FinancialTransactionData[],
    accounts: FinancialAccountData[]
  ): HealthScoreBreakdown => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

    // Filter recent transactions
    const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);

    // Calculate basic financial metrics
    const monthlyIncome = calculateMonthlyIncome(recentTransactions);
    const monthlyExpenses = calculateMonthlyExpenses(recentTransactions);
    const totalAssets = accounts.filter(a => a.type !== 'credit').reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = Math.abs(accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.balance, 0));
    const netWorth = totalAssets - totalDebt;
    const emergencyFund = accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);

    // Calculate individual metrics
    const metrics: FinancialHealthMetric[] = [
      // Debt-to-Income Ratio
      {
        id: 'debt-to-income',
        name: 'Debt-to-Income Ratio',
        category: 'debt',
        score: calculateDebtToIncomeScore(totalDebt, monthlyIncome),
        weight: 25,
        status: getDebtToIncomeStatus(totalDebt / monthlyIncome),
        description: 'Your total debt payments compared to monthly income',
        recommendation: getDebtToIncomeRecommendation(totalDebt / monthlyIncome),
        currentValue: (totalDebt / monthlyIncome) * 100,
        targetValue: 30,
        unit: '%',
        trend: 'stable'
      },

      // Emergency Fund
      {
        id: 'emergency-fund',
        name: 'Emergency Fund Coverage',
        category: 'emergency',
        score: calculateEmergencyFundScore(emergencyFund, monthlyExpenses),
        weight: 20,
        status: getEmergencyFundStatus(emergencyFund / monthlyExpenses),
        description: 'Months of expenses covered by emergency savings',
        recommendation: getEmergencyFundRecommendation(emergencyFund / monthlyExpenses),
        currentValue: emergencyFund / monthlyExpenses,
        targetValue: 6,
        unit: 'months',
        trend: 'up'
      },

      // Savings Rate
      {
        id: 'savings-rate',
        name: 'Savings Rate',
        category: 'savings',
        score: calculateSavingsRateScore(monthlyIncome, monthlyExpenses),
        weight: 20,
        status: getSavingsRateStatus((monthlyIncome - monthlyExpenses) / monthlyIncome),
        description: 'Percentage of income saved each month',
        recommendation: getSavingsRateRecommendation((monthlyIncome - monthlyExpenses) / monthlyIncome),
        currentValue: ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100,
        targetValue: 20,
        unit: '%',
        trend: 'up'
      },

      // Spending Consistency
      {
        id: 'spending-consistency',
        name: 'Spending Consistency',
        category: 'spending',
        score: calculateSpendingConsistencyScore(recentTransactions),
        weight: 15,
        status: getSpendingConsistencyStatus(recentTransactions),
        description: 'How consistent your spending patterns are',
        recommendation: 'Maintain regular spending habits to improve financial predictability',
        currentValue: calculateSpendingVariance(recentTransactions),
        targetValue: 15,
        unit: '%',
        trend: 'stable'
      },

      // Net Worth Growth
      {
        id: 'net-worth-growth',
        name: 'Net Worth Trend',
        category: 'income',
        score: calculateNetWorthScore(netWorth, monthlyIncome),
        weight: 20,
        status: getNetWorthStatus(netWorth),
        description: 'Overall financial position and growth trajectory',
        recommendation: getNetWorthRecommendation(netWorth, monthlyIncome),
        currentValue: netWorth,
        targetValue: monthlyIncome * 12,
        unit: '$',
        trend: netWorth > 0 ? 'up' : 'down'
      }
    ];

    // Calculate category scores
    const categories = {
      debt: metrics.filter(m => m.category === 'debt').reduce((sum, m) => sum + m.score, 0) / metrics.filter(m => m.category === 'debt').length,
      savings: metrics.filter(m => m.category === 'savings').reduce((sum, m) => sum + m.score, 0) / metrics.filter(m => m.category === 'savings').length,
      spending: metrics.filter(m => m.category === 'spending').reduce((sum, m) => sum + m.score, 0) / metrics.filter(m => m.category === 'spending').length,
      income: metrics.filter(m => m.category === 'income').reduce((sum, m) => sum + m.score, 0) / metrics.filter(m => m.category === 'income').length,
      emergency: metrics.filter(m => m.category === 'emergency').reduce((sum, m) => sum + m.score, 0) / metrics.filter(m => m.category === 'emergency').length
    };

    // Calculate overall score
    const overall = metrics.reduce((sum, metric) => sum + (metric.score * metric.weight), 0) / 100;

    // Generate insights and recommendations
    const insights = generateInsights(metrics, monthlyIncome, monthlyExpenses, netWorth);
    const recommendations = generateRecommendations(metrics);
    const riskFactors = identifyRiskFactors(metrics, accounts);

    return {
      overall,
      categories,
      metrics,
      insights,
      recommendations,
      riskFactors
    };
  };

  // Helper calculation functions
  const calculateMonthlyIncome = (transactions: FinancialTransactionData[]): number => {
    const income = transactions.filter(t => t.type === 'income');
    return income.reduce((sum, t) => sum + t.amount, 0) / 3; // 3 months average
  };

  const calculateMonthlyExpenses = (transactions: FinancialTransactionData[]): number => {
    const expenses = transactions.filter(t => t.type === 'expense');
    return Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0)) / 3; // 3 months average
  };

  const calculateDebtToIncomeScore = (debt: number, income: number): number => {
    const ratio = debt / income;
    if (ratio <= 0.2) return 100;
    if (ratio <= 0.3) return 80;
    if (ratio <= 0.4) return 60;
    if (ratio <= 0.5) return 40;
    return 20;
  };

  const calculateEmergencyFundScore = (fund: number, expenses: number): number => {
    const months = fund / expenses;
    if (months >= 6) return 100;
    if (months >= 3) return 80;
    if (months >= 1) return 60;
    if (months >= 0.5) return 40;
    return 20;
  };

  const calculateSavingsRateScore = (income: number, expenses: number): number => {
    const rate = (income - expenses) / income;
    if (rate >= 0.3) return 100;
    if (rate >= 0.2) return 80;
    if (rate >= 0.1) return 60;
    if (rate >= 0.05) return 40;
    return 20;
  };

  const calculateSpendingConsistencyScore = (transactions: FinancialTransactionData[]): number => {
    // Calculate variance in monthly spending
    const variance = calculateSpendingVariance(transactions);
    if (variance <= 10) return 100;
    if (variance <= 20) return 80;
    if (variance <= 30) return 60;
    if (variance <= 40) return 40;
    return 20;
  };

  const calculateSpendingVariance = (transactions: FinancialTransactionData[]): number => {
    // Group expenses by month and calculate variance
    const monthlyExpenses: { [key: string]: number } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + Math.abs(t.amount);
    });

    const amounts = Object.values(monthlyExpenses);
    if (amounts.length === 0) return 0;

    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;

    return (Math.sqrt(variance) / mean) * 100; // Coefficient of variation as percentage
  };

  const calculateNetWorthScore = (netWorth: number, monthlyIncome: number): number => {
    const months = netWorth / monthlyIncome;
    if (months >= 24) return 100;
    if (months >= 12) return 80;
    if (months >= 6) return 60;
    if (months >= 0) return 40;
    return 20;
  };

  // Status calculation functions
  const getDebtToIncomeStatus = (ratio: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (ratio <= 0.2) return 'excellent';
    if (ratio <= 0.3) return 'good';
    if (ratio <= 0.4) return 'fair';
    return 'poor';
  };

  const getEmergencyFundStatus = (months: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (months >= 6) return 'excellent';
    if (months >= 3) return 'good';
    if (months >= 1) return 'fair';
    return 'poor';
  };

  const getSavingsRateStatus = (rate: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (rate >= 0.2) return 'excellent';
    if (rate >= 0.15) return 'good';
    if (rate >= 0.1) return 'fair';
    return 'poor';
  };

  const getSpendingConsistencyStatus = (transactions: FinancialTransactionData[]): 'excellent' | 'good' | 'fair' | 'poor' => {
    const variance = calculateSpendingVariance(transactions);
    if (variance <= 15) return 'excellent';
    if (variance <= 25) return 'good';
    if (variance <= 35) return 'fair';
    return 'poor';
  };

  const getNetWorthStatus = (netWorth: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (netWorth > 100000) return 'excellent';
    if (netWorth > 50000) return 'good';
    if (netWorth > 0) return 'fair';
    return 'poor';
  };

  // Recommendation functions
  const getDebtToIncomeRecommendation = (ratio: number): string => {
    if (ratio <= 0.2) return 'Excellent debt management! Consider investing extra income.';
    if (ratio <= 0.3) return 'Good debt levels. Focus on paying down highest interest debt first.';
    if (ratio <= 0.4) return 'Consider debt consolidation and create a payoff plan.';
    return 'High debt levels. Prioritize debt reduction and avoid new debt.';
  };

  const getEmergencyFundRecommendation = (months: number): string => {
    if (months >= 6) return 'Excellent emergency fund! Consider investing excess savings.';
    if (months >= 3) return 'Good emergency fund. Work towards 6 months of expenses.';
    if (months >= 1) return 'Build your emergency fund to 3-6 months of expenses.';
    return 'Start building an emergency fund immediately. Aim for $1,000 first.';
  };

  const getSavingsRateRecommendation = (rate: number): string => {
    if (rate >= 0.2) return 'Excellent savings rate! You\'re on track for early retirement.';
    if (rate >= 0.15) return 'Good savings rate. Consider increasing to 20% if possible.';
    if (rate >= 0.1) return 'Decent savings rate. Look for ways to reduce expenses or increase income.';
    return 'Low savings rate. Review your budget and find areas to cut expenses.';
  };

  const getNetWorthRecommendation = (netWorth: number, monthlyIncome: number): string => {
    if (netWorth > monthlyIncome * 24) return 'Strong net worth! Focus on investment diversification.';
    if (netWorth > monthlyIncome * 12) return 'Good net worth growth. Continue building wealth.';
    if (netWorth > 0) return 'Positive net worth. Focus on increasing assets and reducing debt.';
    return 'Negative net worth. Prioritize debt reduction and building emergency fund.';
  };

  // Insight generation
  const generateInsights = (metrics: FinancialHealthMetric[], income: number, expenses: number, netWorth: number): string[] => {
    const insights: string[] = [];

    if (income > expenses) {
      insights.push(`You have a positive cash flow of $${(income - expenses).toFixed(2)} per month.`);
    }

    const savingsMetric = metrics.find(m => m.id === 'savings-rate');
    if (savingsMetric && savingsMetric.score >= 80) {
      insights.push('Your savings rate is above average, putting you on a strong financial path.');
    }

    const debtMetric = metrics.find(m => m.id === 'debt-to-income');
    if (debtMetric && debtMetric.score <= 40) {
      insights.push('High debt levels are impacting your financial health significantly.');
    }

    if (netWorth > income * 6) {
      insights.push('Your net worth exceeds 6 months of income, showing strong financial stability.');
    }

    return insights;
  };

  const generateRecommendations = (metrics: FinancialHealthMetric[]): string[] => {
    return metrics
      .filter(m => m.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(m => m.recommendation);
  };

  const identifyRiskFactors = (metrics: FinancialHealthMetric[], accounts: FinancialAccountData[]): string[] => {
    const risks: string[] = [];

    const emergencyMetric = metrics.find(m => m.id === 'emergency-fund');
    if (emergencyMetric && emergencyMetric.score < 60) {
      risks.push('Insufficient emergency fund increases financial vulnerability');
    }

    const debtMetric = metrics.find(m => m.id === 'debt-to-income');
    if (debtMetric && debtMetric.score < 60) {
      risks.push('High debt-to-income ratio limits financial flexibility');
    }

    if (accounts.filter(a => a.type === 'investment').length === 0) {
      risks.push('No investment accounts detected - missing growth opportunities');
    }

    return risks;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'debt': return Shield;
      case 'savings': return PieChart;
      case 'spending': return DollarSign;
      case 'income': return TrendingUp;
      case 'emergency': return Heart;
      default: return BarChart3;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating financial health...</span>
        </div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Calculate Health Score</h3>
          <p className="text-gray-600">Please ensure you have financial data available.</p>
        </div>
      </div>
    );
  }

  const filteredMetrics = selectedCategory === 'all'
    ? healthScore.metrics
    : healthScore.metrics.filter(m => m.category === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-red-500" />
            Financial Health Score
          </h3>
          <p className="text-gray-600">Comprehensive analysis of your financial wellbeing</p>
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`bg-gradient-to-br rounded-xl p-8 border-2 ${getScoreBackground(healthScore.overall)}`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full border-8 ${
                healthScore.overall >= 80 ? 'border-green-500' :
                healthScore.overall >= 60 ? 'border-yellow-500' :
                healthScore.overall >= 40 ? 'border-orange-500' : 'border-red-500'
              } flex items-center justify-center`}>
                <span className={`text-4xl font-bold ${getScoreColor(healthScore.overall)}`}>
                  {Math.round(healthScore.overall)}
                </span>
              </div>
              <div className="absolute top-0 right-0">
                <Award className={`w-8 h-8 ${
                  healthScore.overall >= 80 ? 'text-green-500' :
                  healthScore.overall >= 60 ? 'text-yellow-500' :
                  healthScore.overall >= 40 ? 'text-orange-500' : 'text-red-500'
                }`} />
              </div>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${getScoreColor(healthScore.overall)}`}>
            {healthScore.overall >= 80 ? 'Excellent' :
             healthScore.overall >= 60 ? 'Good' :
             healthScore.overall >= 40 ? 'Fair' : 'Needs Improvement'}
          </h2>
          <p className="text-lg text-gray-600">
            Your financial health score is {Math.round(healthScore.overall)} out of 100
          </p>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(healthScore.categories).map(([category, score]) => {
          const Icon = getCategoryIcon(category);
          return (
            <div
              key={category}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category ? 'ring-2 ring-blue-500' : ''
              } ${getScoreBackground(score)}`}
              onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${getScoreColor(score)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {Math.round(score)}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {healthScore.insights.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Key Insights</h4>
          </div>
          <ul className="space-y-2">
            {healthScore.insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {healthScore.recommendations.length > 0 && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            <h4 className="text-lg font-semibold text-green-900">Priority Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {healthScore.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <ArrowUp className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-green-800">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {healthScore.riskFactors.length > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            <h4 className="text-lg font-semibold text-red-900">Risk Factors</h4>
          </div>
          <ul className="space-y-2">
            {healthScore.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start">
                <ArrowDown className="w-4 h-4 mr-2 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-red-800">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Detailed Metrics</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="debt">Debt Management</option>
                <option value="savings">Savings</option>
                <option value="spending">Spending</option>
                <option value="income">Income</option>
                <option value="emergency">Emergency Fund</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMetrics.map((metric) => (
              <div key={metric.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(metric.status)}
                    <h5 className="font-semibold text-gray-900 ml-2">{metric.name}</h5>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                      {Math.round(metric.score)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/100</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{metric.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Current</span>
                    <div className="font-semibold">
                      {metric.unit === '$' ? '$' : ''}{metric.currentValue.toFixed(metric.unit === '$' ? 0 : 1)}{metric.unit !== '$' ? metric.unit : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Target</span>
                    <div className="font-semibold text-gray-600">
                      {metric.unit === '$' ? '$' : ''}{metric.targetValue.toFixed(metric.unit === '$' ? 0 : 1)}{metric.unit !== '$' ? metric.unit : ''}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(metric.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        metric.score >= 80 ? 'bg-green-500' :
                        metric.score >= 60 ? 'bg-yellow-500' :
                        metric.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(metric.score, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start">
                    <Lightbulb className="w-4 h-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{metric.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
