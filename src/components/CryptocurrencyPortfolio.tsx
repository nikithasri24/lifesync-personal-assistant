import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Bitcoin,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Star,
  Activity,
  BarChart3,
  PieChart,
  DollarSign,
  Percent,
  Clock,
  Calendar,
  Target,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Minus,
  Settings,
  Bell,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Award,
  Building,
  Globe,
  Users,
  Lock,
  Unlock,
  Search,
  Filter,
  X,
  ExternalLink
} from 'lucide-react';

interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  marketCap: number;
  volume24h: number;
  marketCapRank: number;
  allocation: number;
  exchanges: string[];
  lastUpdated: Date;
}

interface CryptoTransaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer' | 'stake' | 'unstake' | 'earn';
  symbol: string;
  amount: number;
  price: number;
  fee: number;
  date: Date;
  exchange: string;
  txHash?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface CryptoAlert {
  id: string;
  symbol: string;
  type: 'price_target' | 'percentage_move' | 'volume_spike' | 'market_cap' | 'news';
  condition: 'above' | 'below' | 'increase' | 'decrease';
  threshold: number;
  currentValue: number;
  isActive: boolean;
  lastTriggered?: Date;
  description: string;
}

interface DeFiPosition {
  id: string;
  protocol: string;
  type: 'lending' | 'liquidity_pool' | 'staking' | 'yield_farming';
  assets: { symbol: string; amount: number }[];
  apy: number;
  value: number;
  rewards: number;
  startDate: Date;
  lockPeriod?: number;
  autoCompound: boolean;
}

interface CryptoInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'information' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  impact: number;
  relatedSymbols: string[];
  timestamp: Date;
}

interface MarketData {
  totalMarketCap: number;
  total24hVolume: number;
  btcDominance: number;
  fearGreedIndex: number;
  activeCoins: number;
  topMovers: { symbol: string; change: number }[];
}

const MOCK_HOLDINGS: CryptoHolding[] = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    amount: 0.25,
    avgCost: 42000,
    currentPrice: 45250,
    value: 11312.50,
    dayChange: 1125,
    dayChangePercent: 2.4,
    totalReturn: 812.50,
    totalReturnPercent: 7.7,
    marketCap: 885000000000,
    volume24h: 28500000000,
    marketCapRank: 1,
    allocation: 45.2,
    exchanges: ['Coinbase', 'Binance'],
    lastUpdated: new Date()
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    amount: 4.5,
    avgCost: 2800,
    currentPrice: 3150,
    value: 14175,
    dayChange: 315,
    dayChangePercent: 2.3,
    totalReturn: 1575,
    totalReturnPercent: 12.5,
    marketCap: 378000000000,
    volume24h: 15200000000,
    marketCapRank: 2,
    allocation: 56.7,
    exchanges: ['Coinbase', 'Kraken'],
    lastUpdated: new Date()
  },
  {
    id: '3',
    symbol: 'ADA',
    name: 'Cardano',
    icon: '₳',
    amount: 2500,
    avgCost: 0.85,
    currentPrice: 0.92,
    value: 2300,
    dayChange: -23,
    dayChangePercent: -1.0,
    totalReturn: 175,
    totalReturnPercent: 8.2,
    marketCap: 32500000000,
    volume24h: 850000000,
    marketCapRank: 8,
    allocation: 9.2,
    exchanges: ['Binance'],
    lastUpdated: new Date()
  },
  {
    id: '4',
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    amount: 15,
    avgCost: 95,
    currentPrice: 118,
    value: 1770,
    dayChange: 88.5,
    dayChangePercent: 5.3,
    totalReturn: 345,
    totalReturnPercent: 24.2,
    marketCap: 51200000000,
    volume24h: 2100000000,
    marketCapRank: 5,
    allocation: 7.1,
    exchanges: ['FTX', 'Binance'],
    lastUpdated: new Date()
  }
];

const MOCK_TRANSACTIONS: CryptoTransaction[] = [
  {
    id: '1',
    type: 'buy',
    symbol: 'BTC',
    amount: 0.1,
    price: 45250,
    fee: 22.63,
    date: new Date('2024-01-20'),
    exchange: 'Coinbase',
    txHash: '0x1234...abcd',
    status: 'completed'
  },
  {
    id: '2',
    type: 'sell',
    symbol: 'ETH',
    amount: 0.5,
    price: 3150,
    fee: 7.88,
    date: new Date('2024-01-18'),
    exchange: 'Binance',
    txHash: '0x5678...efgh',
    status: 'completed'
  },
  {
    id: '3',
    type: 'stake',
    symbol: 'ADA',
    amount: 500,
    price: 0.92,
    fee: 2.00,
    date: new Date('2024-01-15'),
    exchange: 'Native Wallet',
    status: 'completed'
  }
];

const DEFI_POSITIONS: DeFiPosition[] = [
  {
    id: '1',
    protocol: 'Aave',
    type: 'lending',
    assets: [{ symbol: 'USDC', amount: 5000 }],
    apy: 4.25,
    value: 5000,
    rewards: 125.50,
    startDate: new Date('2023-12-01'),
    autoCompound: true
  },
  {
    id: '2',
    protocol: 'Uniswap V3',
    type: 'liquidity_pool',
    assets: [
      { symbol: 'ETH', amount: 1.0 },
      { symbol: 'USDC', amount: 3150 }
    ],
    apy: 12.8,
    value: 6300,
    rewards: 89.25,
    startDate: new Date('2024-01-01'),
    autoCompound: false
  },
  {
    id: '3',
    protocol: 'Ethereum 2.0',
    type: 'staking',
    assets: [{ symbol: 'ETH', amount: 32 }],
    apy: 5.2,
    value: 100800,
    rewards: 2456.80,
    startDate: new Date('2023-09-15'),
    lockPeriod: 365,
    autoCompound: true
  }
];

const MARKET_DATA: MarketData = {
  totalMarketCap: 1850000000000,
  total24hVolume: 85000000000,
  btcDominance: 47.8,
  fearGreedIndex: 72,
  activeCoins: 8945,
  topMovers: [
    { symbol: 'SOL', change: 8.4 },
    { symbol: 'AVAX', change: 7.2 },
    { symbol: 'MATIC', change: -5.8 },
    { symbol: 'DOT', change: -4.1 }
  ]
};

const CRYPTO_INSIGHTS: CryptoInsight[] = [
  {
    id: '1',
    title: 'DCA Strategy Performing Well',
    description: 'Your dollar-cost averaging into Bitcoin over the past 6 months has outperformed lump-sum investing by 3.2%',
    type: 'achievement',
    priority: 'medium',
    impact: 812,
    relatedSymbols: ['BTC'],
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Portfolio Concentration Risk',
    description: 'Your top 2 holdings (BTC + ETH) represent 85% of your portfolio. Consider diversifying into other assets.',
    type: 'warning',
    priority: 'high',
    impact: 0,
    relatedSymbols: ['BTC', 'ETH'],
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Staking Rewards Opportunity',
    description: 'Your ETH holdings could earn an additional $420/year through staking. Consider staking 50% of your position.',
    type: 'opportunity',
    priority: 'medium',
    impact: 420,
    relatedSymbols: ['ETH'],
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];

export default function CryptocurrencyPortfolio() {
  const [holdings, setHoldings] = useState<CryptoHolding[]>(MOCK_HOLDINGS);
  const [transactions] = useState<CryptoTransaction[]>(MOCK_TRANSACTIONS);
  const [defiPositions] = useState<DeFiPosition[]>(DEFI_POSITIONS);
  const [insights] = useState<CryptoInsight[]>(CRYPTO_INSIGHTS);
  const [marketData] = useState<MarketData>(MARKET_DATA);
  const [viewMode, setViewMode] = useState<'overview' | 'holdings' | 'defi' | 'transactions' | 'alerts' | 'analytics'>('overview');
  const [showValues, setShowValues] = useState(true);
  const [sortBy, setSortBy] = useState<'value' | 'return' | 'allocation'>('value');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');

  // Simulate real-time price updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setHoldings(prev => prev.map(holding => {
        const priceChange = (Math.random() - 0.5) * holding.currentPrice * 0.05;
        const newPrice = Math.max(0.01, holding.currentPrice + priceChange);
        const newValue = holding.amount * newPrice;
        const newDayChange = newPrice - holding.avgCost;
        const newDayChangePercent = (newDayChange / holding.avgCost) * 100;
        
        return {
          ...holding,
          currentPrice: newPrice,
          value: newValue,
          dayChange: newDayChange * holding.amount,
          dayChangePercent: newDayChangePercent,
          lastUpdated: new Date()
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalDayChange = holdings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const totalDayChangePercent = (totalDayChange / (totalPortfolioValue - totalDayChange)) * 100;
  const totalReturn = holdings.reduce((sum, holding) => sum + holding.totalReturn, 0);
  const totalReturnPercent = (totalReturn / (totalPortfolioValue - totalReturn)) * 100;

  const totalDeFiValue = defiPositions.reduce((sum, position) => sum + position.value, 0);
  const totalDeFiRewards = defiPositions.reduce((sum, position) => sum + position.rewards, 0);

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCrypto = (amount: number, decimals: number = 6) => {
    if (!showValues) return '•••••';
    return amount.toFixed(decimals);
  };

  const getFearGreedColor = (index: number) => {
    if (index >= 75) return 'text-red-600 bg-red-50';
    if (index >= 55) return 'text-orange-600 bg-orange-50';
    if (index >= 45) return 'text-yellow-600 bg-yellow-50';
    if (index >= 25) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getFearGreedLabel = (index: number) => {
    if (index >= 75) return 'Extreme Greed';
    if (index >= 55) return 'Greed';
    if (index >= 45) return 'Neutral';
    if (index >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'Aave': return Building;
      case 'Uniswap V3': return Zap;
      case 'Ethereum 2.0': return Shield;
      default: return DollarSign;
    }
  };

  const sortedHoldings = [...holdings].sort((a, b) => {
    switch (sortBy) {
      case 'value': return b.value - a.value;
      case 'return': return b.totalReturnPercent - a.totalReturnPercent;
      case 'allocation': return b.allocation - a.allocation;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bitcoin className="w-8 h-8 mr-3 text-orange-500" />
            Cryptocurrency Portfolio
          </h3>
          <p className="text-gray-600">Digital asset portfolio management and DeFi tracking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLiveMode 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {isLiveMode ? <Activity size={16} /> : <Clock size={16} />}
            <span className="ml-2">{isLiveMode ? 'Live' : 'Paused'}</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
            <Plus size={18} className="mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Total Portfolio</p>
              <p className="text-2xl font-bold text-orange-900">{formatValue(totalPortfolioValue)}</p>
              <div className={`text-sm font-medium ${totalDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalDayChange >= 0 ? '+' : ''}{formatValue(Math.abs(totalDayChange))} ({totalDayChangePercent.toFixed(2)}%)
              </div>
            </div>
            <Bitcoin className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Return</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(totalReturn)}</p>
              <p className="text-xs text-green-700">{totalReturnPercent.toFixed(2)}% all time</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">DeFi Value</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(totalDeFiValue)}</p>
              <p className="text-xs text-blue-700">Rewards: {formatValue(totalDeFiRewards)}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Fear & Greed</p>
              <p className="text-2xl font-bold text-purple-900">{marketData.fearGreedIndex}</p>
              <p className="text-xs text-purple-700">{getFearGreedLabel(marketData.fearGreedIndex)}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{(marketData.totalMarketCap / 1e12).toFixed(2)}T</div>
            <div className="text-sm text-gray-600">Market Cap</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{(marketData.total24hVolume / 1e9).toFixed(0)}B</div>
            <div className="text-sm text-gray-600">24h Volume</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{marketData.btcDominance.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">BTC Dominance</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getFearGreedColor(marketData.fearGreedIndex)}`}>
              {marketData.fearGreedIndex}
            </div>
            <div className="text-sm text-gray-600">Fear & Greed</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{marketData.activeCoins.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Coins</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'overview' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('holdings')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'holdings' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setViewMode('defi')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'defi' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            DeFi Positions
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'transactions' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'analytics' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Holdings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Holdings</h4>
            <div className="space-y-4">
              {sortedHoldings.slice(0, 4).map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold">{holding.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{holding.symbol}</div>
                      <div className="text-sm text-gray-600">{formatCrypto(holding.amount)} {holding.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatValue(holding.value)}</div>
                    <div className={`text-sm ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.dayChange >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Insights */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h4>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-3 rounded-lg border ${
                  insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? 'bg-red-50 border-red-200' :
                  insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">{insight.title}</h5>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {insight.relatedSymbols.map((symbol) => (
                          <span key={symbol} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            {symbol}
                          </span>
                        ))}
                      </div>
                    </div>
                    {insight.impact > 0 && (
                      <div className="text-green-600 font-semibold text-sm">
                        +{formatValue(insight.impact)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'holdings' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Holdings Details</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="value">Sort by Value</option>
                <option value="return">Sort by Return</option>
                <option value="allocation">Sort by Allocation</option>
              </select>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Holdings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Return</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedHoldings.map((holding) => (
                    <tr key={holding.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">{holding.icon}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{holding.symbol}</div>
                            <div className="text-sm text-gray-600">{holding.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCrypto(holding.amount)}</div>
                        <div className="text-xs text-gray-600">#{holding.marketCapRank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatValue(holding.currentPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatValue(holding.value)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {holding.dayChange >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        holding.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div>{holding.totalReturn >= 0 ? '+' : ''}{holding.totalReturnPercent.toFixed(2)}%</div>
                        <div className="text-xs">{formatValue(Math.abs(holding.totalReturn))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {holding.allocation.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'defi' && (
        <div className="space-y-4">
          {defiPositions.map((position) => {
            const ProtocolIcon = getProtocolIcon(position.protocol);
            return (
              <div key={position.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ProtocolIcon size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{position.protocol}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                          {position.type.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {position.apy.toFixed(1)}% APY
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Assets</h4>
                          {position.assets.map((asset, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {formatCrypto(asset.amount)} {asset.symbol}
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Position Value: {formatValue(position.value)}</div>
                            <div>Rewards Earned: {formatValue(position.rewards)}</div>
                            <div>Started: {position.startDate.toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Settings</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {position.lockPeriod && (
                              <div>Lock Period: {position.lockPeriod} days</div>
                            )}
                            <div>Auto-compound: {position.autoCompound ? 'Yes' : 'No'}</div>
                            <div className="mt-2">
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Manage Position →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'transactions' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Transaction History</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tx.type === 'buy' ? 'bg-green-100 text-green-800' :
                        tx.type === 'sell' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCrypto(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatValue(tx.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatValue(tx.amount * tx.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.exchange}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Allocation */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h4>
            <div className="space-y-3">
              {sortedHoldings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-xs">{holding.icon}</span>
                    </div>
                    <span className="font-medium text-gray-900">{holding.symbol}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(holding.value / totalPortfolioValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {((holding.value / totalPortfolioValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Best Performer</span>
                <div className="text-right">
                  <div className="font-semibold text-green-900">SOL</div>
                  <div className="text-sm text-green-700">+24.2%</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-800 font-medium">Worst Performer</span>
                <div className="text-right">
                  <div className="font-semibold text-red-900">ADA</div>
                  <div className="text-sm text-red-700">-1.0%</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">Portfolio Beta</span>
                <div className="font-semibold text-blue-900">1.15</div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-800 font-medium">Sharpe Ratio</span>
                <div className="font-semibold text-purple-900">1.8</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}