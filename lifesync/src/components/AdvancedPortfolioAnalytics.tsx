import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Zap,
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Info,
  Play,
  Pause,
  Bell,
  Award,
  Lightbulb,
  TrendingDown as TrendingDownIcon,
  Plus,
  Minus,
  RotateCw,
  Scale
} from 'lucide-react';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  assetClass: 'stocks' | 'bonds' | 'reits' | 'commodities' | 'crypto' | 'cash';
  sector: string;
  currentValue: number;
  shares: number;
  costBasis: number;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  dividendYield: number;
  expenseRatio: number;
  targetAllocation: number;
  actualAllocation: number;
  allocationDifference: number;
  beta: number;
  marketCap: 'large' | 'mid' | 'small';
  geography: 'domestic' | 'international' | 'emerging';
}

interface RebalancingRecommendation {
  id: string;
  symbol: string;
  name: string;
  action: 'buy' | 'sell' | 'hold';
  currentValue: number;
  targetValue: number;
  difference: number;
  differencePercent: number;
  shares: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: number;
}

interface PerformanceMetric {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'YTD' | 'All';
  return: number;
  benchmark: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
}

interface RiskMetric {
  metric: string;
  value: number;
  benchmark: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
  recommendation?: string;
}

const MOCK_HOLDINGS: PortfolioHolding[] = [
  {
    id: '1',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    assetClass: 'stocks',
    sector: 'Broad Market',
    currentValue: 15420.50,
    shares: 65.2,
    costBasis: 14800.00,
    currentPrice: 236.50,
    dayChange: 2.85,
    dayChangePercent: 1.22,
    totalReturn: 620.50,
    totalReturnPercent: 4.19,
    dividendYield: 1.32,
    expenseRatio: 0.03,
    targetAllocation: 40.0,
    actualAllocation: 43.2,
    allocationDifference: 3.2,
    beta: 1.0,
    marketCap: 'large',
    geography: 'domestic'
  },
  {
    id: '2',
    symbol: 'VTIAX',
    name: 'Vanguard Total International Stock',
    assetClass: 'stocks',
    sector: 'International',
    currentValue: 8950.25,
    shares: 450.8,
    costBasis: 9200.00,
    currentPrice: 19.86,
    dayChange: -0.12,
    dayChangePercent: -0.60,
    totalReturn: -249.75,
    totalReturnPercent: -2.71,
    dividendYield: 2.85,
    expenseRatio: 0.11,
    targetAllocation: 25.0,
    actualAllocation: 25.1,
    allocationDifference: 0.1,
    beta: 0.85,
    marketCap: 'large',
    geography: 'international'
  },
  {
    id: '3',
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    assetClass: 'bonds',
    sector: 'Aggregate Bonds',
    currentValue: 7820.75,
    shares: 95.6,
    costBasis: 8100.00,
    currentPrice: 81.82,
    dayChange: 0.15,
    dayChangePercent: 0.18,
    totalReturn: -279.25,
    totalReturnPercent: -3.45,
    dividendYield: 4.12,
    expenseRatio: 0.03,
    targetAllocation: 30.0,
    actualAllocation: 21.9,
    allocationDifference: -8.1,
    beta: 0.05,
    marketCap: 'large',
    geography: 'domestic'
  },
  {
    id: '4',
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    assetClass: 'reits',
    sector: 'Real Estate',
    currentValue: 3680.40,
    shares: 42.3,
    costBasis: 3500.00,
    currentPrice: 87.05,
    dayChange: 1.25,
    dayChangePercent: 1.46,
    totalReturn: 180.40,
    totalReturnPercent: 5.15,
    dividendYield: 3.68,
    expenseRatio: 0.12,
    targetAllocation: 5.0,
    actualAllocation: 10.3,
    allocationDifference: 5.3,
    beta: 1.15,
    marketCap: 'large',
    geography: 'domestic'
  }
];

const REBALANCING_RECOMMENDATIONS: RebalancingRecommendation[] = [
  {
    id: '1',
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    action: 'buy',
    currentValue: 7820.75,
    targetValue: 10707.00,
    difference: 2886.25,
    differencePercent: 8.1,
    shares: 35.3,
    reason: 'Under-allocated by 8.1% - need to increase bond exposure',
    priority: 'high',
    estimatedCost: 2895.50
  },
  {
    id: '2',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    action: 'sell',
    currentValue: 15420.50,
    targetValue: 14282.80,
    difference: -1137.70,
    differencePercent: -3.2,
    shares: -4.8,
    reason: 'Over-allocated by 3.2% - reduce US stock exposure',
    priority: 'medium',
    estimatedCost: 1145.20
  },
  {
    id: '3',
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    action: 'sell',
    currentValue: 3680.40,
    targetValue: 1785.35,
    difference: -1895.05,
    differencePercent: -5.3,
    shares: -21.8,
    reason: 'Over-allocated by 5.3% - reduce REIT exposure',
    priority: 'high',
    estimatedCost: 1897.66
  }
];

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  { period: '1D', return: 0.85, benchmark: 0.72, alpha: 0.13, beta: 0.98, sharpeRatio: 1.15, volatility: 12.5, maxDrawdown: -0.45 },
  { period: '1W', return: 2.15, benchmark: 1.98, alpha: 0.17, beta: 0.97, sharpeRatio: 1.18, volatility: 12.8, maxDrawdown: -1.25 },
  { period: '1M', return: 4.82, benchmark: 4.45, alpha: 0.37, beta: 0.96, sharpeRatio: 1.22, volatility: 13.2, maxDrawdown: -2.85 },
  { period: '3M', return: 8.95, benchmark: 8.12, alpha: 0.83, beta: 0.94, sharpeRatio: 1.28, volatility: 14.1, maxDrawdown: -5.25 },
  { period: '6M', return: 12.75, benchmark: 11.89, alpha: 0.86, beta: 0.93, sharpeRatio: 1.32, volatility: 15.2, maxDrawdown: -8.15 },
  { period: '1Y', return: 18.95, benchmark: 17.25, alpha: 1.70, beta: 0.92, sharpeRatio: 1.35, volatility: 16.8, maxDrawdown: -12.45 },
  { period: 'YTD', return: 14.25, benchmark: 13.15, alpha: 1.10, beta: 0.93, sharpeRatio: 1.31, volatility: 15.5, maxDrawdown: -8.95 }
];

const RISK_METRICS: RiskMetric[] = [
  {
    metric: 'Portfolio Beta',
    value: 0.93,
    benchmark: 1.0,
    status: 'good',
    description: 'Your portfolio is 7% less volatile than the market',
    recommendation: 'Good defensive positioning'
  },
  {
    metric: 'Sharpe Ratio',
    value: 1.35,
    benchmark: 1.15,
    status: 'good',
    description: 'Excellent risk-adjusted returns',
    recommendation: 'Continue current strategy'
  },
  {
    metric: 'Maximum Drawdown',
    value: -12.45,
    benchmark: -15.20,
    status: 'good',
    description: 'Lower downside risk than benchmark',
    recommendation: 'Good downside protection'
  },
  {
    metric: 'Correlation to S&P 500',
    value: 0.87,
    benchmark: 0.75,
    status: 'warning',
    description: 'High correlation to US stocks',
    recommendation: 'Consider more international diversification'
  },
  {
    metric: 'Portfolio Concentration',
    value: 0.43,
    benchmark: 0.30,
    status: 'warning',
    description: 'High concentration in US equities',
    recommendation: 'Increase asset class diversification'
  }
];

export default function AdvancedPortfolioAnalytics() {
  const [holdings] = useState<PortfolioHolding[]>(MOCK_HOLDINGS);
  const [recommendations] = useState<RebalancingRecommendation[]>(REBALANCING_RECOMMENDATIONS);
  const [performanceMetrics] = useState<PerformanceMetric[]>(PERFORMANCE_METRICS);
  const [riskMetrics] = useState<RiskMetric[]>(RISK_METRICS);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1Y');
  const [showValues, setShowValues] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'holdings' | 'performance' | 'rebalancing' | 'risk'>('overview');
  const [autoRebalance, setAutoRebalance] = useState(false);
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5);

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalReturn = holdings.reduce((sum, holding) => sum + holding.totalReturn, 0);
  const totalReturnPercent = (totalReturn / (totalPortfolioValue - totalReturn)) * 100;
  const dayChange = holdings.reduce((sum, holding) => sum + (holding.currentValue * holding.dayChangePercent / 100), 0);
  const dayChangePercent = (dayChange / totalPortfolioValue) * 100;

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getAssetClassColor = (assetClass: string) => {
    switch (assetClass) {
      case 'stocks': return '#3B82F6';
      case 'bonds': return '#10B981';
      case 'reits': return '#F59E0B';
      case 'commodities': return '#EF4444';
      case 'crypto': return '#8B5CF6';
      case 'cash': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'sell': return 'bg-red-100 text-red-800 border-red-200';
      case 'hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAssetAllocation = () => {
    const allocation: { [key: string]: number } = {};
    holdings.forEach(holding => {
      if (!allocation[holding.assetClass]) {
        allocation[holding.assetClass] = 0;
      }
      allocation[holding.assetClass] += holding.currentValue;
    });
    
    return Object.entries(allocation).map(([assetClass, value]) => ({
      assetClass,
      value,
      percentage: (value / totalPortfolioValue) * 100,
      color: getAssetClassColor(assetClass)
    }));
  };

  const selectedMetric = performanceMetrics.find(m => m.period === selectedPeriod) || performanceMetrics[5];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-purple-600" />
            Advanced Portfolio Analytics
          </h3>
          <p className="text-gray-600">Professional-grade portfolio analysis and rebalancing</p>
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
            Export Analysis
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Value</h4>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatValue(totalPortfolioValue)}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dayChangePercent >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="ml-1 text-lg font-medium">
                  {formatPercent(dayChangePercent)}
                </span>
              </div>
              <div className={`text-lg ${dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({dayChange >= 0 ? '+' : ''}{formatValue(Math.abs(dayChange))})
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Total Return:</span>
                <span className={`font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatValue(Math.abs(totalReturn))} ({formatPercent(totalReturnPercent)})
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h4>
            <div className="space-y-3">
              {getAssetAllocation().map((asset) => (
                <div key={asset.assetClass} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="font-medium text-gray-900 capitalize">
                      {asset.assetClass}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {asset.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatValue(asset.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            onClick={() => setViewMode('holdings')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'holdings' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'performance' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setViewMode('rebalancing')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'rebalancing' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Rebalancing
          </button>
          <button
            onClick={() => setViewMode('risk')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'risk' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Risk Analysis
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Benchmark</h4>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Interactive performance chart coming soon</p>
                <p className="text-sm text-gray-500 mt-1">Portfolio vs S&P 500 comparison</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Sharpe Ratio</span>
                <span className="text-lg font-bold text-green-900">{selectedMetric.sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Beta</span>
                <span className="text-lg font-bold text-blue-900">{selectedMetric.beta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">Alpha</span>
                <span className="text-lg font-bold text-purple-900">{formatPercent(selectedMetric.alpha)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-800">Volatility</span>
                <span className="text-lg font-bold text-orange-900">{selectedMetric.volatility.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'holdings' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Portfolio Holdings</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Day Change</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Return</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-lg font-medium text-gray-900">{holding.symbol}</div>
                        <div className="text-sm text-gray-600">{holding.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span 
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: getAssetClassColor(holding.assetClass) }}
                          />
                          <span className="text-xs text-gray-500 capitalize">{holding.assetClass}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium text-gray-900">
                      {formatValue(holding.currentValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {holding.shares.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`${holding.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-medium">{formatPercent(holding.dayChangePercent)}</div>
                        <div className="text-sm">${holding.dayChange.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`${holding.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-medium">{formatPercent(holding.totalReturnPercent)}</div>
                        <div className="text-sm">{formatValue(Math.abs(holding.totalReturn))}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{holding.actualAllocation.toFixed(1)}%</div>
                        <div className={`text-xs ${
                          Math.abs(holding.allocationDifference) > 2 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          Target: {holding.targetAllocation.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'performance' && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Performance Analysis</h4>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {['1M', '3M', '6M', '1Y', 'YTD'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      selectedPeriod === period ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Performance Metrics</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio Return</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Benchmark</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Alpha</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beta</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sharpe Ratio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max Drawdown</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.map((metric) => (
                    <tr key={metric.period} className={`hover:bg-gray-50 ${
                      metric.period === selectedPeriod ? 'bg-purple-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric.period}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        metric.return >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(metric.return)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                        metric.benchmark >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(metric.benchmark)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        metric.alpha >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(metric.alpha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {metric.beta.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {metric.sharpeRatio.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        {formatPercent(metric.maxDrawdown)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'rebalancing' && (
        <div className="space-y-6">
          {/* Rebalancing Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Rebalancing Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Rebalancing
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setAutoRebalance(!autoRebalance)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRebalance ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRebalance ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-700">
                    {autoRebalance ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rebalance Threshold
                </label>
                <select
                  value={rebalanceThreshold}
                  onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={2}>2% deviation</option>
                  <option value={5}>5% deviation</option>
                  <option value={10}>10% deviation</option>
                  <option value={15}>15% deviation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Rebalance
                </label>
                <div className="text-sm text-gray-900">
                  {autoRebalance ? 'Quarterly (Next: Apr 1, 2024)' : 'Manual only'}
                </div>
              </div>
            </div>
          </div>

          {/* Rebalancing Recommendations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Rebalancing Recommendations</h4>
              <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                <ArrowRightLeft size={16} className="mr-2" />
                Execute Rebalance
              </button>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className={`p-4 rounded-lg border ${getRecommendationColor(rec.action)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-1 rounded-full ${
                          rec.action === 'buy' ? 'bg-green-600' :
                          rec.action === 'sell' ? 'bg-red-600' :
                          'bg-gray-600'
                        }`}>
                          {rec.action === 'buy' ? <Plus size={14} className="text-white" /> :
                           rec.action === 'sell' ? <Minus size={14} className="text-white" /> :
                           <ArrowRightLeft size={14} className="text-white" />}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{rec.action.toUpperCase()} {rec.symbol}</h5>
                          <p className="text-sm text-gray-600">{rec.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Current:</span>
                          <div className="font-medium">{formatValue(rec.currentValue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <div className="font-medium">{formatValue(rec.targetValue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Difference:</span>
                          <div className={`font-medium ${rec.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatValue(Math.abs(rec.difference))} ({formatPercent(Math.abs(rec.differencePercent))})
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Shares:</span>
                          <div className="font-medium">{Math.abs(rec.shares).toFixed(1)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Reason:</strong> {rec.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Rebalancing Summary</h5>
                  <p className="text-sm text-blue-800 mt-1">
                    Total estimated cost: {formatValue(recommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0))}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    This rebalancing will bring your portfolio back to target allocation within {rebalanceThreshold}% tolerance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'risk' && (
        <div className="space-y-6">
          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Risk Score</p>
                  <p className="text-3xl font-bold text-green-900">7.2</p>
                  <p className="text-xs text-green-700">Low-Moderate Risk</p>
                </div>
                <Scale className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Diversification</p>
                  <p className="text-3xl font-bold text-blue-900">8.5</p>
                  <p className="text-xs text-blue-700">Well Diversified</p>
                </div>
                <PieChart className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Quality Score</p>
                  <p className="text-3xl font-bold text-purple-900">9.1</p>
                  <p className="text-xs text-purple-700">High Quality</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Risk Analysis</h4>
            <div className="space-y-4">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">{metric.metric}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskStatusColor(metric.status)}`}>
                          {metric.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Your Portfolio:</span>
                          <div className="text-lg font-bold text-gray-900">
                            {metric.metric.includes('Ratio') || metric.metric.includes('Beta') || metric.metric.includes('Correlation') ? 
                             metric.value.toFixed(2) : 
                             metric.metric.includes('Drawdown') || metric.metric.includes('%') ? 
                             formatPercent(metric.value) : 
                             metric.value.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Benchmark:</span>
                          <div className="text-lg font-medium text-gray-700">
                            {metric.metric.includes('Ratio') || metric.metric.includes('Beta') || metric.metric.includes('Correlation') ? 
                             metric.benchmark.toFixed(2) : 
                             metric.metric.includes('Drawdown') || metric.metric.includes('%') ? 
                             formatPercent(metric.benchmark) : 
                             metric.benchmark.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{metric.description}</p>
                      {metric.recommendation && (
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-700">{metric.recommendation}</p>
                        </div>
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