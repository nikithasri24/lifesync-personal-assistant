import React, { useState, useEffect } from 'react';
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Award,
  Settings,
  RefreshCw,
  MessageCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  PieChart,
  BarChart3,
  User,
  Heart,
  Building,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  Download,
  Bell,
  Info,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

interface PersonalityProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 'short' | 'medium' | 'long';
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  lifestage: 'early_career' | 'mid_career' | 'pre_retirement' | 'retirement';
  incomeStability: 'stable' | 'variable' | 'irregular';
  familyStatus: 'single' | 'married' | 'family_kids' | 'empty_nest';
}

interface AIRecommendation {
  id: string;
  type: 'action' | 'optimization' | 'warning' | 'opportunity' | 'education';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'investing' | 'budgeting' | 'debt' | 'savings' | 'insurance' | 'tax' | 'retirement';
  title: string;
  description: string;
  reasoning: string;
  actionSteps: string[];
  potentialImpact: number;
  timeToImplement: string;
  confidence: number;
  personalizedFor: string[];
  relatedGoals: string[];
  dueDate?: Date;
  isCompleted: boolean;
  userFeedback?: 'helpful' | 'not_helpful';
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'high' | 'medium' | 'low';
  category: string;
  progress: number;
}

interface AIInsight {
  id: string;
  title: string;
  insight: string;
  dataPoints: string[];
  trend: 'positive' | 'negative' | 'neutral';
  category: 'spending' | 'investing' | 'saving' | 'debt' | 'net_worth';
  confidence: number;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  attachments?: any[];
}

const PERSONALITY_PROFILE: PersonalityProfile = {
  riskTolerance: 'moderate',
  timeHorizon: 'long',
  investmentExperience: 'intermediate',
  primaryGoals: ['retirement', 'house_down_payment', 'emergency_fund'],
  lifestage: 'mid_career',
  incomeStability: 'stable',
  familyStatus: 'married'
};

const AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: '1',
    type: 'optimization',
    priority: 'high',
    category: 'investing',
    title: 'Optimize Your Asset Allocation',
    description: 'Your portfolio is currently overweight in US stocks. Consider rebalancing to match your risk profile.',
    reasoning: 'Based on your moderate risk tolerance and 30-year time horizon, a more diversified allocation would better serve your long-term goals while reducing volatility.',
    actionSteps: [
      'Reduce US stock allocation from 75% to 60%',
      'Increase international stocks to 25%',
      'Add 15% bonds for stability',
      'Consider adding 5% REITs for diversification'
    ],
    potentialImpact: 15000,
    timeToImplement: '2-3 hours',
    confidence: 87,
    personalizedFor: ['moderate risk tolerance', 'long time horizon'],
    relatedGoals: ['retirement', 'wealth building'],
    isCompleted: false
  },
  {
    id: '2',
    type: 'action',
    priority: 'critical',
    category: 'tax',
    title: 'Maximize Your 401(k) Contributions',
    description: 'You\'re leaving $3,750 in employer matching on the table. Increase your 401(k) contribution to get the full match.',
    reasoning: 'Employer matching is free money with an immediate 100% return. This should be your highest priority.',
    actionSteps: [
      'Log into your 401(k) portal',
      'Increase contribution to 6% (currently at 3%)',
      'Verify the change takes effect next payroll',
      'Set up automatic annual increases'
    ],
    potentialImpact: 3750,
    timeToImplement: '15 minutes',
    confidence: 95,
    personalizedFor: ['employer 401k', 'stable income'],
    relatedGoals: ['retirement'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isCompleted: false
  },
  {
    id: '3',
    type: 'warning',
    priority: 'high',
    category: 'debt',
    title: 'High Credit Card Utilization Alert',
    description: 'Your credit utilization is at 68%, which is negatively impacting your credit score.',
    reasoning: 'High utilization can significantly lower your credit score, affecting your ability to get favorable rates on mortgages and other loans.',
    actionSteps: [
      'Pay down credit card balances below 30% utilization',
      'Consider a balance transfer to a lower rate card',
      'Set up automatic payments to avoid future high balances',
      'Monitor your credit score monthly'
    ],
    potentialImpact: 50,
    timeToImplement: '1-2 weeks',
    confidence: 92,
    personalizedFor: ['credit card debt', 'house purchase goal'],
    relatedGoals: ['house_down_payment'],
    isCompleted: false
  },
  {
    id: '4',
    type: 'opportunity',
    priority: 'medium',
    category: 'savings',
    title: 'High-Yield Savings Opportunity',
    description: 'Your emergency fund is earning only 0.1% APY. You could earn 20x more with a high-yield savings account.',
    reasoning: 'Current high-yield savings accounts offer 4-5% APY, which would generate an additional $400-500 annually on your $10,000 emergency fund.',
    actionSteps: [
      'Research high-yield savings accounts',
      'Open account with reputable online bank',
      'Transfer emergency fund to new account',
      'Set up automatic savings to continue growing fund'
    ],
    potentialImpact: 450,
    timeToImplement: '1-2 hours',
    confidence: 89,
    personalizedFor: ['emergency fund', 'low yield current account'],
    relatedGoals: ['emergency_fund'],
    isCompleted: false
  },
  {
    id: '5',
    type: 'education',
    priority: 'low',
    category: 'investing',
    title: 'Learn About Tax-Loss Harvesting',
    description: 'As your taxable investments grow, tax-loss harvesting could save you hundreds in taxes annually.',
    reasoning: 'With your growing taxable investment account and moderate tax bracket, implementing tax-loss harvesting strategies could improve your after-tax returns.',
    actionSteps: [
      'Read about tax-loss harvesting basics',
      'Understand wash sale rules',
      'Consider using a robo-advisor with automatic tax-loss harvesting',
      'Implement strategy in your taxable account'
    ],
    potentialImpact: 800,
    timeToImplement: '2-3 weeks to learn and implement',
    confidence: 75,
    personalizedFor: ['taxable investments', 'intermediate experience'],
    relatedGoals: ['wealth building', 'tax optimization'],
    isCompleted: false
  }
];

const AI_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    title: 'Spending Pattern Discovery',
    insight: 'Your dining out expenses have increased 35% over the past 3 months, primarily driven by weekend spending.',
    dataPoints: ['$450/month average', 'Weekend spike: 60% of total', 'Up from $333/month in Q1'],
    trend: 'negative',
    category: 'spending',
    confidence: 91,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Investment Performance Analysis',
    insight: 'Your portfolio has outperformed the S&P 500 by 2.3% this year, primarily due to your tech stock allocation.',
    dataPoints: ['Portfolio return: 18.7%', 'S&P 500 return: 16.4%', 'Tech allocation: 35%'],
    trend: 'positive',
    category: 'investing',
    confidence: 94,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Savings Rate Improvement',
    insight: 'Congratulations! Your savings rate has improved to 23%, putting you ahead of your retirement timeline.',
    dataPoints: ['Current rate: 23%', 'Target rate: 20%', 'Ahead of schedule by 2 years'],
    trend: 'positive',
    category: 'saving',
    confidence: 97,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];

const QUICK_QUESTIONS = [
  "How can I improve my credit score?",
  "Should I pay off debt or invest?",
  "How much should I save for retirement?",
  "What's the best investment strategy for my age?",
  "How can I reduce my tax burden?",
  "Should I refinance my mortgage?"
];

export default function AIFinancialAdvisor() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(AI_RECOMMENDATIONS);
  const [insights] = useState<AIInsight[]>(AI_INSIGHTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI Financial Advisor. I've analyzed your financial situation and have some personalized recommendations for you. How can I help you today?",
      timestamp: new Date(),
      suggestions: QUICK_QUESTIONS.slice(0, 3)
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [viewMode, setViewMode] = useState<'recommendations' | 'insights' | 'chat' | 'profile'>('recommendations');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        suggestions: QUICK_QUESTIONS.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 3)
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('credit score')) {
      return "To improve your credit score, focus on: 1) Paying down credit card balances below 30% utilization, 2) Making all payments on time, 3) Keeping old accounts open to maintain credit history length, and 4) Avoiding new credit inquiries. Based on your current situation, paying down your credit cards would have the biggest immediate impact.";
    } else if (lowerMessage.includes('debt') && lowerMessage.includes('invest')) {
      return "This is a great question! Generally, you should prioritize high-interest debt (like credit cards >6% APR) over investing. However, always take full advantage of employer 401(k) matching first - it's an immediate 100% return. Based on your profile, I'd recommend: 1) Max out employer match, 2) Pay off credit card debt, 3) Then increase investing.";
    } else if (lowerMessage.includes('retirement')) {
      return "For retirement savings, a good rule of thumb is saving 10-15% of your income. Based on your age and current savings rate of 23%, you're actually ahead of schedule! Consider maximizing your 401(k) contribution to get the full employer match, then focusing on tax-advantaged accounts like IRAs.";
    } else if (lowerMessage.includes('tax')) {
      return "To reduce your tax burden, consider: 1) Maximizing contributions to tax-advantaged accounts (401k, IRA, HSA), 2) Tax-loss harvesting in taxable accounts, 3) Timing of capital gains/losses, and 4) Charitable giving strategies. Your highest impact opportunity right now is maximizing your 401(k) contribution.";
    }
    
    return "I understand you're asking about " + message + ". Based on your financial profile, I'd recommend reviewing the personalized recommendations I've prepared for you. Each one is tailored to your specific situation and goals. Would you like me to explain any of them in more detail?";
  };

  const handleRecommendationFeedback = (id: string, feedback: 'helpful' | 'not_helpful') => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, userFeedback: feedback } : rec
    ));
  };

  const markRecommendationCompleted = (id: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, isCompleted: true } : rec
    ));
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return AlertTriangle;
      case 'high': return ArrowUpRight;
      case 'medium': return Clock;
      case 'low': return Info;
      default: return Info;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return Target;
      case 'optimization': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      case 'education': return BookOpen;
      default: return Brain;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'investing': return TrendingUp;
      case 'budgeting': return PieChart;
      case 'debt': return AlertTriangle;
      case 'savings': return Target;
      case 'insurance': return Shield;
      case 'tax': return Receipt;
      case 'retirement': return Clock;
      default: return DollarSign;
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
    const completedMatch = showCompleted || !rec.isCompleted;
    return categoryMatch && completedMatch;
  });

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${Math.abs(value).toLocaleString()}`;
  };

  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedRecommendations = filteredRecommendations.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            AI Financial Advisor
          </h3>
          <p className="text-gray-600">Personalized recommendations powered by advanced financial AI</p>
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
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* AI Status Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900">AI Analysis Active</span>
            </div>
            <div className="text-sm text-gray-600">
              {recommendations.length} recommendations • {insights.length} insights generated
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length)}%
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-purple-700">Last updated: Just now</span>
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('recommendations')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'recommendations' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'insights' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            AI Insights
          </button>
          <button
            onClick={() => setViewMode('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'chat' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={() => setViewMode('profile')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'profile' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {viewMode === 'recommendations' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h4>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  <option value="investing">Investing</option>
                  <option value="tax">Tax</option>
                  <option value="debt">Debt</option>
                  <option value="savings">Savings</option>
                  <option value="retirement">Retirement</option>
                </select>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Show completed</span>
                </label>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {sortedRecommendations.length} recommendations based on your financial profile and goals
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            {sortedRecommendations.map((recommendation) => {
              const PriorityIcon = getPriorityIcon(recommendation.priority);
              const TypeIcon = getTypeIcon(recommendation.type);
              const CategoryIcon = getCategoryIcon(recommendation.category);
              
              return (
                <div key={recommendation.id} className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
                  recommendation.isCompleted ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <TypeIcon size={24} className="text-purple-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{recommendation.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                            <PriorityIcon size={12} className="inline mr-1" />
                            {recommendation.priority}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                            {recommendation.category}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {recommendation.confidence}% confidence
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{recommendation.description}</p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <h4 className="font-medium text-blue-900 mb-1">AI Reasoning:</h4>
                          <p className="text-sm text-blue-800">{recommendation.reasoning}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Action Steps:</h4>
                            <ol className="text-sm text-gray-600 space-y-1">
                              {recommendation.actionSteps.map((step, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 text-xs rounded-full flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Potential Impact:</span>
                              <span className="font-semibold text-green-600">{formatValue(recommendation.potentialImpact)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Time to Implement:</span>
                              <span className="font-medium">{recommendation.timeToImplement}</span>
                            </div>
                            {recommendation.dueDate && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recommended by:</span>
                                <span className="font-medium text-orange-600">{recommendation.dueDate.toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {!recommendation.isCompleted && (
                        <button
                          onClick={() => markRecommendationCompleted(recommendation.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleRecommendationFeedback(recommendation.id, 'helpful')}
                          className={`p-2 rounded-lg transition-colors ${
                            recommendation.userFeedback === 'helpful' 
                              ? 'bg-green-100 text-green-600' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          onClick={() => handleRecommendationFeedback(recommendation.id, 'not_helpful')}
                          className={`p-2 rounded-lg transition-colors ${
                            recommendation.userFeedback === 'not_helpful' 
                              ? 'bg-red-100 text-red-600' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <ThumbsDown size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.trend === 'positive' ? 'bg-green-100 text-green-800' :
                      insight.trend === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {insight.trend}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{insight.insight}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Supporting Data:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {insight.dataPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle size={14} className="text-blue-500 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-500">
                  {insight.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'chat' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">AI Financial Advisor</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p>{message.content}</p>
                  {message.suggestions && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(suggestion)}
                          className="block w-full text-left text-sm p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your finances..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Personality */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Personality Profile</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Risk Tolerance:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.riskTolerance}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Time Horizon:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.timeHorizon}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Experience Level:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.investmentExperience}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Life Stage:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.lifestage.replace('_', ' ')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Income Stability:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.incomeStability}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Family Status:</span>
                <span className="font-semibold capitalize">{PERSONALITY_PROFILE.familyStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Primary Goals */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Primary Financial Goals</h4>
            <div className="space-y-3">
              {PERSONALITY_PROFILE.primaryGoals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900 capitalize">{goal.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">AI Insights on Your Profile:</h5>
              <p className="text-sm text-blue-800">
                Based on your profile, you're well-positioned for long-term wealth building. Your moderate risk tolerance 
                and stable income allow for growth-oriented strategies while maintaining appropriate safety measures.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}