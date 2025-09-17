import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMemoizedCalculation, useDebouncedCallback } from '../hooks/useOptimization';
import { useFinancialDataWebSocket } from '../hooks/useWebSocket';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Percent,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Globe,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Download,
  Settings,
  Bell,
  Star,
  Flame,
  Target,
  Calendar,
  Building,
  CreditCard,
  Wallet,
  TrendingDown as TrendingDownIcon,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Filter,
  Maximize,
  Minimize
} from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: Date;
  sector: string;
  exchange: string;
}

interface PortfolioPosition {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  weight: number;
  sector: string;
  dividendYield: number;
  lastUpdate: Date;
}

interface RealTimeMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  format: 'currency' | 'percentage' | 'number';
  trend: 'up' | 'down' | 'neutral';
  category: 'portfolio' | 'market' | 'account' | 'goal';
  isLive: boolean;
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  symbols: string[];
  category: 'market' | 'economy' | 'earnings' | 'politics' | 'crypto';
  impact: 'high' | 'medium' | 'low';
}

interface AlertRule {
  id: string;
  type: 'price_target' | 'percentage_move' | 'volume_spike' | 'news_sentiment';
  symbol?: string;
  condition: 'above' | 'below' | 'increase' | 'decrease';
  threshold: number;
  isActive: boolean;
  lastTriggered?: Date;
  description: string;
}

const MOCK_MARKET_DATA: MarketData[] = [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    price: 487.23,
    change: 3.45,
    changePercent: 0.71,
    volume: 45234567,
    marketCap: 450000000000,
    high52Week: 495.30,
    low52Week: 362.17,
    lastUpdated: new Date(),
    sector: 'ETF',
    exchange: 'NYSE'
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    price: 412.67,
    change: -2.18,
    changePercent: -0.52,
    volume: 32145890,
    marketCap: 200000000000,
    high52Week: 442.86,
    low52Week: 283.45,
    lastUpdated: new Date(),
    sector: 'ETF',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 192.75,
    change: 1.25,
    changePercent: 0.65,
    volume: 78234567,
    marketCap: 2950000000000,
    high52Week: 199.62,
    low52Week: 124.17,
    lastUpdated: new Date(),
    sector: 'Technology',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 378.92,
    change: -1.89,
    changePercent: -0.50,
    volume: 23456789,
    marketCap: 2820000000000,
    high52Week: 384.30,
    low52Week: 213.43,
    lastUpdated: new Date(),
    sector: 'Technology',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 234.56,
    change: 8.92,
    changePercent: 3.95,
    volume: 89567234,
    marketCap: 750000000000,
    high52Week: 299.29,
    low52Week: 138.80,
    lastUpdated: new Date(),
    sector: 'Auto',
    exchange: 'NASDAQ'
  }
];

const MOCK_PORTFOLIO: PortfolioPosition[] = [
  {
    id: '1',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    shares: 125.5,
    avgCost: 218.45,
    currentPrice: 236.78,
    totalValue: 29716.89,
    dayChange: 1.12,
    dayChangePercent: 0.48,
    totalReturn: 2301.09,
    totalReturnPercent: 8.39,
    weight: 42.3,
    sector: 'Broad Market',
    dividendYield: 1.32,
    lastUpdate: new Date()
  },
  {
    id: '2',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 45.0,
    avgCost: 165.30,
    currentPrice: 192.75,
    totalValue: 8673.75,
    dayChange: 0.65,
    dayChangePercent: 0.34,
    totalReturn: 1235.25,
    totalReturnPercent: 16.62,
    weight: 12.4,
    sector: 'Technology',
    dividendYield: 0.44,
    lastUpdate: new Date()
  },
  {
    id: '3',
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    shares: 200.0,
    avgCost: 82.15,
    currentPrice: 79.85,
    totalValue: 15970.00,
    dayChange: 0.05,
    dayChangePercent: 0.06,
    totalReturn: -460.00,
    totalReturnPercent: -2.80,
    weight: 22.8,
    sector: 'Bonds',
    dividendYield: 4.12,
    lastUpdate: new Date()
  }
];

const MOCK_REAL_TIME_METRICS: RealTimeMetric[] = [
  {
    id: '1',
    label: 'Portfolio Value',
    value: 68420.50,
    previousValue: 67895.25,
    change: 525.25,
    changePercent: 0.77,
    format: 'currency',
    trend: 'up',
    category: 'portfolio',
    isLive: true
  },
  {
    id: '2',
    label: 'Day P&L',
    value: 1234.56,
    previousValue: 0,
    change: 1234.56,
    changePercent: 1.84,
    format: 'currency',
    trend: 'up',
    category: 'portfolio',
    isLive: true
  },
  {
    id: '3',
    label: 'Total Return',
    value: 8745.32,
    previousValue: 8512.18,
    change: 233.14,
    changePercent: 2.74,
    format: 'currency',
    trend: 'up',
    category: 'portfolio',
    isLive: true
  },
  {
    id: '4',
    label: 'Cash Available',
    value: 12750.00,
    previousValue: 12750.00,
    change: 0,
    changePercent: 0,
    format: 'currency',
    trend: 'neutral',
    category: 'account',
    isLive: false
  },
  {
    id: '5',
    label: 'Allocation Score',
    value: 87.5,
    previousValue: 86.2,
    change: 1.3,
    changePercent: 1.51,
    format: 'number',
    trend: 'up',
    category: 'portfolio',
    isLive: true
  },
  {
    id: '6',
    label: 'VIX Level',
    value: 18.42,
    previousValue: 19.15,
    change: -0.73,
    changePercent: -3.81,
    format: 'number',
    trend: 'down',
    category: 'market',
    isLive: true
  }
];

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    headline: 'Federal Reserve Signals Potential Rate Cuts Ahead',
    summary: 'Fed officials indicate possible policy easing in response to economic indicators.',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 15 * 60 * 1000),
    sentiment: 'positive',
    symbols: ['SPY', 'QQQ'],
    category: 'economy',
    impact: 'high'
  },
  {
    id: '2',
    headline: 'Apple Reports Strong Q4 Earnings, Beats Expectations',
    summary: 'Apple\'s latest quarterly results exceeded analyst predictions across key metrics.',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 45 * 60 * 1000),
    sentiment: 'positive',
    symbols: ['AAPL'],
    category: 'earnings',
    impact: 'medium'
  },
  {
    id: '3',
    headline: 'Market Volatility Expected as Earnings Season Begins',
    summary: 'Analysts anticipate increased market movement during upcoming earnings releases.',
    source: 'CNBC',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    sentiment: 'neutral',
    symbols: ['SPY', 'QQQ'],
    category: 'market',
    impact: 'medium'
  }
];

function RealTimeFinancialDashboard() {
  // WebSocket connection for real-time data
  const {
    isConnected,
    isConnecting,
    error: wsError,
    marketData: wsMarketData,
    portfolioData: wsPortfolioData,
    alerts: wsAlerts,
    news: wsNews,
    connect,
    disconnect
  } = useFinancialDataWebSocket();

  const [marketData, setMarketData] = useState<MarketData[]>(MOCK_MARKET_DATA);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>(MOCK_PORTFOLIO);
  const [metrics, setMetrics] = useState<RealTimeMetric[]>(MOCK_REAL_TIME_METRICS);
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('portfolio');
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Connection status based on WebSocket state
  const connectionStatus: 'connected' | 'disconnected' | 'connecting' = 
    isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected';

  // Handle WebSocket data updates
  useEffect(() => {
    if (wsMarketData.length > 0) {
      setMarketData(prev => prev.map(stock => {
        const update = wsMarketData.find(ws => ws.symbol === stock.symbol);
        if (update) {
          return {
            ...stock,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
            volume: update.volume || stock.volume,
            lastUpdated: new Date()
          };
        }
        return stock;
      }));
      setLastUpdate(new Date());
    }
  }, [wsMarketData]);

  // Handle portfolio updates from WebSocket
  useEffect(() => {
    if (wsPortfolioData) {
      setMetrics(prev => prev.map(metric => {
        if (metric.id === '1' && wsPortfolioData.totalValue) {
          const change = wsPortfolioData.totalValue - metric.value;
          return {
            ...metric,
            previousValue: metric.value,
            value: wsPortfolioData.totalValue,
            change: change,
            changePercent: (change / metric.value) * 100,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
          };
        }
        if (metric.id === '2' && wsPortfolioData.dayChange !== undefined) {
          return {
            ...metric,
            value: wsPortfolioData.dayChange,
            change: wsPortfolioData.dayChange - metric.value,
            changePercent: metric.value ? ((wsPortfolioData.dayChange - metric.value) / metric.value) * 100 : 0,
            trend: wsPortfolioData.dayChange > 0 ? 'up' : wsPortfolioData.dayChange < 0 ? 'down' : 'neutral'
          };
        }
        return metric;
      }));
    }
  }, [wsPortfolioData]);

  // Handle news updates from WebSocket
  useEffect(() => {
    if (wsNews.length > 0) {
      setNews(prev => {
        const newItems = wsNews.filter(wsItem => 
          !prev.some(existingItem => existingItem.headline === wsItem.headline)
        ).map(wsItem => ({
          id: Date.now().toString() + Math.random(),
          headline: wsItem.headline,
          summary: wsItem.headline,
          source: 'Live Feed',
          publishedAt: wsItem.timestamp || new Date(),
          sentiment: wsItem.sentiment || 'neutral',
          symbols: wsItem.symbols || [],
          category: 'market' as const,
          impact: wsItem.impact || 'medium'
        }));
        return [...newItems, ...prev].slice(0, 10); // Keep only latest 10
      });
    }
  }, [wsNews]);

  // Control WebSocket connection based on live mode
  useEffect(() => {
    if (isLiveMode && !isConnected && !isConnecting) {
      connect();
    } else if (!isLiveMode && isConnected) {
      disconnect();
    }
  }, [isLiveMode, isConnected, isConnecting, connect, disconnect]);

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'number') => {
    if (!showValues) return '•••••';
    
    switch (format) {
      case 'currency':
        return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredMetrics = useMemoizedCalculation(() => 
    metrics.filter(metric => selectedMetric === 'all' || metric.category === selectedMetric),
    [metrics, selectedMetric]
  );

  const { totalPortfolioValue, totalDayChange, totalDayChangePercent } = useMemoizedCalculation(() => {
    const total = portfolio.reduce((sum, pos) => sum + pos.totalValue, 0);
    const dayChange = portfolio.reduce((sum, pos) => sum + (pos.totalValue * pos.dayChangePercent / 100), 0);
    const dayChangePercent = (dayChange / total) * 100;
    
    return {
      totalPortfolioValue: total,
      totalDayChange: dayChange,
      totalDayChangePercent: dayChangePercent
    };
  }, [portfolio]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Real-Time Financial Dashboard
          </h3>
          <p className="text-gray-600">Live market data and portfolio performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>
          
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
            {isLiveMode ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            <span className="ml-2">{isLiveMode ? 'Live' : 'Paused'}</span>
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Download size={18} className="mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Market Data Live</span>
            </div>
            <div className="text-sm text-gray-600">
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-600">
              Refresh: Every {refreshInterval}s
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
            </select>
            <button
              onClick={() => setLastUpdate(new Date())}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {filteredMetrics.map((metric) => {
          const TrendIcon = getTrendIcon(metric.trend);
          return (
            <div key={metric.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <div className="flex items-center space-x-1">
                  {metric.isLive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                  <TrendIcon size={16} className={getTrendColor(metric.trend)} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xl font-bold text-gray-900">
                  {formatValue(metric.value, metric.format)}
                </div>
                <div className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                  {metric.change >= 0 ? '+' : ''}{formatValue(metric.change, metric.format)} 
                  ({metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Portfolio Performance</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Real-time</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Total Portfolio Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(totalPortfolioValue, 'currency')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${totalDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDayChange >= 0 ? '+' : ''}{formatValue(Math.abs(totalDayChange), 'currency')}
                </div>
                <div className={`text-sm ${totalDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({totalDayChangePercent >= 0 ? '+' : ''}{totalDayChangePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {portfolio.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium text-gray-900">{position.symbol}</div>
                      <div className="text-sm text-gray-600">{position.shares} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatValue(position.totalValue, 'currency')}
                    </div>
                    <div className={`text-sm ${position.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.dayChange >= 0 ? '+' : ''}{position.dayChangePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Movers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Movers</h4>
          <div className="space-y-3">
            {marketData
              .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
              .slice(0, 5)
              .map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{stock.symbol}</div>
                    <div className="text-sm text-gray-600">{formatValue(stock.price, 'currency')}</div>
                  </div>
                  <div className={`text-right ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="font-semibold">
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-sm">
                      {stock.change >= 0 ? '+' : ''}{formatValue(Math.abs(stock.change), 'currency')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Market Data Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Live Market Data</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Auto-refreshing</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">52W Range</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marketData.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {formatValue(stock.price, 'currency')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.change >= 0 ? '+' : ''}{formatValue(Math.abs(stock.change), 'currency')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                    stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                    {(stock.volume / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                    {formatValue(stock.low52Week, 'currency')} - {formatValue(stock.high52Week, 'currency')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Alerts */}
      {wsAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-amber-900 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Live Alerts
            </h4>
            <span className="text-sm text-amber-700">{wsAlerts.length} active</span>
          </div>
          <div className="space-y-2">
            {wsAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{alert.message}</span>
                  {alert.symbol && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                      {alert.symbol}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Feed */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Market News</h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Live updates</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="border-l-4 border-blue-400 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{item.headline}</h5>
                  <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>{getTimeAgo(item.publishedAt)}</span>
                    <span className={`px-2 py-1 rounded-full ${getSentimentColor(item.sentiment)}`}>
                      {item.sentiment}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {item.impact} impact
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex flex-wrap gap-1">
                  {item.symbols.map((symbol) => (
                    <span key={symbol} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize the component for performance
export default memo(RealTimeFinancialDashboard);