import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  DollarSign,
  PieChart,
  Calendar,
  Zap,
  Award,
  Info,
  ArrowRight,
  BookOpen,
  Shield,
  Rocket,
  Heart,
  Home,
  Car,
  ShoppingBag,
  Coffee,
  Gamepad2,
  Settings,
  RefreshCw
} from 'lucide-react';

interface SpendingPattern {
  category: string;
  currentSpend: number;
  avgSpend: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  variance: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface BudgetRecommendation {
  id: string;
  type: 'reduction' | 'reallocation' | 'increase' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  currentAmount: number;
  suggestedAmount: number;
  potentialSavings: number;
  timeframe: string;
  actionItems: string[];
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface SmartInsight {
  id: string;
  type: 'spending_alert' | 'savings_opportunity' | 'goal_adjustment' | 'trend_analysis';
  title: string;
  message: string;
  actionable: boolean;
  severity: 'info' | 'warning' | 'success' | 'error';
  icon: React.ComponentType<any>;
  data?: any;
}

const SPENDING_PATTERNS: SpendingPattern[] = [
  {
    category: 'Dining',
    currentSpend: 450,
    avgSpend: 350,
    trend: 'increasing',
    variance: 28.6,
    icon: Coffee,
    color: '#F59E0B'
  },
  {
    category: 'Transportation',
    currentSpend: 320,
    avgSpend: 380,
    trend: 'decreasing',
    variance: -15.8,
    icon: Car,
    color: '#3B82F6'
  },
  {
    category: 'Shopping',
    currentSpend: 680,
    avgSpend: 500,
    trend: 'increasing',
    variance: 36.0,
    icon: ShoppingBag,
    color: '#EC4899'
  },
  {
    category: 'Entertainment',
    currentSpend: 180,
    avgSpend: 220,
    trend: 'stable',
    variance: -18.2,
    icon: Gamepad2,
    color: '#8B5CF6'
  },
  {
    category: 'Housing',
    currentSpend: 1500,
    avgSpend: 1500,
    trend: 'stable',
    variance: 0,
    icon: Home,
    color: '#10B981'
  }
];

const BUDGET_RECOMMENDATIONS: BudgetRecommendation[] = [
  {
    id: '1',
    type: 'reduction',
    priority: 'high',
    category: 'Dining',
    title: 'Reduce Dining Out Expenses',
    description: 'Your dining expenses have increased by 29% this month. Consider meal planning and cooking at home.',
    currentAmount: 450,
    suggestedAmount: 300,
    potentialSavings: 150,
    timeframe: 'monthly',
    actionItems: [
      'Plan meals for the week ahead',
      'Cook at home 4-5 days per week',
      'Use grocery delivery to avoid impulse purchases',
      'Set a weekly dining out budget of $75'
    ],
    confidence: 85,
    impact: 'high'
  },
  {
    id: '2',
    type: 'reallocation',
    priority: 'medium',
    category: 'Savings',
    title: 'Increase Emergency Fund Allocation',
    description: 'With reduced dining expenses, allocate savings to emergency fund to reach 6-month target.',
    currentAmount: 200,
    suggestedAmount: 350,
    potentialSavings: -150,
    timeframe: 'monthly',
    actionItems: [
      'Automate transfer of $150 monthly to emergency fund',
      'Choose high-yield savings account',
      'Set target of $15,000 for 6-month expenses',
      'Review and adjust quarterly'
    ],
    confidence: 90,
    impact: 'high'
  },
  {
    id: '3',
    type: 'optimization',
    priority: 'medium',
    category: 'Transportation',
    title: 'Optimize Transportation Costs',
    description: 'Great job reducing transportation costs! Consider investing savings in maintenance to avoid future expenses.',
    currentAmount: 320,
    suggestedAmount: 280,
    potentialSavings: 40,
    timeframe: 'monthly',
    actionItems: [
      'Regular car maintenance to prevent costly repairs',
      'Compare insurance rates annually',
      'Use public transport 2 days per week',
      'Consider carpooling options'
    ],
    confidence: 75,
    impact: 'medium'
  },
  {
    id: '4',
    type: 'reduction',
    priority: 'high',
    category: 'Shopping',
    title: 'Control Impulse Shopping',
    description: 'Shopping expenses are 36% above average. Implement a 24-hour rule for non-essential purchases.',
    currentAmount: 680,
    suggestedAmount: 450,
    potentialSavings: 230,
    timeframe: 'monthly',
    actionItems: [
      'Wait 24 hours before non-essential purchases',
      'Create a shopping list and stick to it',
      'Unsubscribe from promotional emails',
      'Set a weekly shopping budget of $100'
    ],
    confidence: 80,
    impact: 'high'
  }
];

const SMART_INSIGHTS: SmartInsight[] = [
  {
    id: '1',
    type: 'spending_alert',
    title: 'Shopping Spike Detected',
    message: 'Your shopping expenses are 36% higher than usual this month. This could impact your savings goal.',
    actionable: true,
    severity: 'warning',
    icon: AlertTriangle,
    data: { category: 'Shopping', increase: 36 }
  },
  {
    id: '2',
    type: 'savings_opportunity',
    title: 'Transportation Savings Opportunity',
    message: 'Great work reducing transportation costs by $60! Consider redirecting this to your vacation fund.',
    actionable: true,
    severity: 'success',
    icon: CheckCircle,
    data: { savings: 60, suggestion: 'vacation fund' }
  },
  {
    id: '3',
    type: 'goal_adjustment',
    title: 'Emergency Fund on Track',
    message: 'At current savings rate, you\'ll reach your emergency fund goal 2 months ahead of schedule.',
    actionable: false,
    severity: 'success',
    icon: Target,
    data: { goal: 'Emergency Fund', ahead: 2 }
  },
  {
    id: '4',
    type: 'trend_analysis',
    title: 'Seasonal Spending Pattern',
    message: 'Your entertainment spending typically increases 15% during winter months. Plan accordingly.',
    actionable: true,
    severity: 'info',
    icon: TrendingUp,
    data: { category: 'Entertainment', increase: 15, season: 'winter' }
  }
];

export default function SmartBudgetingRecommendations() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'insights' | 'patterns'>('recommendations');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [implementedRecommendations, setImplementedRecommendations] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(new Date());

  const handleImplementRecommendation = (recommendationId: string) => {
    setImplementedRecommendations(prev => new Set([...prev, recommendationId]));
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setLastAnalysis(new Date());
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Target;
    }
  };

  const totalPotentialSavings = BUDGET_RECOMMENDATIONS
    .filter(rec => rec.type === 'reduction' || rec.type === 'optimization')
    .reduce((sum, rec) => sum + rec.potentialSavings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            Smart Budgeting Recommendations
          </h3>
          <p className="text-gray-600">AI-powered insights to optimize your financial health</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Last analysis: {lastAnalysis.toLocaleTimeString()}
          </div>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Potential Monthly Savings</p>
              <p className="text-2xl font-bold text-green-900">${totalPotentialSavings}</p>
              <p className="text-sm text-green-700">from 4 recommendations</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">AI Confidence Score</p>
              <p className="text-2xl font-bold text-purple-900">82%</p>
              <p className="text-sm text-purple-700">based on 6 months data</p>
            </div>
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Active Insights</p>
              <p className="text-2xl font-bold text-blue-900">{SMART_INSIGHTS.length}</p>
              <p className="text-sm text-blue-700">requiring attention</p>
            </div>
            <Lightbulb className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'recommendations', label: 'Recommendations', icon: Target },
            { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
            { id: 'patterns', label: 'Spending Patterns', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {BUDGET_RECOMMENDATIONS.map(recommendation => (
            <div 
              key={recommendation.id}
              className={`bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 ${
                selectedRecommendation === recommendation.id ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
              } ${implementedRecommendations.has(recommendation.id) ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">{recommendation.category}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <span className="text-xs font-medium text-gray-700">{recommendation.confidence}%</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{recommendation.title}</h4>
                  <p className="text-gray-600 mb-4">{recommendation.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        ${recommendation.currentAmount}
                      </div>
                      <div className="text-sm text-gray-600">Current</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        ${recommendation.suggestedAmount}
                      </div>
                      <div className="text-sm text-gray-600">Suggested</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        ${recommendation.potentialSavings > 0 ? '+' : ''}${recommendation.potentialSavings}
                      </div>
                      <div className="text-sm text-gray-600">Impact</div>
                    </div>
                  </div>
                  
                  {selectedRecommendation === recommendation.id && (
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">Action Items:</h5>
                      <ul className="space-y-2">
                        {recommendation.actionItems.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => setSelectedRecommendation(
                      selectedRecommendation === recommendation.id ? null : recommendation.id
                    )}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {selectedRecommendation === recommendation.id ? 'Hide Details' : 'View Details'}
                  </button>
                  
                  {!implementedRecommendations.has(recommendation.id) && (
                    <button
                      onClick={() => handleImplementRecommendation(recommendation.id)}
                      className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Implement
                    </button>
                  )}
                  
                  {implementedRecommendations.has(recommendation.id) && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Implemented</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {SMART_INSIGHTS.map(insight => {
            const Icon = insight.icon;
            return (
              <div 
                key={insight.id}
                className={`border rounded-xl p-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm opacity-90 mb-3">{insight.message}</p>
                    
                    {insight.actionable && (
                      <button className="inline-flex items-center text-sm font-medium hover:underline">
                        Take Action <ArrowRight size={14} className="ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spending Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPENDING_PATTERNS.map((pattern, index) => {
              const TrendIcon = getTrendIcon(pattern.trend);
              const Icon = pattern.icon;
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${pattern.color}20` }}
                      >
                        <Icon size={20} style={{ color: pattern.color }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{pattern.category}</h4>
                        <p className="text-sm text-gray-600 capitalize">{pattern.trend}</p>
                      </div>
                    </div>
                    <TrendIcon 
                      size={20} 
                      className={
                        pattern.trend === 'increasing' ? 'text-red-500' :
                        pattern.trend === 'decreasing' ? 'text-green-500' :
                        'text-gray-500'
                      }
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current</span>
                      <span className="font-semibold">${pattern.currentSpend}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average</span>
                      <span className="font-semibold">${pattern.avgSpend}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Variance</span>
                      <span className={`font-semibold ${
                        pattern.variance > 0 ? 'text-red-600' : 
                        pattern.variance < 0 ? 'text-green-600' : 
                        'text-gray-600'
                      }`}>
                        {pattern.variance > 0 ? '+' : ''}{pattern.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}