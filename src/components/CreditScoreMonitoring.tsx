import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Calendar,
  Target,
  Bell,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  Zap,
  Award,
  Lock,
  Unlock,
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  Clock,
  User,
  Building,
  Home,
  Car,
  GraduationCap,
  Plus
} from 'lucide-react';

interface CreditScore {
  score: number;
  date: Date;
  bureau: 'experian' | 'equifax' | 'transunion';
  range: string;
  grade: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';
  change: number;
  changePercent: number;
}

interface CreditFactor {
  id: string;
  category: 'payment_history' | 'credit_utilization' | 'length_of_history' | 'credit_mix' | 'new_credit';
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  currentValue: string;
  recommendation?: string;
  description: string;
}

interface CreditAccount {
  id: string;
  accountName: string;
  accountType: 'credit_card' | 'mortgage' | 'auto_loan' | 'personal_loan' | 'student_loan';
  balance: number;
  creditLimit?: number;
  utilization?: number;
  paymentStatus: 'current' | 'late_30' | 'late_60' | 'late_90' | 'charged_off';
  openDate: Date;
  lastPayment?: Date;
  minimumPayment: number;
  isReporting: boolean;
}

interface CreditAlert {
  id: string;
  type: 'score_change' | 'new_account' | 'high_utilization' | 'missed_payment' | 'identity_monitoring';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  date: Date;
  isRead: boolean;
  actionRequired?: boolean;
}

interface CreditGoal {
  id: string;
  targetScore: number;
  currentScore: number;
  targetDate: Date;
  strategies: string[];
  estimatedTimeframe: string;
  progress: number;
}

const MOCK_CREDIT_SCORES: CreditScore[] = [
  {
    score: 748,
    date: new Date('2024-01-15'),
    bureau: 'experian',
    range: '300-850',
    grade: 'very_good',
    change: 12,
    changePercent: 1.6
  },
  {
    score: 742,
    date: new Date('2023-12-15'),
    bureau: 'experian',
    range: '300-850',
    grade: 'very_good',
    change: -3,
    changePercent: -0.4
  },
  {
    score: 745,
    date: new Date('2023-11-15'),
    bureau: 'experian',
    range: '300-850',
    grade: 'very_good',
    change: 8,
    changePercent: 1.1
  }
];

const CREDIT_FACTORS: CreditFactor[] = [
  {
    id: '1',
    category: 'payment_history',
    name: 'Payment History',
    impact: 'positive',
    weight: 35,
    currentValue: '100% on-time payments',
    description: 'Your payment history is excellent with no late payments in the past 2 years.',
    recommendation: 'Continue making all payments on time to maintain this positive factor.'
  },
  {
    id: '2',
    category: 'credit_utilization',
    name: 'Credit Utilization',
    impact: 'negative',
    weight: 30,
    currentValue: '45% overall utilization',
    description: 'Your credit utilization is higher than recommended.',
    recommendation: 'Try to keep utilization below 30%, ideally under 10% for optimal scores.'
  },
  {
    id: '3',
    category: 'length_of_history',
    name: 'Length of Credit History',
    impact: 'positive',
    weight: 15,
    currentValue: '8 years average',
    description: 'You have a solid credit history length.',
    recommendation: 'Keep old accounts open to maintain your average account age.'
  },
  {
    id: '4',
    category: 'credit_mix',
    name: 'Credit Mix',
    impact: 'neutral',
    weight: 10,
    currentValue: '4 account types',
    description: 'You have a good variety of credit types.',
    recommendation: 'Your credit mix is healthy. No immediate action needed.'
  },
  {
    id: '5',
    category: 'new_credit',
    name: 'New Credit Inquiries',
    impact: 'negative',
    weight: 10,
    currentValue: '3 inquiries in 6 months',
    description: 'Recent credit inquiries may be impacting your score.',
    recommendation: 'Avoid new credit applications for the next 6 months to let inquiries age.'
  }
];

const CREDIT_ACCOUNTS: CreditAccount[] = [
  {
    id: '1',
    accountName: 'Chase Freedom Unlimited',
    accountType: 'credit_card',
    balance: 1850,
    creditLimit: 8000,
    utilization: 23.1,
    paymentStatus: 'current',
    openDate: new Date('2019-03-15'),
    lastPayment: new Date('2024-01-20'),
    minimumPayment: 45,
    isReporting: true
  },
  {
    id: '2',
    accountName: 'Capital One Venture',
    accountType: 'credit_card',
    balance: 3200,
    creditLimit: 5000,
    utilization: 64.0,
    paymentStatus: 'current',
    openDate: new Date('2020-07-10'),
    lastPayment: new Date('2024-01-18'),
    minimumPayment: 95,
    isReporting: true
  },
  {
    id: '3',
    accountName: 'Auto Loan - Honda',
    accountType: 'auto_loan',
    balance: 18500,
    paymentStatus: 'current',
    openDate: new Date('2022-05-20'),
    lastPayment: new Date('2024-01-15'),
    minimumPayment: 425,
    isReporting: true
  },
  {
    id: '4',
    accountName: 'Student Loan',
    accountType: 'student_loan',
    balance: 12800,
    paymentStatus: 'current',
    openDate: new Date('2018-09-01'),
    lastPayment: new Date('2024-01-10'),
    minimumPayment: 195,
    isReporting: true
  }
];

const CREDIT_ALERTS: CreditAlert[] = [
  {
    id: '1',
    type: 'high_utilization',
    severity: 'high',
    title: 'High Credit Utilization Alert',
    description: 'Your Capital One Venture card utilization is at 64%, which may negatively impact your credit score.',
    date: new Date('2024-01-22'),
    isRead: false,
    actionRequired: true
  },
  {
    id: '2',
    type: 'score_change',
    severity: 'medium',
    title: 'Credit Score Increased',
    description: 'Your Experian credit score increased by 12 points to 748.',
    date: new Date('2024-01-15'),
    isRead: true,
    actionRequired: false
  },
  {
    id: '3',
    type: 'new_account',
    severity: 'low',
    title: 'New Account Detected',
    description: 'A new credit inquiry was detected on your report from First National Bank.',
    date: new Date('2024-01-10'),
    isRead: false,
    actionRequired: false
  }
];

const CREDIT_GOAL: CreditGoal = {
  id: '1',
  targetScore: 800,
  currentScore: 748,
  targetDate: new Date('2024-12-31'),
  strategies: [
    'Reduce credit utilization to under 10%',
    'Make all payments on time',
    'Avoid new credit applications',
    'Consider paying down high-balance cards first'
  ],
  estimatedTimeframe: '8-12 months',
  progress: 69
};

export default function CreditScoreMonitoring() {
  const [creditScores] = useState<CreditScore[]>(MOCK_CREDIT_SCORES);
  const [creditFactors] = useState<CreditFactor[]>(CREDIT_FACTORS);
  const [creditAccounts] = useState<CreditAccount[]>(CREDIT_ACCOUNTS);
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>(CREDIT_ALERTS);
  const [creditGoal] = useState<CreditGoal>(CREDIT_GOAL);
  const [showValues, setShowValues] = useState(true);
  const [selectedBureau, setSelectedBureau] = useState<string>('experian');
  const [viewMode, setViewMode] = useState<'overview' | 'factors' | 'accounts' | 'monitoring'>('overview');

  const currentScore = creditScores[0];
  const previousScore = creditScores[1];
  
  const formatValue = (value: number) => {
    if (!showValues) return '•••';
    return value.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 740) return 'text-blue-600';
    if (score >= 670) return 'text-yellow-600';
    if (score >= 580) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 800) return { grade: 'Excellent', color: 'green' };
    if (score >= 740) return { grade: 'Very Good', color: 'blue' };
    if (score >= 670) return { grade: 'Good', color: 'yellow' };
    if (score >= 580) return { grade: 'Fair', color: 'orange' };
    return { grade: 'Poor', color: 'red' };
  };

  const getFactorIcon = (category: string) => {
    switch (category) {
      case 'payment_history': return Clock;
      case 'credit_utilization': return Percent;
      case 'length_of_history': return Calendar;
      case 'credit_mix': return PieChart;
      case 'new_credit': return Plus;
      default: return BarChart3;
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return CreditCard;
      case 'mortgage': return Home;
      case 'auto_loan': return Car;
      case 'student_loan': return GraduationCap;
      case 'personal_loan': return Building;
      default: return DollarSign;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-orange-600';
    if (utilization >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const markAlertAsRead = (alertId: string) => {
    setCreditAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const totalCreditLimit = creditAccounts
    .filter(acc => acc.creditLimit)
    .reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);
  
  const totalCreditBalance = creditAccounts
    .filter(acc => acc.creditLimit)
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  const overallUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
  
  const unreadAlerts = creditAlerts.filter(alert => !alert.isRead);
  const highPriorityAlerts = creditAlerts.filter(alert => alert.severity === 'high' && !alert.isRead);

  const scoreGrade = getScoreGrade(currentScore.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Credit Score Monitoring
          </h3>
          <p className="text-gray-600">Track your credit health and get personalized insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Scores</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Download Report
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Refresh Scores
          </button>
        </div>
      </div>

      {/* Current Credit Score */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <select
                  value={selectedBureau}
                  onChange={(e) => setSelectedBureau(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="experian">Experian</option>
                  <option value="equifax">Equifax</option>
                  <option value="transunion">TransUnion</option>
                </select>
              </div>
              
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(currentScore.score)}`}>
                {formatValue(currentScore.score)}
              </div>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${scoreGrade.color}-100 text-${scoreGrade.color}-800`}>
                {scoreGrade.grade}
              </div>
              
              <div className="mt-4 flex items-center justify-center space-x-2">
                {currentScore.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  currentScore.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentScore.change >= 0 ? '+' : ''}{currentScore.change} points
                </span>
                <span className="text-sm text-gray-500">this month</span>
              </div>
              
              <div className="text-sm text-gray-500 mt-2">
                Updated {currentScore.date.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Score Range */}
          <div className="lg:col-span-1">
            <h5 className="font-medium text-gray-900 mb-4">Score Range</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Poor</span>
                <span className="text-sm font-medium">300-579</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-l-full" style={{width: '33%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fair</span>
                <span className="text-sm font-medium">580-669</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2" style={{width: '33%', marginLeft: '33%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Good</span>
                <span className="text-sm font-medium">670-739</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2" style={{width: '25%', marginLeft: '66%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Very Good</span>
                <span className="text-sm font-medium">740-799</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 relative">
                <div className="bg-blue-500 h-2" style={{width: '21%', marginLeft: '73%'}}></div>
                <div className="absolute top-0 left-0 w-full h-2 flex items-center justify-center">
                  <div 
                    className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                    style={{marginLeft: `${((currentScore.score - 300) / 550) * 100}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Excellent</span>
                <span className="text-sm font-medium">800-850</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-r-full" style={{width: '18%', marginLeft: '82%'}}></div>
              </div>
            </div>
          </div>

          {/* Credit Goal */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Credit Goal
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Target Score:</span>
                  <span className="font-bold text-blue-900">{creditGoal.targetScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Current:</span>
                  <span className="font-bold text-blue-900">{creditGoal.currentScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Remaining:</span>
                  <span className="font-bold text-blue-900">{creditGoal.targetScore - creditGoal.currentScore} points</span>
                </div>
                
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${creditGoal.progress}%` }}
                  />
                </div>
                
                <div className="text-sm text-blue-700">
                  <strong>ETA:</strong> {creditGoal.estimatedTimeframe}
                </div>
                <div className="text-xs text-blue-600">
                  Target Date: {creditGoal.targetDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Bell className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-3">
                Credit Alerts ({unreadAlerts.length})
                {highPriorityAlerts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                    {highPriorityAlerts.length} High Priority
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {unreadAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border cursor-pointer hover:bg-opacity-75 transition-colors ${
                    alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`} onClick={() => markAlertAsRead(alert.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{alert.title}</div>
                        <div className="text-gray-600 text-sm mt-1">{alert.description}</div>
                        <div className="text-gray-500 text-xs mt-1">{alert.date.toLocaleDateString()}</div>
                      </div>
                      {alert.actionRequired && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full ml-2">
                          Action Required
                        </span>
                      )}
                    </div>
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
              viewMode === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('factors')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'factors' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Score Factors
          </button>
          <button
            onClick={() => setViewMode('accounts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'accounts' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Credit Accounts
          </button>
          <button
            onClick={() => setViewMode('monitoring')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'monitoring' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Monitoring
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit Utilization */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Credit Utilization</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Utilization</span>
                <span className={`text-xl font-bold ${getUtilizationColor(overallUtilization)}`}>
                  {overallUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    overallUtilization >= 70 ? 'bg-red-500' :
                    overallUtilization >= 30 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(overallUtilization, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-500">
                ${totalCreditBalance.toLocaleString()} of ${totalCreditLimit.toLocaleString()} available credit
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Recommendation:</strong> Keep utilization below 30% for optimal scores, ideally under 10%.
                </div>
              </div>
            </div>
          </div>

          {/* Recent Score History */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Score History</h4>
            <div className="space-y-3">
              {creditScores.slice(0, 4).map((score, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{score.date.toLocaleDateString()}</div>
                    <div className="text-sm text-gray-600">{score.bureau.charAt(0).toUpperCase() + score.bureau.slice(1)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(score.score)}`}>
                      {formatValue(score.score)}
                    </div>
                    <div className={`text-sm flex items-center ${
                      score.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {score.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="ml-1">{score.change >= 0 ? '+' : ''}{score.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Full History
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'factors' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Credit Score Factors</h4>
          <div className="space-y-6">
            {creditFactors.map((factor) => {
              const Icon = getFactorIcon(factor.category);
              return (
                <div key={factor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getImpactColor(factor.impact)}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{factor.name}</h5>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{factor.weight}% of score</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            factor.impact === 'positive' ? 'bg-green-100 text-green-800' :
                            factor.impact === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Current:</strong> {factor.currentValue}
                      </div>
                      <div className="text-sm text-gray-700 mb-3">
                        {factor.description}
                      </div>
                      {factor.recommendation && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <strong>Recommendation:</strong> {factor.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'accounts' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Credit Accounts</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditAccounts.map((account) => {
                  const Icon = getAccountIcon(account.accountType);
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Icon size={20} className="text-gray-600" />
                          <div>
                            <div className="text-lg font-medium text-gray-900">{account.accountName}</div>
                            <div className="text-sm text-gray-500">
                              {account.accountType.replace('_', ' ').toUpperCase()} • Opened {account.openDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium text-gray-900">
                        ${account.balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {account.creditLimit ? `$${account.creditLimit.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {account.utilization ? (
                          <span className={`text-lg font-medium ${getUtilizationColor(account.utilization)}`}>
                            {account.utilization.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          account.paymentStatus === 'current' ? 'bg-green-100 text-green-800' :
                          account.paymentStatus.includes('late') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {account.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {account.lastPayment ? account.lastPayment.toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'monitoring' && (
        <div className="space-y-6">
          {/* Identity Monitoring */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Identity Monitoring
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-medium text-green-800">Identity Protected</div>
                <div className="text-sm text-green-600">No suspicious activity</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-medium text-blue-800">24/7 Monitoring</div>
                <div className="text-sm text-blue-600">All 3 bureaus watched</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-purple-800">Instant Alerts</div>
                <div className="text-sm text-purple-600">Real-time notifications</div>
              </div>
            </div>
          </div>

          {/* All Alerts */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h4>
            <div className="space-y-3">
              {creditAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.isRead ? 'bg-gray-50 border-gray-200' :
                  alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${
                        alert.severity === 'high' ? 'bg-red-100' :
                        alert.severity === 'medium' ? 'bg-orange-100' :
                        'bg-yellow-100'
                      }`}>
                        <AlertTriangle size={16} className={
                          alert.severity === 'high' ? 'text-red-600' :
                          alert.severity === 'medium' ? 'text-orange-600' :
                          'text-yellow-600'
                        } />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{alert.title}</h5>
                        <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{alert.date.toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.actionRequired && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                          Action Required
                        </span>
                      )}
                      {!alert.isRead && (
                        <button
                          onClick={() => markAlertAsRead(alert.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}