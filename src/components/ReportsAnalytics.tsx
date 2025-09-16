import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  FileText,
  Target,
  DollarSign,
  CreditCard,
  Home,
  Car,
  ShoppingBag,
  Utensils,
  Coffee,
  Building,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Share,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ReportData {
  categories: CategoryReport[];
  trends: TrendReport[];
  comparisons: ComparisonReport;
  insights: InsightReport[];
  summaries: SummaryReport;
}

interface CategoryReport {
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  thisMonth: number;
  lastMonth: number;
  changePercent: number;
  transactions: number;
  avgTransaction: number;
  budget?: number;
  budgetUsed?: number;
}

interface TrendReport {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
  savingsRate: number;
}

interface ComparisonReport {
  thisMonth: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
  lastMonth: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
  yearToDate: {
    income: number;
    expenses: number;
    net: number;
    avgSavingsRate: number;
  };
}

interface InsightReport {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'action';
  title: string;
  description: string;
  value?: number;
  change?: number;
}

interface SummaryReport {
  topExpenseCategory: string;
  largestExpense: { description: string; amount: number; date: string };
  mostFrequentMerchant: { name: string; transactions: number; amount: number };
  savingsGoalProgress: number;
  debtPaydownProgress: number;
  netWorthChange: number;
}

const MOCK_CATEGORY_DATA: CategoryReport[] = [
  {
    category: 'Housing',
    icon: Home,
    color: '#3B82F6',
    thisMonth: 1850,
    lastMonth: 1800,
    changePercent: 2.8,
    transactions: 3,
    avgTransaction: 616.67,
    budget: 2000,
    budgetUsed: 92.5
  },
  {
    category: 'Groceries',
    icon: ShoppingBag,
    color: '#10B981',
    thisMonth: 580,
    lastMonth: 645,
    changePercent: -10.1,
    transactions: 12,
    avgTransaction: 48.33,
    budget: 600,
    budgetUsed: 96.7
  },
  {
    category: 'Transportation',
    icon: Car,
    color: '#F59E0B',
    thisMonth: 420,
    lastMonth: 380,
    changePercent: 10.5,
    transactions: 8,
    avgTransaction: 52.50,
    budget: 450,
    budgetUsed: 93.3
  },
  {
    category: 'Dining Out',
    icon: Utensils,
    color: '#EF4444',
    thisMonth: 320,
    lastMonth: 280,
    changePercent: 14.3,
    transactions: 15,
    avgTransaction: 21.33,
    budget: 250,
    budgetUsed: 128.0
  },
  {
    category: 'Entertainment',
    icon: Gamepad2,
    color: '#8B5CF6',
    thisMonth: 180,
    lastMonth: 220,
    changePercent: -18.2,
    transactions: 6,
    avgTransaction: 30.00,
    budget: 200,
    budgetUsed: 90.0
  },
  {
    category: 'Healthcare',
    icon: Heart,
    color: '#EC4899',
    thisMonth: 150,
    lastMonth: 85,
    changePercent: 76.5,
    transactions: 4,
    avgTransaction: 37.50
  }
];

const MOCK_TREND_DATA: TrendReport[] = [
  { month: 'Jul 2023', income: 5200, expenses: 3850, netIncome: 1350, savingsRate: 26.0 },
  { month: 'Aug 2023', income: 5200, expenses: 4100, netIncome: 1100, savingsRate: 21.2 },
  { month: 'Sep 2023', income: 5200, expenses: 3920, netIncome: 1280, savingsRate: 24.6 },
  { month: 'Oct 2023', income: 5200, expenses: 4250, netIncome: 950, savingsRate: 18.3 },
  { month: 'Nov 2023', income: 5200, expenses: 3800, netIncome: 1400, savingsRate: 26.9 },
  { month: 'Dec 2023', income: 6100, expenses: 4500, netIncome: 1600, savingsRate: 26.2 }
];

const MOCK_INSIGHTS: InsightReport[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Dining Budget Exceeded',
    description: 'You\'ve spent 28% more than budgeted on dining out this month',
    value: 320,
    change: 28
  },
  {
    id: '2',
    type: 'positive',
    title: 'Grocery Spending Down',
    description: 'Great job reducing grocery expenses by 10% compared to last month',
    value: 580,
    change: -10.1
  },
  {
    id: '3',
    type: 'action',
    title: 'High Healthcare Costs',
    description: 'Healthcare spending increased 76% - review insurance coverage',
    value: 150,
    change: 76.5
  },
  {
    id: '4',
    type: 'neutral',
    title: 'Savings Rate Target',
    description: 'You\'re on track to meet your 25% savings rate goal this month',
    value: 24.6
  }
];

export default function ReportsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'quarter' | 'year'>('thisMonth');
  const [selectedReport, setSelectedReport] = useState<'spending' | 'income' | 'trends' | 'categories' | 'comparison'>('spending');
  const [showValues, setShowValues] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'warning': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'action': return <Zap className="w-5 h-5 text-orange-600" />;
      default: return <Target className="w-5 h-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-red-200 bg-red-50';
      case 'action': return 'border-orange-200 bg-orange-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const totalExpenses = MOCK_CATEGORY_DATA.reduce((sum, cat) => sum + cat.thisMonth, 0);
  const totalBudget = MOCK_CATEGORY_DATA.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const budgetVariance = ((totalExpenses - totalBudget) / totalBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-purple-600" />
            Reports & Analytics
          </h3>
          <p className="text-gray-600">Detailed financial insights and reporting</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Share size={16} className="mr-2" />
            Share
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="spending">Spending Analysis</option>
                <option value="income">Income Analysis</option>
                <option value="trends">Trend Analysis</option>
                <option value="categories">Category Breakdown</option>
                <option value="comparison">Period Comparison</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Report generated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Income</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(5500)}</p>
              <p className="text-xs text-green-700">+2.3% vs last month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">{formatValue(totalExpenses)}</p>
              <p className="text-xs text-red-700">+5.7% vs last month</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Net Income</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(5500 - totalExpenses)}</p>
              <p className="text-xs text-blue-700">Savings Rate: {(((5500 - totalExpenses) / 5500) * 100).toFixed(1)}%</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 border ${
          budgetVariance > 0 
            ? 'from-orange-50 to-orange-100 border-orange-200' 
            : 'from-purple-50 to-purple-100 border-purple-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${budgetVariance > 0 ? 'text-orange-800' : 'text-purple-800'}`}>
                Budget Variance
              </p>
              <p className={`text-2xl font-bold ${budgetVariance > 0 ? 'text-orange-900' : 'text-purple-900'}`}>
                {formatPercent(budgetVariance)}
              </p>
              <p className={`text-xs ${budgetVariance > 0 ? 'text-orange-700' : 'text-purple-700'}`}>
                {budgetVariance > 0 ? 'Over budget' : 'Under budget'}
              </p>
            </div>
            <Target className={`w-8 h-8 ${budgetVariance > 0 ? 'text-orange-600' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_INSIGHTS.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}>
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  {insight.value && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">{formatValue(insight.value)}</span>
                      {insight.change && (
                        <span className={`${
                          insight.change >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ({formatPercent(insight.change)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">
            {selectedReport === 'spending' ? 'Spending Analysis' :
             selectedReport === 'income' ? 'Income Analysis' :
             selectedReport === 'trends' ? 'Trend Analysis' :
             selectedReport === 'categories' ? 'Category Breakdown' :
             'Period Comparison'}
          </h4>
          
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-gray-400" />
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Interactive {selectedReport} chart coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Showing {selectedPeriod} data</p>
          </div>
        </div>
      </div>

      {/* Category Analysis Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Category Analysis</h4>
            <div className="text-sm text-gray-500">
              {MOCK_CATEGORY_DATA.length} categories • {selectedPeriod}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">This Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Last Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Transaction</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {MOCK_CATEGORY_DATA
                .sort((a, b) => b.thisMonth - a.thisMonth)
                .map((category) => {
                  const Icon = category.icon;
                  return (
                    <tr key={category.category} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Icon size={18} style={{ color: category.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{category.category}</div>
                            <div className="text-xs text-gray-500">{category.transactions} transactions</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatValue(category.thisMonth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {formatValue(category.lastMonth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={`${
                          category.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {category.changePercent >= 0 ? 
                            <ArrowUpRight className="w-4 h-4 inline mr-1" /> : 
                            <ArrowDownRight className="w-4 h-4 inline mr-1" />
                          }
                          {formatPercent(Math.abs(category.changePercent))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {formatValue(category.avgTransaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {category.budget ? (
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              (category.budgetUsed || 0) > 100 ? 'text-red-600' :
                              (category.budgetUsed || 0) > 80 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {category.budgetUsed?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatValue(category.budget)} budget
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No budget</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">6-month trend chart coming soon</p>
                <p className="text-sm text-gray-500 mt-1">Income vs Expenses over time</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900">Trend Highlights</h5>
            {MOCK_TREND_DATA.slice(-3).map((trend, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">{trend.month}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-medium">{formatValue(trend.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-medium">{formatValue(trend.expenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Rate:</span>
                    <span className={`font-medium ${
                      trend.savingsRate >= 20 ? 'text-green-600' : 
                      trend.savingsRate >= 10 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {trend.savingsRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}