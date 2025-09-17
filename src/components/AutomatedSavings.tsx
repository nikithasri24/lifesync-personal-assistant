import { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Settings,
  RefreshCw,
  Download,
  Play,
  Pause,
  Edit,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  CreditCard,
  Building,
  BarChart3,
  Percent,
  Coins,
  TrendingDown,
  Award,
  Bell,
  Lightbulb,
  Calculator,
  X,
  Save
} from 'lucide-react';

interface SavingsRule {
  id: string;
  name: string;
  type: 'round_up' | 'percentage' | 'fixed_amount' | 'goal_based' | 'spare_change';
  isActive: boolean;
  description: string;
  configuration: {
    amount?: number;
    percentage?: number;
    frequency?: 'transaction' | 'daily' | 'weekly' | 'monthly';
    targetGoal?: string;
    multiplier?: number;
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
    accounts?: string[];
  };
  targetAccount: string;
  totalSaved: number;
  savingsThisMonth: number;
  averageSaving: number;
  transactionCount: number;
  createdAt: Date;
  lastTriggered?: Date;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'other';
  autoContribute: boolean;
  monthlyContribution: number;
  rules: string[];
  progress: number;
  estimatedCompletion: Date;
  icon: string;
  color: string;
}

interface SavingsTransaction {
  id: string;
  ruleId: string;
  originalTransactionId: string;
  amount: number;
  roundUpAmount?: number;
  originalAmount?: number;
  date: Date;
  merchant: string;
  category: string;
  targetAccount: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
}

interface SavingsInsight {
  id: string;
  type: 'achievement' | 'suggestion' | 'warning' | 'milestone';
  title: string;
  description: string;
  value?: number;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  date: Date;
  isRead: boolean;
}

const MOCK_SAVINGS_RULES: SavingsRule[] = [
  {
    id: '1',
    name: 'Round-Up Savings',
    type: 'round_up',
    isActive: true,
    description: 'Round up every purchase to the nearest dollar',
    configuration: {
      multiplier: 1,
      minAmount: 0.01,
      maxAmount: 5.00,
      accounts: ['checking', 'credit']
    },
    targetAccount: 'Emergency Fund',
    totalSaved: 485.32,
    savingsThisMonth: 127.85,
    averageSaving: 0.65,
    transactionCount: 196,
    createdAt: new Date('2023-06-15'),
    lastTriggered: new Date('2024-01-22')
  },
  {
    id: '2',
    name: 'Coffee Fund Saver',
    type: 'percentage',
    isActive: true,
    description: 'Save 50% of every coffee purchase',
    configuration: {
      percentage: 50,
      categories: ['dining', 'coffee'],
      frequency: 'transaction'
    },
    targetAccount: 'Vacation Fund',
    totalSaved: 298.45,
    savingsThisMonth: 67.25,
    averageSaving: 4.85,
    transactionCount: 62,
    createdAt: new Date('2023-08-01'),
    lastTriggered: new Date('2024-01-21')
  },
  {
    id: '3',
    name: 'Weekly Auto-Save',
    type: 'fixed_amount',
    isActive: true,
    description: 'Automatically save $50 every week',
    configuration: {
      amount: 50,
      frequency: 'weekly'
    },
    targetAccount: 'House Down Payment',
    totalSaved: 1350.00,
    savingsThisMonth: 200.00,
    averageSaving: 50.00,
    transactionCount: 27,
    createdAt: new Date('2023-05-01'),
    lastTriggered: new Date('2024-01-20')
  },
  {
    id: '4',
    name: 'Paycheck Percentage',
    type: 'percentage',
    isActive: true,
    description: 'Save 20% of every paycheck deposit',
    configuration: {
      percentage: 20,
      categories: ['salary', 'income'],
      frequency: 'transaction'
    },
    targetAccount: 'Investment Account',
    totalSaved: 8850.00,
    savingsThisMonth: 1100.00,
    averageSaving: 1100.00,
    transactionCount: 8,
    createdAt: new Date('2023-01-01'),
    lastTriggered: new Date('2024-01-01')
  },
  {
    id: '5',
    name: 'Spare Change Booster',
    type: 'spare_change',
    isActive: false,
    description: 'Save all transactions under $5',
    configuration: {
      maxAmount: 5.00,
      categories: ['all']
    },
    targetAccount: 'Emergency Fund',
    totalSaved: 156.78,
    savingsThisMonth: 0.00,
    averageSaving: 2.45,
    transactionCount: 64,
    createdAt: new Date('2023-09-15')
  }
];

const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    targetAmount: 15000,
    currentAmount: 8750,
    targetDate: new Date('2024-12-31'),
    priority: 'high',
    category: 'emergency',
    autoContribute: true,
    monthlyContribution: 650,
    rules: ['1', '5'],
    progress: 58.3,
    estimatedCompletion: new Date('2024-09-15'),
    icon: 'shield',
    color: '#EF4444'
  },
  {
    id: '2',
    name: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 2150,
    targetDate: new Date('2024-07-01'),
    priority: 'medium',
    category: 'vacation',
    autoContribute: true,
    monthlyContribution: 425,
    rules: ['2'],
    progress: 43.0,
    estimatedCompletion: new Date('2024-06-20'),
    icon: 'plane',
    color: '#3B82F6'
  },
  {
    id: '3',
    name: 'House Down Payment',
    targetAmount: 80000,
    currentAmount: 22500,
    targetDate: new Date('2026-01-01'),
    priority: 'high',
    category: 'house',
    autoContribute: true,
    monthlyContribution: 2250,
    rules: ['3'],
    progress: 28.1,
    estimatedCompletion: new Date('2025-10-15'),
    icon: 'home',
    color: '#10B981'
  },
  {
    id: '4',
    name: 'Investment Contributions',
    targetAmount: 12000,
    currentAmount: 9200,
    targetDate: new Date('2024-12-31'),
    priority: 'medium',
    category: 'other',
    autoContribute: true,
    monthlyContribution: 1100,
    rules: ['4'],
    progress: 76.7,
    estimatedCompletion: new Date('2024-03-15'),
    icon: 'trending-up',
    color: '#8B5CF6'
  }
];

const MOCK_SAVINGS_TRANSACTIONS: SavingsTransaction[] = [
  {
    id: '1',
    ruleId: '1',
    originalTransactionId: 'txn_001',
    amount: 0.75,
    roundUpAmount: 0.75,
    originalAmount: 8.25,
    date: new Date('2024-01-22'),
    merchant: 'Coffee Shop',
    category: 'dining',
    targetAccount: 'Emergency Fund',
    status: 'completed',
    description: 'Round-up from $8.25 coffee purchase'
  },
  {
    id: '2',
    ruleId: '2',
    originalTransactionId: 'txn_002',
    amount: 2.15,
    originalAmount: 4.30,
    date: new Date('2024-01-21'),
    merchant: 'Starbucks',
    category: 'coffee',
    targetAccount: 'Vacation Fund',
    status: 'completed',
    description: '50% savings on coffee purchase'
  },
  {
    id: '3',
    ruleId: '3',
    originalTransactionId: 'auto_001',
    amount: 50.00,
    date: new Date('2024-01-20'),
    merchant: 'Automatic Transfer',
    category: 'savings',
    targetAccount: 'House Down Payment',
    status: 'completed',
    description: 'Weekly automatic savings'
  },
  {
    id: '4',
    ruleId: '1',
    originalTransactionId: 'txn_003',
    amount: 1.45,
    roundUpAmount: 1.45,
    originalAmount: 23.55,
    date: new Date('2024-01-19'),
    merchant: 'Grocery Store',
    category: 'groceries',
    targetAccount: 'Emergency Fund',
    status: 'completed',
    description: 'Round-up from $23.55 grocery purchase'
  },
  {
    id: '5',
    ruleId: '4',
    originalTransactionId: 'txn_004',
    amount: 1100.00,
    originalAmount: 5500.00,
    date: new Date('2024-01-01'),
    merchant: 'Employer Direct Deposit',
    category: 'salary',
    targetAccount: 'Investment Account',
    status: 'completed',
    description: '20% of salary automatically saved'
  }
];

const MOCK_INSIGHTS: SavingsInsight[] = [
  {
    id: '1',
    type: 'achievement',
    title: 'Savings Milestone Reached!',
    description: 'You\'ve saved over $500 with round-up savings this year. Keep it up!',
    value: 500,
    priority: 'medium',
    date: new Date('2024-01-20'),
    isRead: false
  },
  {
    id: '2',
    type: 'suggestion',
    title: 'Optimize Your Round-Ups',
    description: 'Increase your round-up multiplier to 2x to reach your emergency fund goal 3 months faster.',
    action: 'Adjust Settings',
    priority: 'high',
    date: new Date('2024-01-18'),
    isRead: false
  },
  {
    id: '3',
    type: 'milestone',
    title: 'Emergency Fund 50% Complete',
    description: 'You\'re halfway to your emergency fund goal! You\'re on track to complete it by September.',
    value: 50,
    priority: 'medium',
    date: new Date('2024-01-15'),
    isRead: true
  }
];

export default function AutomatedSavings() {
  const [savingsRules, setSavingsRules] = useState<SavingsRule[]>(MOCK_SAVINGS_RULES);
  const [savingsGoals] = useState<SavingsGoal[]>(MOCK_SAVINGS_GOALS);
  const [savingsTransactions] = useState<SavingsTransaction[]>(MOCK_SAVINGS_TRANSACTIONS);
  const [insights, setInsights] = useState<SavingsInsight[]>(MOCK_INSIGHTS);
  const [showValues, setShowValues] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'rules' | 'goals' | 'transactions' | 'insights'>('overview');
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'round_up' as const,
    description: '',
    amount: '',
    percentage: '',
    frequency: 'transaction' as const,
    targetAccount: 'Emergency Fund'
  });

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const toggleRule = (ruleId: string) => {
    setSavingsRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const totalSavedAllTime = savingsRules.reduce((sum, rule) => sum + rule.totalSaved, 0);
  const totalSavedThisMonth = savingsRules.reduce((sum, rule) => sum + rule.savingsThisMonth, 0);
  const activeRules = savingsRules.filter(rule => rule.isActive).length;
  const projectedMonthlySavings = savingsRules
    .filter(rule => rule.isActive)
    .reduce((sum, rule) => {
      if (rule.configuration.frequency === 'weekly') {
        return sum + (rule.configuration.amount || 0) * 4.33;
      } else if (rule.configuration.frequency === 'monthly') {
        return sum + (rule.configuration.amount || 0);
      }
      return sum + rule.averageSaving * 30;
    }, 0);

  const markInsightAsRead = (insightId: string) => {
    setInsights(insights => 
      insights.map(insight => 
        insight.id === insightId ? { ...insight, isRead: true } : insight
      )
    );
  };

  const handleCreateRule = () => {
    if (!ruleForm.name) return;

    const newRule: SavingsRule = {
      id: Date.now().toString(),
      name: ruleForm.name,
      type: ruleForm.type,
      isActive: true,
      description: ruleForm.description,
      configuration: {
        amount: ruleForm.amount ? parseFloat(ruleForm.amount) : undefined,
        percentage: ruleForm.percentage ? parseFloat(ruleForm.percentage) : undefined,
        frequency: ruleForm.frequency
      },
      targetAccount: ruleForm.targetAccount,
      totalSaved: 0,
      savingsThisMonth: 0,
      averageSaving: 0,
      transactionCount: 0,
      createdAt: new Date()
    };

    setSavingsRules([...savingsRules, newRule]);
    setShowCreateRule(false);
    setRuleForm({
      name: '',
      type: 'round_up',
      description: '',
      amount: '',
      percentage: '',
      frequency: 'transaction',
      targetAccount: 'Emergency Fund'
    });
  };

  const unreadInsights = insights.filter(insight => !insight.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <PiggyBank className="w-8 h-8 mr-3 text-green-600" />
            Automated Savings
          </h3>
          <p className="text-gray-600">Smart savings rules and round-up features</p>
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
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          
          <button
            onClick={() => setShowCreateRule(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Saved</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(totalSavedAllTime)}</p>
              <p className="text-xs text-green-700">All time</p>
            </div>
            <PiggyBank className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">This Month</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(totalSavedThisMonth)}</p>
              <p className="text-xs text-blue-700">Saved so far</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Active Rules</p>
              <p className="text-2xl font-bold text-purple-900">{activeRules}</p>
              <p className="text-xs text-purple-700">of {savingsRules.length} total</p>
            </div>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Projected Monthly</p>
              <p className="text-2xl font-bold text-orange-900">{formatValue(projectedMonthlySavings)}</p>
              <p className="text-xs text-orange-700">At current rate</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Insights Alert */}
      {unreadInsights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-3">
                Savings Insights ({unreadInsights.length})
              </h4>
              <div className="space-y-2">
                {unreadInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className={`p-3 rounded-lg border cursor-pointer hover:bg-opacity-75 transition-colors ${
                    insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                    insight.type === 'suggestion' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`} onClick={() => markInsightAsRead(insight.id)}>
                    <div className="font-medium text-gray-900 text-sm">{insight.title}</div>
                    <div className="text-gray-600 text-sm mt-1">{insight.description}</div>
                    {insight.action && (
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'overview' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('rules')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'rules' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Savings Rules
          </button>
          <button
            onClick={() => setViewMode('goals')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'goals' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'transactions' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'insights' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Rules Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Savings Rules</h4>
            <div className="space-y-3">
              {savingsRules.filter(rule => rule.isActive).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-sm text-gray-600">{rule.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{formatValue(rule.savingsThisMonth)}</div>
                    <div className="text-xs text-gray-500">this month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings Goals Progress */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Savings Goals Progress</h4>
            <div className="space-y-4">
              {savingsGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{goal.name}</span>
                    <span className="text-sm text-gray-600">
                      {formatValue(goal.currentAmount)} / {formatValue(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${goal.progress}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{goal.progress.toFixed(1)}% complete</span>
                    <span>Target: {goal.targetDate.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'rules' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Savings Rules</h4>
            <button
              onClick={() => setShowCreateRule(true)}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Create Rule
            </button>
          </div>

          <div className="space-y-4">
            {savingsRules.map((rule) => (
              <div key={rule.id} className={`p-4 rounded-lg border ${
                rule.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">{rule.name}</h5>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {rule.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Saved:</span>
                        <div className="font-medium text-green-600">{formatValue(rule.totalSaved)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">This Month:</span>
                        <div className="font-medium">{formatValue(rule.savingsThisMonth)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg/Transaction:</span>
                        <div className="font-medium">{formatValue(rule.averageSaving)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Transactions:</span>
                        <div className="font-medium">{rule.transactionCount}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.isActive 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                    >
                      {rule.isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Rule"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{goal.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {goal.priority.toUpperCase()} Priority
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: goal.color }}>
                    {goal.progress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">complete</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">
                      {formatValue(goal.currentAmount)} / {formatValue(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${goal.progress}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Target Date:</span>
                    <div className="font-medium">{goal.targetDate.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Est. Completion:</span>
                    <div className="font-medium">{goal.estimatedCompletion.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Monthly Contribution:</span>
                    <div className="font-medium">{formatValue(goal.monthlyContribution)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Active Rules:</span>
                    <div className="font-medium">{goal.rules.length}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Auto-contribute:</span>
                  <span className={`text-sm font-medium ${
                    goal.autoContribute ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {goal.autoContribute ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'transactions' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Recent Savings Transactions</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Saved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Account</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savingsTransactions.map((transaction) => {
                  const rule = savingsRules.find(r => r.id === transaction.ruleId);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-lg font-medium text-gray-900">{transaction.merchant}</div>
                          <div className="text-sm text-gray-600">{transaction.description}</div>
                          {transaction.originalAmount && (
                            <div className="text-xs text-gray-500">
                              Original: {formatValue(transaction.originalAmount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rule?.name || 'Unknown Rule'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium text-green-600">
                        {formatValue(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.targetAccount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-lg border ${
              insight.isRead ? 'bg-gray-50 border-gray-200' :
              insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
              insight.type === 'suggestion' ? 'bg-yellow-50 border-yellow-200' :
              insight.type === 'milestone' ? 'bg-blue-50 border-blue-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    insight.type === 'achievement' ? 'bg-green-100' :
                    insight.type === 'suggestion' ? 'bg-yellow-100' :
                    insight.type === 'milestone' ? 'bg-blue-100' :
                    'bg-red-100'
                  }`}>
                    {insight.type === 'achievement' ? <Award size={16} className="text-green-600" /> :
                     insight.type === 'suggestion' ? <Lightbulb size={16} className="text-yellow-600" /> :
                     insight.type === 'milestone' ? <Target size={16} className="text-blue-600" /> :
                     <AlertTriangle size={16} className="text-red-600" />}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{insight.title}</h5>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{insight.date.toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                        insight.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {insight.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {insight.value && (
                    <span className="text-lg font-bold text-gray-900">
                      {insight.type === 'milestone' ? `${insight.value}%` : formatValue(insight.value)}
                    </span>
                  )}
                  {insight.action && !insight.isRead && (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      {insight.action}
                    </button>
                  )}
                  {!insight.isRead && (
                    <button
                      onClick={() => markInsightAsRead(insight.id)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Savings Rule</h3>
              <button
                onClick={() => setShowCreateRule(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="My Savings Rule"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={ruleForm.type}
                  onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="round_up">Round-Up Savings</option>
                  <option value="percentage">Percentage Savings</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="spare_change">Spare Change</option>
                </select>
              </div>

              {(ruleForm.type === 'fixed_amount' || ruleForm.type === 'spare_change') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {ruleForm.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={ruleForm.frequency}
                  onChange={(e) => setRuleForm({ ...ruleForm, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="transaction">Per Transaction</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Account
                </label>
                <select
                  value={ruleForm.targetAccount}
                  onChange={(e) => setRuleForm({ ...ruleForm, targetAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Vacation Fund">Vacation Fund</option>
                  <option value="House Down Payment">House Down Payment</option>
                  <option value="Investment Account">Investment Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="Describe how this rule works..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateRule(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!ruleForm.name}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}