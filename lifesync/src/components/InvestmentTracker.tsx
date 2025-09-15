import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  Calendar,
  Info,
  Award,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useFinancialDataWebSocket } from '../hooks/useWebSocket';

interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'crypto' | 'mutual_fund';
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dividendYield?: number;
  lastUpdated: Date;
}

interface Portfolio {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cash: number;
}

const MOCK_INVESTMENTS: Investment[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    shares: 25,
    avgCost: 150.00,
    currentPrice: 175.20,
    totalValue: 4380.00,
    gainLoss: 630.00,
    gainLossPercent: 16.8,
    dividendYield: 0.5,
    lastUpdated: new Date()
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    shares: 10,
    avgCost: 120.50,
    currentPrice: 138.75,
    totalValue: 1387.50,
    gainLoss: 182.50,
    gainLossPercent: 15.1,
    lastUpdated: new Date()
  },
  {
    id: '3',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    type: 'etf',
    shares: 50,
    avgCost: 200.00,
    currentPrice: 225.30,
    totalValue: 11265.00,
    gainLoss: 1265.00,
    gainLossPercent: 12.65,
    dividendYield: 1.8,
    lastUpdated: new Date()
  },
  {
    id: '4',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    shares: 0.5,
    avgCost: 45000.00,
    currentPrice: 52000.00,
    totalValue: 26000.00,
    gainLoss: 3500.00,
    gainLossPercent: 15.6,
    lastUpdated: new Date()
  },
  {
    id: '5',
    symbol: 'VTIAX',
    name: 'Vanguard Total International Stock',
    type: 'mutual_fund',
    shares: 200,
    avgCost: 25.00,
    currentPrice: 28.50,
    totalValue: 5700.00,
    gainLoss: 700.00,
    gainLossPercent: 14.0,
    dividendYield: 2.1,
    lastUpdated: new Date()
  }
];

const PORTFOLIO: Portfolio = {
  totalValue: 48732.50,
  totalGainLoss: 6277.50,
  totalGainLossPercent: 14.8,
  dayChange: 425.75,
  dayChangePercent: 0.88,
  cash: 2500.00
};

const ASSET_ALLOCATION = [
  { name: 'US Stocks', value: 17032.50, percentage: 35.0, color: '#3B82F6' },
  { name: 'International Stocks', value: 5700.00, percentage: 11.7, color: '#10B981' },
  { name: 'ETFs', value: 11265.00, percentage: 23.1, color: '#8B5CF6' },
  { name: 'Cryptocurrency', value: 26000.00, percentage: 25.3, color: '#F59E0B' },
  { name: 'Cash', value: 2500.00, percentage: 5.1, color: '#6B7280' }
];

export default function InvestmentTracker() {
  // WebSocket connection for real-time price updates
  const {
    isConnected,
    isConnecting,
    marketData: wsMarketData,
    portfolioData: wsPortfolioData,
    connect,
    disconnect
  } = useFinancialDataWebSocket();

  const [investments, setInvestments] = useState<Investment[]>(MOCK_INVESTMENTS);
  const [portfolio, setPortfolio] = useState<Portfolio>(PORTFOLIO);
  const [hideValues, setHideValues] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1D');
  const [sortBy, setSortBy] = useState<'value' | 'gainLoss' | 'gainLossPercent' | 'symbol'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isRealTimeMode, setIsRealTimeMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Handle real-time price updates from WebSocket
  useEffect(() => {
    if (wsMarketData.length > 0 && isRealTimeMode) {
      setInvestments(prevInvestments => 
        prevInvestments.map(investment => {
          const priceUpdate = wsMarketData.find(data => data.symbol === investment.symbol);
          if (priceUpdate) {
            const newPrice = priceUpdate.price;
            const newTotalValue = investment.shares * newPrice;
            const newGainLoss = newTotalValue - (investment.shares * investment.avgCost);
            const newGainLossPercent = ((newPrice - investment.avgCost) / investment.avgCost) * 100;
            
            return {
              ...investment,
              currentPrice: newPrice,
              totalValue: newTotalValue,
              gainLoss: newGainLoss,
              gainLossPercent: newGainLossPercent,
              lastUpdated: new Date()
            };
          }
          return investment;
        })
      );
      setLastUpdate(new Date());
    }
  }, [wsMarketData, isRealTimeMode]);

  // Handle portfolio-level updates
  useEffect(() => {
    if (wsPortfolioData && isRealTimeMode) {
      setPortfolio(prevPortfolio => ({
        ...prevPortfolio,
        totalValue: wsPortfolioData.totalValue || prevPortfolio.totalValue,
        dayChange: wsPortfolioData.dayChange || prevPortfolio.dayChange,
        totalGainLoss: wsPortfolioData.totalGainLoss || prevPortfolio.totalGainLoss
      }));
    }
  }, [wsPortfolioData, isRealTimeMode]);

  // Control WebSocket connection based on real-time mode
  useEffect(() => {
    if (isRealTimeMode && !isConnected && !isConnecting) {
      connect();
    } else if (!isRealTimeMode && isConnected) {
      disconnect();
    }
  }, [isRealTimeMode, isConnected, isConnecting, connect, disconnect]);

  // Recalculate portfolio totals when investments change
  useEffect(() => {
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0) + portfolio.cash;
    const totalGainLoss = investments.reduce((sum, inv) => sum + inv.gainLoss, 0);
    const totalCost = investments.reduce((sum, inv) => sum + (inv.shares * inv.avgCost), 0);
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    
    setPortfolio(prev => ({
      ...prev,
      totalValue,
      totalGainLoss,
      totalGainLossPercent
    }));
  }, [investments, portfolio.cash]);

  const getInvestmentTypeIcon = (type: string) => {
    switch (type) {
      case 'stock': return '📈';
      case 'etf': return '📊';
      case 'bond': return '🏛️';
      case 'crypto': return '₿';
      case 'mutual_fund': return '🏦';
      default: return '💼';
    }
  };

  const getInvestmentTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-blue-100 text-blue-800';
      case 'etf': return 'bg-purple-100 text-purple-800';
      case 'bond': return 'bg-green-100 text-green-800';
      case 'crypto': return 'bg-orange-100 text-orange-800';
      case 'mutual_fund': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: number) => {
    if (hideValues) return '•••••';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const sortedInvestments = [...investments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'value':
        aValue = a.totalValue;
        bValue = b.totalValue;
        break;
      case 'gainLoss':
        aValue = a.gainLoss;
        bValue = b.gainLoss;
        break;
      case 'gainLossPercent':
        aValue = a.gainLossPercent;
        bValue = b.gainLossPercent;
        break;
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      default:
        aValue = a.totalValue;
        bValue = b.totalValue;
    }
    
    if (typeof aValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue);
    }
    
    return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
            Investment Portfolio
          </h3>
          <p className="text-gray-600">Track your investments and portfolio performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' :
              isConnecting ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>

          <button
            onClick={() => setIsRealTimeMode(!isRealTimeMode)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRealTimeMode 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {isRealTimeMode ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="ml-2">{isRealTimeMode ? 'Real-Time' : 'Static'}</span>
          </button>

          <button
            onClick={() => setHideValues(!hideValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {hideValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{hideValues ? 'Show' : 'Hide'}</span>
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Sync Portfolio
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Plus size={18} className="mr-2" />
            Add Investment
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                Total Portfolio Value
                {isRealTimeMode && isConnected && (
                  <div className="ml-2 flex items-center space-x-1">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </h4>
              <div className="flex items-center space-x-2">
                {portfolio.dayChangePercent >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  portfolio.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(portfolio.dayChangePercent)} today
                </span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatValue(portfolio.totalValue)}
            </div>
            <div className={`text-sm ${portfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.dayChange >= 0 ? '+' : ''}{formatValue(portfolio.dayChange)} today
            </div>
            {isRealTimeMode && (
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {formatValue(portfolio.totalGainLoss)}
            </div>
            <div className="text-sm text-gray-600">Total Gains</div>
            <div className="text-xs text-green-600 mt-1">
              {formatPercent(portfolio.totalGainLossPercent)}
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {investments.length}
            </div>
            <div className="text-sm text-gray-600">Holdings</div>
            <div className="text-xs text-blue-600 mt-1">
              {new Set(investments.map(i => i.type)).size} types
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">
              {formatValue(portfolio.cash)}
            </div>
            <div className="text-sm text-gray-600">Cash</div>
            <div className="text-xs text-gray-600 mt-1">
              {((portfolio.cash / (portfolio.totalValue + portfolio.cash)) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Timeframe */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Performance</h4>
          <div className="flex border border-gray-300 rounded-lg">
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${timeframe === '1D' ? 'rounded-l-lg' : timeframe === 'ALL' ? 'rounded-r-lg' : ''}`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Interactive chart coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Portfolio performance over {selectedTimeframe}</p>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h4>
          
          <div className="space-y-4">
            {ASSET_ALLOCATION.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatValue(asset.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {asset.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 relative">
            <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
              {ASSET_ALLOCATION.map((asset, index) => (
                <div
                  key={index}
                  className="h-full"
                  style={{
                    backgroundColor: asset.color,
                    width: `${asset.percentage}%`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Insights</h4>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-green-800">Well Diversified</div>
                <div className="text-xs text-green-700">Your portfolio spans multiple asset classes</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-800">Strong Performance</div>
                <div className="text-xs text-blue-700">Up {formatPercent(portfolio.totalGainLossPercent)} overall</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-800">High Crypto Allocation</div>
                <div className="text-xs text-yellow-700">Consider rebalancing if over your risk tolerance</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Award className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-purple-800">Top Performer</div>
                <div className="text-xs text-purple-700">AAPL is your best performing holding</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Holdings</h4>
            <div className="text-sm text-gray-500">
              {investments.length} investments • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('symbol')}
                >
                  Symbol {sortBy === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('value')}
                >
                  Value {sortBy === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('gainLoss')}
                >
                  Gain/Loss {sortBy === 'gainLoss' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('gainLossPercent')}
                >
                  % Change {sortBy === 'gainLossPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedInvestments.map((investment) => (
                <tr key={investment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">{getInvestmentTypeIcon(investment.type)}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{investment.symbol}</div>
                        <div className="text-xs text-gray-500 truncate max-w-32">{investment.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvestmentTypeColor(investment.type)}`}>
                      {investment.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {investment.shares.toLocaleString(undefined, { 
                      minimumFractionDigits: investment.type === 'crypto' ? 4 : 0,
                      maximumFractionDigits: investment.type === 'crypto' ? 4 : 0
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatValue(investment.avgCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatValue(investment.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {formatValue(investment.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {investment.gainLoss >= 0 ? '+' : ''}{formatValue(investment.gainLoss)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={investment.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(investment.gainLossPercent)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}