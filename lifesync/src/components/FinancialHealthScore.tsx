import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Award,
  Lightbulb,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  DollarSign,
  Percent,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PiggyBank,
  Wallet,
  Building,
  Heart,
  Brain,
  Gauge
} from 'lucide-react';

interface HealthCategory {
  id: string;
  name: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
  description: string;
  factors: HealthFactor[];
  recommendations: string[];
}

interface HealthFactor {
  id: string;
  name: string;
  value: number | string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  recommendation?: string;
}

interface HealthAlert {
  id: string;
  type: 'opportunity' | 'warning' | 'congratulations' | 'action_required';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  daysOld: number;
}

interface FinancialMilestone {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  progress: number;
  targetValue?: number;
  currentValue?: number;
  category: 'saving' | 'investing' | 'debt' | 'planning' | 'protection';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const HEALTH_CATEGORIES: HealthCategory[] = [
  {
    id: 'cash_flow',
    name: 'Cash Flow Management',
    score: 85,
    weight: 25,
    status: 'good',
    trend: 'improving',
    description: 'How well you manage your income and expenses',
    factors: [
      {
        id: 'monthly_surplus',
        name: 'Monthly Surplus',
        value: '$1,250',
        impact: 'positive',
        description: 'You consistently save money each month',
        recommendation: 'Consider increasing your emergency fund contributions'
      },
      {
        id: 'expense_ratio',
        name: 'Expense Ratio',
        value: '68%',
        impact: 'positive',
        description: 'Your expenses are well below your income'
      },
      {
        id: 'irregular_income',
        name: 'Income Stability',
        value: 'Stable',
        impact: 'positive',
        description: 'You have a consistent income source'
      }
    ],
    recommendations: [
      'Automate more of your savings to reach 20% savings rate',
      'Consider setting up separate accounts for different goals',
      'Review subscription services quarterly to optimize spending'
    ]
  },
  {
    id: 'debt_management',
    name: 'Debt Management',
    score: 72,
    weight: 20,
    status: 'good',
    trend: 'improving',
    description: 'Your debt levels and repayment strategy',
    factors: [
      {
        id: 'debt_to_income',
        name: 'Debt-to-Income Ratio',
        value: '28%',
        impact: 'positive',
        description: 'Your debt payments are manageable relative to income'
      },
      {
        id: 'credit_utilization',
        name: 'Credit Utilization',
        value: '45%',
        impact: 'negative',
        description: 'Your credit card utilization is higher than recommended',
        recommendation: 'Try to keep utilization below 30%'
      },
      {
        id: 'payment_history',
        name: 'Payment History',
        value: '100% on-time',
        impact: 'positive',
        description: 'You have a perfect payment history'
      }
    ],
    recommendations: [
      'Pay down credit card balances to improve utilization ratio',
      'Consider debt avalanche method for high-interest debt',
      'Set up automatic payments to maintain perfect payment history'
    ]
  },
  {
    id: 'emergency_fund',
    name: 'Emergency Preparedness',
    score: 65,
    weight: 20,
    status: 'fair',
    trend: 'stable',
    description: 'Your financial safety net and preparedness',
    factors: [
      {
        id: 'emergency_months',
        name: 'Emergency Fund Coverage',
        value: '3.2 months',
        impact: 'neutral',
        description: 'You have adequate emergency savings but could improve',
        recommendation: 'Aim for 6 months of expenses'
      },
      {
        id: 'liquid_access',
        name: 'Liquidity Access',
        value: 'High',
        impact: 'positive',
        description: 'Your emergency funds are easily accessible'
      },
      {
        id: 'insurance_coverage',
        name: 'Insurance Coverage',
        value: 'Partial',
        impact: 'negative',
        description: 'Some insurance gaps identified',
        recommendation: 'Consider disability insurance'
      }
    ],
    recommendations: [
      'Increase emergency fund to 6 months of expenses',
      'Review and update insurance coverage annually',
      'Consider high-yield savings account for emergency fund'
    ]
  },
  {
    id: 'investment_growth',
    name: 'Investment & Growth',
    score: 78,
    weight: 20,
    status: 'good',
    trend: 'improving',
    description: 'Your long-term wealth building strategy',
    factors: [
      {
        id: 'investment_rate',
        name: 'Investment Rate',
        value: '15%',
        impact: 'positive',
        description: 'You invest a healthy percentage of your income'
      },
      {
        id: 'diversification',
        name: 'Portfolio Diversification',
        value: '8.5/10',
        impact: 'positive',
        description: 'Your portfolio is well diversified'
      },
      {
        id: 'retirement_track',
        name: 'Retirement Readiness',
        value: '72%',
        impact: 'positive',
        description: 'You are on track for retirement goals'
      }
    ],
    recommendations: [
      'Consider increasing 401(k) contribution to maximize employer match',
      'Review asset allocation annually',
      'Consider tax-loss harvesting opportunities'
    ]
  },
  {
    id: 'financial_planning',
    name: 'Financial Planning',
    score: 58,
    weight: 15,
    status: 'fair',
    trend: 'stable',
    description: 'Your long-term financial strategy and goals',
    factors: [
      {
        id: 'goal_progress',
        name: 'Goal Achievement',
        value: '3 of 5',
        impact: 'neutral',
        description: 'You are making progress on most financial goals'
      },
      {
        id: 'estate_planning',
        name: 'Estate Planning',
        value: 'Basic',
        impact: 'negative',
        description: 'Basic estate documents in place',
        recommendation: 'Consider updating beneficiaries and will'
      },
      {
        id: 'tax_efficiency',
        name: 'Tax Efficiency',
        value: 'Good',
        impact: 'positive',
        description: 'You are using tax-advantaged accounts effectively'
      }
    ],
    recommendations: [
      'Set up regular goal review sessions quarterly',
      'Update estate planning documents',
      'Consider tax-efficient investment strategies'
    ]
  }
];

const HEALTH_ALERTS: HealthAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Credit Utilization Detected',
    description: 'Your credit utilization is at 45%, which may impact your credit score. Consider paying down balances.',
    impact: 'medium',
    actionable: true,
    daysOld: 3
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Investment Opportunity',
    description: 'You have $2,500 in cash that could be invested. Consider your portfolio allocation.',
    impact: 'medium',
    actionable: true,
    daysOld: 7
  },
  {
    id: '3',
    type: 'congratulations',
    title: 'Savings Goal Achieved!',
    description: 'Congratulations! You\'ve reached your vacation fund goal of $5,000.',
    impact: 'low',
    actionable: false,
    daysOld: 1
  },
  {
    id: '4',
    type: 'action_required',
    title: 'Insurance Review Needed',
    description: 'It\'s been 18 months since your last insurance review. Consider updating your coverage.',
    impact: 'high',
    actionable: true,
    daysOld: 14
  }
];

const FINANCIAL_MILESTONES: FinancialMilestone[] = [
  {
    id: '1',
    title: 'Emergency Fund Complete',
    description: 'Build 6 months of expenses in emergency savings',
    isCompleted: false,
    progress: 53,
    targetValue: 24000,
    currentValue: 12720,
    category: 'saving',
    difficulty: 'beginner'
  },
  {
    id: '2',
    title: 'Debt-Free Journey',
    description: 'Pay off all credit card debt',
    isCompleted: false,
    progress: 67,
    targetValue: 8500,
    currentValue: 2800,
    category: 'debt',
    difficulty: 'intermediate'
  },
  {
    id: '3',
    title: 'Investment Diversification',
    description: 'Achieve optimal portfolio allocation',
    isCompleted: true,
    progress: 100,
    category: 'investing',
    difficulty: 'intermediate'
  },
  {
    id: '4',
    title: 'Retirement Track',
    description: 'Save 15% of income for retirement',
    isCompleted: true,
    progress: 100,
    category: 'investing',
    difficulty: 'intermediate'
  },
  {
    id: '5',
    title: 'Estate Planning Setup',
    description: 'Complete will, beneficiaries, and power of attorney',
    isCompleted: false,
    progress: 25,
    category: 'planning',
    difficulty: 'advanced'
  },
  {
    id: '6',
    title: 'Tax Optimization',
    description: 'Maximize tax-advantaged account contributions',
    isCompleted: false,
    progress: 80,
    category: 'planning',
    difficulty: 'advanced'
  }
];

export default function FinancialHealthScore() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'categories' | 'milestones' | 'insights'>('overview');

  // Calculate overall health score
  const overallScore = Math.round(
    HEALTH_CATEGORIES.reduce((sum, category) => sum + (category.score * category.weight / 100), 0)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={16} className="text-green-600" />;
      case 'declining': return <TrendingDown size={16} className="text-red-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      case 'congratulations': return Award;
      case 'action_required': return Target;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'congratulations': return 'bg-green-50 border-green-200 text-green-800';
      case 'action_required': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cash_flow': return Activity;
      case 'debt_management': return CreditCard;
      case 'emergency_fund': return Shield;
      case 'investment_growth': return TrendingUp;
      case 'financial_planning': return Target;
      default: return BarChart3;
    }
  };

  const getMilestoneIcon = (category: string) => {
    switch (category) {
      case 'saving': return PiggyBank;
      case 'investing': return TrendingUp;
      case 'debt': return CreditCard;
      case 'planning': return Target;
      case 'protection': return Shield;
      default: return Award;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return value.toLocaleString();
  };

  const unreadAlerts = HEALTH_ALERTS.filter(alert => alert.daysOld <= 7);
  const completedMilestones = FINANCIAL_MILESTONES.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gauge className="w-8 h-8 mr-3 text-purple-600" />
            Financial Health Score
          </h3>
          <p className="text-gray-600">Comprehensive analysis of your financial well-being</p>
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
          
          <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Refresh Score
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 relative overflow-hidden">
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getScoreGradient(overallScore)} transition-all duration-1000`}
                style={{ height: `${overallScore}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                  {showValues ? overallScore : '•••'}
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            {overallScore >= 80 ? 'Excellent' : 
             overallScore >= 60 ? 'Good' : 
             overallScore >= 40 ? 'Fair' : 'Needs Improvement'} Financial Health
          </h2>
          
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Your financial health score is based on {HEALTH_CATEGORIES.length} key categories. 
            {overallScore >= 80 ? ' You\'re doing great!' :
             overallScore >= 60 ? ' You\'re on the right track with room for improvement.' :
             ' Focus on the recommendations below to improve your score.'}
          </p>
          
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-gray-600">{completedMilestones} of {FINANCIAL_MILESTONES.length} milestones</span>
            </div>
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-gray-600">{unreadAlerts.length} active alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-3">
                Recent Insights ({unreadAlerts.length})
              </h4>
              <div className="space-y-2">
                {unreadAlerts.slice(0, 3).map((alert) => {
                  const Icon = getAlertIcon(alert.type);
                  return (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                      <div className="flex items-start space-x-2">
                        <Icon size={16} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{alert.title}</div>
                          <div className="text-sm mt-1">{alert.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              viewMode === 'overview' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'categories' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setViewMode('milestones')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'milestones' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'insights' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Scores */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h4>
            <div className="space-y-4">
              {HEALTH_CATEGORIES.map((category) => {
                const Icon = getCategoryIcon(category.id);
                return (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon size={20} className="text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-600">Weight: {category.weight}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                        {showValues ? category.score : '••'}
                      </div>
                      <div className="flex items-center text-sm">
                        {getTrendIcon(category.trend)}
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(category.status)}`}>
                          {category.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Recommendations</h4>
            <div className="space-y-3">
              {HEALTH_CATEGORIES
                .filter(cat => cat.score < 80)
                .sort((a, b) => a.score - b.score)
                .slice(0, 4)
                .map((category) => (
                  <div key={category.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900 text-sm mb-1">{category.name}</div>
                    <div className="text-blue-800 text-sm">
                      {category.recommendations[0]}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'categories' && (
        <div className="space-y-6">
          {HEALTH_CATEGORIES.map((category) => {
            const Icon = getCategoryIcon(category.id);
            const isSelected = selectedCategory === category.id;
            
            return (
              <div 
                key={category.id} 
                className={`bg-white rounded-xl shadow-lg border transition-all cursor-pointer ${
                  isSelected ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Icon size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                        {showValues ? category.score : '••'}
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        {getTrendIcon(category.trend)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(category.status)}`}>
                          {category.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Factors */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Key Factors</h4>
                          <div className="space-y-3">
                            {category.factors.map((factor) => (
                              <div key={factor.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">{factor.name}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    factor.impact === 'positive' ? 'bg-green-100 text-green-800' :
                                    factor.impact === 'negative' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {factor.impact}
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-purple-600 mb-1">
                                  {showValues ? factor.value : '•••••'}
                                </div>
                                <div className="text-sm text-gray-600">{factor.description}</div>
                                {factor.recommendation && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>Tip:</strong> {factor.recommendation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                          <div className="space-y-2">
                            {category.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                                <Lightbulb size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-green-800">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {FINANCIAL_MILESTONES.map((milestone) => {
            const Icon = getMilestoneIcon(milestone.category);
            
            return (
              <div key={milestone.id} className={`p-6 rounded-xl border ${
                milestone.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      milestone.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon size={20} className={
                        milestone.isCompleted ? 'text-green-600' : 'text-gray-600'
                      } />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {milestone.isCompleted && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(milestone.difficulty)}`}>
                      {milestone.difficulty}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{milestone.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        milestone.isCompleted ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>

                  {milestone.targetValue && milestone.currentValue && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {showValues ? `$${milestone.currentValue.toLocaleString()}` : '•••••'} of {showValues ? `$${milestone.targetValue.toLocaleString()}` : '•••••'}
                      </span>
                      <span className={`font-medium ${
                        milestone.isCompleted ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {milestone.isCompleted ? 'Complete!' : `$${(milestone.targetValue - milestone.currentValue).toLocaleString()} to go`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-4">
          {HEALTH_ALERTS.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            
            return (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Icon size={20} className="mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">{alert.title}</h5>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span>{alert.daysOld} days ago</span>
                        <span className={`px-2 py-1 rounded-full ${
                          alert.impact === 'high' ? 'bg-red-100 text-red-700' :
                          alert.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {alert.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                    </div>
                  </div>
                  {alert.actionable && (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}