import React, { useState, useMemo } from 'react';
import {
  Calculator,
  FileText,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Minus,
  Star,
  Award,
  Shield,
  Building,
  Home,
  CreditCard,
  Receipt,
  Percent,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Brain,
  X
} from 'lucide-react';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  type: 'federal' | 'state' | 'fica';
}

interface TaxableAccount {
  id: string;
  name: string;
  type: 'traditional_401k' | 'roth_401k' | 'traditional_ira' | 'roth_ira' | 'taxable' | 'hsa';
  balance: number;
  contributions: number;
  employerMatch: number;
  taxStatus: 'pre_tax' | 'post_tax' | 'tax_free';
  withdrawalAge?: number;
  requiredDistributions: boolean;
}

interface TaxOptimizationStrategy {
  id: string;
  title: string;
  description: string;
  category: 'contribution' | 'withdrawal' | 'harvesting' | 'conversion' | 'deduction';
  potentialSavings: number;
  complexity: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  requirements: string[];
  risks: string[];
  steps: string[];
  isApplicable: boolean;
  isRecommended: boolean;
}

interface TaxScenario {
  id: string;
  name: string;
  description: string;
  income: number;
  deductions: number;
  credits: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  taxOwed: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
}

interface TaxEvent {
  id: string;
  date: Date;
  type: 'contribution' | 'withdrawal' | 'conversion' | 'sale' | 'dividend';
  description: string;
  amount: number;
  taxImpact: number;
  account: string;
  status: 'completed' | 'planned' | 'optimized';
}

interface DeductionItem {
  id: string;
  category: 'mortgage' | 'charitable' | 'medical' | 'business' | 'education' | 'state_local';
  description: string;
  amount: number;
  isItemized: boolean;
  supportingDocs: string[];
  confidence: 'high' | 'medium' | 'low';
}

const FEDERAL_TAX_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 11000, rate: 0.10, type: 'federal' },
  { min: 11000, max: 44725, rate: 0.12, type: 'federal' },
  { min: 44725, max: 95375, rate: 0.22, type: 'federal' },
  { min: 95375, max: 182050, rate: 0.24, type: 'federal' },
  { min: 182050, max: 231250, rate: 0.32, type: 'federal' },
  { min: 231250, max: 578125, rate: 0.35, type: 'federal' },
  { min: 578125, max: null, rate: 0.37, type: 'federal' }
];

const MOCK_ACCOUNTS: TaxableAccount[] = [
  {
    id: '1',
    name: '401(k) - Employer',
    type: 'traditional_401k',
    balance: 125000,
    contributions: 22500,
    employerMatch: 6750,
    taxStatus: 'pre_tax',
    withdrawalAge: 59.5,
    requiredDistributions: true
  },
  {
    id: '2',
    name: 'Roth IRA',
    type: 'roth_ira',
    balance: 45000,
    contributions: 6500,
    employerMatch: 0,
    taxStatus: 'post_tax',
    withdrawalAge: 59.5,
    requiredDistributions: false
  },
  {
    id: '3',
    name: 'Taxable Brokerage',
    type: 'taxable',
    balance: 85000,
    contributions: 24000,
    employerMatch: 0,
    taxStatus: 'post_tax',
    requiredDistributions: false
  },
  {
    id: '4',
    name: 'HSA Account',
    type: 'hsa',
    balance: 12500,
    contributions: 4150,
    employerMatch: 500,
    taxStatus: 'tax_free',
    withdrawalAge: 65,
    requiredDistributions: false
  }
];

const TAX_STRATEGIES: TaxOptimizationStrategy[] = [
  {
    id: '1',
    title: 'Maximize 401(k) Contributions',
    description: 'Increase pre-tax 401(k) contributions to reduce current taxable income',
    category: 'contribution',
    potentialSavings: 5400,
    complexity: 'low',
    timeframe: 'immediate',
    requirements: ['Have access to employer 401(k)', 'Sufficient income to increase contributions'],
    risks: ['Reduced take-home pay', 'Early withdrawal penalties'],
    steps: [
      'Review current contribution percentage',
      'Calculate maximum allowable contribution',
      'Adjust payroll deductions',
      'Monitor employer match requirements'
    ],
    isApplicable: true,
    isRecommended: true
  },
  {
    id: '2',
    title: 'Tax-Loss Harvesting',
    description: 'Realize capital losses to offset capital gains and reduce taxable income',
    category: 'harvesting',
    potentialSavings: 2800,
    complexity: 'medium',
    timeframe: 'short_term',
    requirements: ['Taxable investment accounts with losses', 'Capital gains to offset'],
    risks: ['Wash sale rules', 'Disruption to investment strategy'],
    steps: [
      'Identify positions with unrealized losses',
      'Calculate potential tax benefits',
      'Execute sales before year-end',
      'Reinvest in similar but not identical securities'
    ],
    isApplicable: true,
    isRecommended: true
  },
  {
    id: '3',
    title: 'Roth Conversion Ladder',
    description: 'Convert traditional IRA funds to Roth IRA during low-income years',
    category: 'conversion',
    potentialSavings: 15000,
    complexity: 'high',
    timeframe: 'long_term',
    requirements: ['Traditional IRA with significant balance', 'Lower current tax bracket'],
    risks: ['Immediate tax liability', 'Loss of tax-deferred growth'],
    steps: [
      'Analyze current vs future tax brackets',
      'Determine optimal conversion amount',
      'Execute partial conversions over multiple years',
      'Plan for tax payments'
    ],
    isApplicable: false,
    isRecommended: false
  },
  {
    id: '4',
    title: 'HSA Triple Tax Advantage',
    description: 'Maximize HSA contributions for tax deduction, growth, and tax-free withdrawals',
    category: 'contribution',
    potentialSavings: 1200,
    complexity: 'low',
    timeframe: 'immediate',
    requirements: ['High-deductible health plan', 'HSA eligibility'],
    risks: ['Limited to qualified medical expenses before age 65'],
    steps: [
      'Verify HSA eligibility requirements',
      'Calculate maximum annual contribution',
      'Set up automatic contributions',
      'Invest HSA funds for long-term growth'
    ],
    isApplicable: true,
    isRecommended: true
  },
  {
    id: '5',
    title: 'Charitable Giving Bunching',
    description: 'Bundle multiple years of charitable donations into one year to exceed standard deduction',
    category: 'deduction',
    potentialSavings: 3200,
    complexity: 'medium',
    timeframe: 'short_term',
    requirements: ['Regular charitable giving habits', 'Sufficient deductions to itemize'],
    risks: ['Reduced giving flexibility', 'Need for proper documentation'],
    steps: [
      'Calculate multi-year giving plan',
      'Consider donor-advised funds',
      'Time contributions strategically',
      'Maintain proper records'
    ],
    isApplicable: true,
    isRecommended: false
  }
];

const MOCK_DEDUCTIONS: DeductionItem[] = [
  {
    id: '1',
    category: 'mortgage',
    description: 'Mortgage Interest',
    amount: 14500,
    isItemized: true,
    supportingDocs: ['1098 Form', 'Loan Statements'],
    confidence: 'high'
  },
  {
    id: '2',
    category: 'charitable',
    description: 'Charitable Donations',
    amount: 8750,
    isItemized: true,
    supportingDocs: ['Receipt Letters', 'Bank Records'],
    confidence: 'high'
  },
  {
    id: '3',
    category: 'state_local',
    description: 'State and Local Taxes',
    amount: 10000,
    isItemized: true,
    supportingDocs: ['Property Tax Bills', 'State Tax Returns'],
    confidence: 'high'
  },
  {
    id: '4',
    category: 'medical',
    description: 'Medical Expenses',
    amount: 4200,
    isItemized: true,
    supportingDocs: ['Medical Bills', 'Insurance Statements'],
    confidence: 'medium'
  }
];

export default function AdvancedTaxPlanning() {
  const [accounts] = useState<TaxableAccount[]>(MOCK_ACCOUNTS);
  const [strategies] = useState<TaxOptimizationStrategy[]>(TAX_STRATEGIES);
  const [deductions] = useState<DeductionItem[]>(MOCK_DEDUCTIONS);
  const [currentIncome, setCurrentIncome] = useState(150000);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married_joint' | 'married_separate' | 'head_of_household'>('single');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [viewMode, setViewMode] = useState<'overview' | 'strategies' | 'scenarios' | 'deductions' | 'calendar'>('overview');
  const [showValues, setShowValues] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateTax = (income: number, status: string) => {
    const standardDeduction = status === 'married_joint' ? 29200 : 14600;
    const taxableIncome = Math.max(0, income - standardDeduction);
    
    let tax = 0;
    let previousMax = 0;
    
    for (const bracket of FEDERAL_TAX_BRACKETS_2024) {
      const bracketMax = bracket.max || taxableIncome;
      const bracketMin = bracket.min;
      
      if (taxableIncome > bracketMin) {
        const taxableInBracket = Math.min(taxableIncome - bracketMin, bracketMax - bracketMin);
        tax += taxableInBracket * bracket.rate;
      }
    }
    
    return tax;
  };

  const currentTax = useMemo(() => calculateTax(currentIncome, filingStatus), [currentIncome, filingStatus]);
  const effectiveRate = (currentTax / currentIncome) * 100;
  const afterTaxIncome = currentIncome - currentTax;

  // Calculate marginal rate
  const marginalRate = useMemo(() => {
    const standardDeduction = filingStatus === 'married_joint' ? 29200 : 14600;
    const taxableIncome = Math.max(0, currentIncome - standardDeduction);
    
    for (const bracket of FEDERAL_TAX_BRACKETS_2024) {
      if (bracket.max === null || taxableIncome <= bracket.max) {
        return bracket.rate * 100;
      }
    }
    return 37;
  }, [currentIncome, filingStatus]);

  const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  const standardDeduction = filingStatus === 'married_joint' ? 29200 : 14600;
  const shouldItemize = totalDeductions > standardDeduction;

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${Math.abs(value).toLocaleString()}`;
  };

  const getStrategyIcon = (category: string) => {
    switch (category) {
      case 'contribution': return Plus;
      case 'withdrawal': return Minus;
      case 'harvesting': return TrendingDown;
      case 'conversion': return ArrowUpRight;
      case 'deduction': return Receipt;
      default: return Calculator;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mortgage': return Home;
      case 'charitable': return Star;
      case 'medical': return Plus;
      case 'business': return Building;
      case 'education': return Award;
      case 'state_local': return Receipt;
      default: return FileText;
    }
  };

  const applicableStrategies = strategies.filter(s => s.isApplicable);
  const recommendedStrategies = strategies.filter(s => s.isRecommended);
  const totalPotentialSavings = applicableStrategies.reduce((sum, s) => sum + s.potentialSavings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-green-600" />
            Advanced Tax Planning & Optimization
          </h3>
          <p className="text-gray-600">Strategic tax planning and optimization recommendations</p>
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
          
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            <Brain size={18} className="mr-2" />
            Optimize Taxes
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Current Tax Owed</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(currentTax)}</p>
              <p className="text-xs text-blue-700">Federal taxes only</p>
            </div>
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Potential Savings</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(totalPotentialSavings)}</p>
              <p className="text-xs text-green-700">From {recommendedStrategies.length} strategies</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Effective Rate</p>
              <p className="text-2xl font-bold text-purple-900">{effectiveRate.toFixed(1)}%</p>
              <p className="text-xs text-purple-700">Marginal: {marginalRate.toFixed(1)}%</p>
            </div>
            <Percent className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">After-Tax Income</p>
              <p className="text-2xl font-bold text-orange-900">{formatValue(afterTaxIncome)}</p>
              <p className="text-xs text-orange-700">Take-home amount</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Tax Scenario Inputs</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Income
            </label>
            <input
              type="number"
              value={currentIncome}
              onChange={(e) => setCurrentIncome(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>
        </div>
      </div>

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
            onClick={() => setViewMode('strategies')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'strategies' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Tax Strategies
          </button>
          <button
            onClick={() => setViewMode('scenarios')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'scenarios' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Scenarios
          </button>
          <button
            onClick={() => setViewMode('deductions')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'deductions' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Deductions
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'calendar' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Tax Calendar
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Breakdown */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Gross Income</span>
                <span className="font-semibold">{formatValue(currentIncome)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Standard Deduction</span>
                <span className="font-semibold text-blue-900">-{formatValue(standardDeduction)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700">Taxable Income</span>
                <span className="font-semibold text-purple-900">{formatValue(Math.max(0, currentIncome - standardDeduction))}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Federal Tax Owed</span>
                <span className="font-semibold text-red-900">-{formatValue(currentTax)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <span className="text-green-700 font-medium">After-Tax Income</span>
                <span className="font-bold text-green-900 text-lg">{formatValue(afterTaxIncome)}</span>
              </div>
            </div>
          </div>

          {/* Top Strategies */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommended Strategies</h4>
            <div className="space-y-3">
              {recommendedStrategies.slice(0, 4).map((strategy) => {
                const Icon = getStrategyIcon(strategy.category);
                return (
                  <div key={strategy.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Icon size={20} className="text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium text-green-900">{strategy.title}</h5>
                        <p className="text-sm text-green-700 mt-1">{strategy.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-green-800">
                            Potential Savings: {formatValue(strategy.potentialSavings)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(strategy.complexity)}`}>
                            {strategy.complexity} complexity
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'strategies' && (
        <div className="space-y-4">
          {strategies.map((strategy) => {
            const Icon = getStrategyIcon(strategy.category);
            return (
              <div key={strategy.id} className={`p-6 rounded-xl border ${
                strategy.isRecommended ? 'bg-green-50 border-green-200' :
                strategy.isApplicable ? 'bg-white border-gray-200' :
                'bg-gray-50 border-gray-200 opacity-60'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      strategy.isRecommended ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon size={24} className={
                        strategy.isRecommended ? 'text-green-600' : 'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{strategy.title}</h3>
                        {strategy.isRecommended && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(strategy.complexity)}`}>
                          {strategy.complexity}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{strategy.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {strategy.requirements.map((req, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Steps</h4>
                          <ol className="text-sm text-gray-600 space-y-1">
                            {strategy.steps.slice(0, 3).map((step, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 text-xs rounded-full flex items-center justify-center font-medium">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatValue(strategy.potentialSavings)}
                    </div>
                    <div className="text-sm text-gray-600">potential savings</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'deductions' && (
        <div className="space-y-6">
          {/* Deduction Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Deduction Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{formatValue(totalDeductions)}</div>
                <div className="text-sm text-blue-700">Total Itemized</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatValue(standardDeduction)}</div>
                <div className="text-sm text-gray-700">Standard Deduction</div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${
                shouldItemize ? 'bg-green-50' : 'bg-orange-50'
              }`}>
                <div className={`text-2xl font-bold ${
                  shouldItemize ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {shouldItemize ? 'Itemize' : 'Standard'}
                </div>
                <div className={`text-sm ${
                  shouldItemize ? 'text-green-700' : 'text-orange-700'
                }`}>
                  Recommended
                </div>
              </div>
            </div>
          </div>

          {/* Deduction Items */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Deduction Items</h4>
            <div className="space-y-4">
              {deductions.map((deduction) => {
                const Icon = getCategoryIcon(deduction.category);
                return (
                  <div key={deduction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Icon size={20} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{deduction.description}</div>
                        <div className="text-sm text-gray-600 capitalize">{deduction.category.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatValue(deduction.amount)}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        deduction.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        deduction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deduction.confidence} confidence
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Tax Planning Calendar</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Q1 */}
            <div className="p-4 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-3">Q1 (Jan-Mar)</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-blue-600 mt-0.5" />
                  <span>File previous year tax return</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-blue-600 mt-0.5" />
                  <span>Make IRA contributions for previous year</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-blue-600 mt-0.5" />
                  <span>Pay first quarter estimated taxes</span>
                </li>
              </ul>
            </div>

            {/* Q2 */}
            <div className="p-4 border border-green-200 rounded-lg">
              <h5 className="font-semibold text-green-900 mb-3">Q2 (Apr-Jun)</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-green-600 mt-0.5" />
                  <span>Review Q1 investment performance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-green-600 mt-0.5" />
                  <span>Pay second quarter estimated taxes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-green-600 mt-0.5" />
                  <span>Adjust retirement contributions</span>
                </li>
              </ul>
            </div>

            {/* Q3 */}
            <div className="p-4 border border-orange-200 rounded-lg">
              <h5 className="font-semibold text-orange-900 mb-3">Q3 (Jul-Sep)</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-orange-600 mt-0.5" />
                  <span>Mid-year tax planning review</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-orange-600 mt-0.5" />
                  <span>Pay third quarter estimated taxes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Calendar size={14} className="text-orange-600 mt-0.5" />
                  <span>Review HSA contribution limits</span>
                </li>
              </ul>
            </div>

            {/* Q4 */}
            <div className="p-4 border border-purple-200 rounded-lg md:col-span-2 lg:col-span-3">
              <h5 className="font-semibold text-purple-900 mb-3">Q4 (Oct-Dec) - Critical Tax Planning Period</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Tax-loss harvesting</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Maximize 401(k) contributions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Charitable giving strategy</span>
                  </li>
                </ul>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Roth conversion analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Business expense documentation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Pay fourth quarter estimated taxes</span>
                  </li>
                </ul>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Year-end portfolio rebalancing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>FSA/HSA planning for next year</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Calendar size={14} className="text-purple-600 mt-0.5" />
                    <span>Next year tax strategy planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}