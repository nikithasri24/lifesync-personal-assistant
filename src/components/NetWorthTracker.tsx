import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  DollarSign,
  Target,
  RefreshCw,
  Download,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Car,
  CreditCard,
  PiggyBank,
  Building,
  Briefcase,
  Eye,
  EyeOff
} from 'lucide-react';

interface NetWorthEntry {
  id: string;
  date: Date;
  assets: {
    cash: number;
    investments: number;
    realEstate: number;
    vehicles: number;
    other: number;
  };
  liabilities: {
    creditCards: number;
    loans: number;
    mortgages: number;
    other: number;
  };
  netWorth: number;
}

interface AssetCategory {
  id: string;
  name: string;
  value: number;
  type: 'asset' | 'liability';
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

const MOCK_NET_WORTH_HISTORY: NetWorthEntry[] = [
  {
    id: '1',
    date: new Date('2023-01-01'),
    assets: { cash: 15000, investments: 25000, realEstate: 0, vehicles: 18000, other: 2000 },
    liabilities: { creditCards: 8500, loans: 15000, mortgages: 0, other: 1000 },
    netWorth: 35500
  },
  {
    id: '2',
    date: new Date('2023-04-01'),
    assets: { cash: 18000, investments: 28500, realEstate: 0, vehicles: 17000, other: 2500 },
    liabilities: { creditCards: 7200, loans: 13500, mortgages: 0, other: 800 },
    netWorth: 44500
  },
  {
    id: '3',
    date: new Date('2023-07-01'),
    assets: { cash: 22000, investments: 32000, realEstate: 0, vehicles: 16000, other: 3000 },
    liabilities: { creditCards: 5800, loans: 12000, mortgages: 0, other: 500 },
    netWorth: 54700
  },
  {
    id: '4',
    date: new Date('2023-10-01'),
    assets: { cash: 25000, investments: 38000, realEstate: 0, vehicles: 15500, other: 3500 },
    liabilities: { creditCards: 4200, loans: 10500, mortgages: 0, other: 300 },
    netWorth: 67000
  },
  {
    id: '5',
    date: new Date('2024-01-01'),
    assets: { cash: 28000, investments: 45000, realEstate: 0, vehicles: 15000, other: 4000 },
    liabilities: { creditCards: 3500, loans: 9000, mortgages: 0, other: 200 },
    netWorth: 79300
  }
];

const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'cash', name: 'Cash & Savings', value: 28000, type: 'asset', category: 'liquid', icon: PiggyBank, color: '#10B981' },
  { id: 'investments', name: 'Investments', value: 45000, type: 'asset', category: 'investments', icon: TrendingUp, color: '#3B82F6' },
  { id: 'realEstate', name: 'Real Estate', value: 0, type: 'asset', category: 'property', icon: Home, color: '#8B5CF6' },
  { id: 'vehicles', name: 'Vehicles', value: 15000, type: 'asset', category: 'property', icon: Car, color: '#F59E0B' },
  { id: 'otherAssets', name: 'Other Assets', value: 4000, type: 'asset', category: 'other', icon: Briefcase, color: '#06B6D4' }
];

const LIABILITY_CATEGORIES: AssetCategory[] = [
  { id: 'creditCards', name: 'Credit Cards', value: 3500, type: 'liability', category: 'debt', icon: CreditCard, color: '#EF4444' },
  { id: 'loans', name: 'Personal Loans', value: 9000, type: 'liability', category: 'debt', icon: Building, color: '#EC4899' },
  { id: 'mortgages', name: 'Mortgages', value: 0, type: 'liability', category: 'debt', icon: Home, color: '#84CC16' },
  { id: 'otherLiabilities', name: 'Other Debt', value: 200, type: 'liability', category: 'debt', icon: Minus, color: '#6B7280' }
];

export default function NetWorthTracker() {
  const [netWorthHistory] = useState<NetWorthEntry[]>(MOCK_NET_WORTH_HISTORY);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'6M' | '1Y' | '2Y' | '5Y' | 'ALL'>('1Y');
  const [showValues, setShowValues] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'breakdown'>('chart');

  const currentEntry = netWorthHistory[netWorthHistory.length - 1];
  const previousEntry = netWorthHistory[netWorthHistory.length - 2];
  
  const totalAssets = Object.values(currentEntry.assets).reduce((sum, value) => sum + value, 0);
  const totalLiabilities = Object.values(currentEntry.liabilities).reduce((sum, value) => sum + value, 0);
  const currentNetWorth = totalAssets - totalLiabilities;
  
  const netWorthChange = currentNetWorth - (previousEntry ? previousEntry.netWorth : 0);
  const netWorthChangePercent = previousEntry ? ((netWorthChange / previousEntry.netWorth) * 100) : 0;
  
  const assetChange = totalAssets - (previousEntry ? Object.values(previousEntry.assets).reduce((sum, value) => sum + value, 0) : 0);
  const liabilityChange = totalLiabilities - (previousEntry ? Object.values(previousEntry.liabilities).reduce((sum, value) => sum + value, 0) : 0);

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getTimeframeDates = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (selectedTimeframe) {
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '2Y':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      case '5Y':
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case 'ALL':
        return netWorthHistory;
    }
    
    return netWorthHistory.filter(entry => entry.date >= startDate);
  };

  const filteredHistory = getTimeframeDates();
  const oldestEntry = filteredHistory[0];
  const totalGrowth = oldestEntry ? currentNetWorth - oldestEntry.netWorth : 0;
  const totalGrowthPercent = oldestEntry && oldestEntry.netWorth !== 0 ? 
    ((totalGrowth / Math.abs(oldestEntry.netWorth)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
            Net Worth Tracker
          </h3>
          <p className="text-gray-600">Track your wealth growth over time</p>
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
            Export
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            <RefreshCw size={18} className="mr-2" />
            Update Values
          </button>
        </div>
      </div>

      {/* Current Net Worth Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Net Worth */}
          <div className="lg:col-span-1">
            <div className="text-center lg:text-left">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Current Net Worth</h4>
              <div className={`text-4xl font-bold mb-2 ${currentNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatValue(Math.abs(currentNetWorth))}
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                {netWorthChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netWorthChange >= 0 ? '+' : ''}{formatValue(Math.abs(netWorthChange))} ({formatPercent(netWorthChangePercent)})
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">since last quarter</div>
            </div>
          </div>

          {/* Assets vs Liabilities */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-green-600 mr-1" />
                  <h5 className="font-semibold text-green-800">Total Assets</h5>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatValue(totalAssets)}
                </div>
                <div className={`text-sm ${assetChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {assetChange >= 0 ? '+' : ''}{formatValue(Math.abs(assetChange))} this quarter
                </div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Minus className="w-5 h-5 text-red-600 mr-1" />
                  <h5 className="font-semibold text-red-800">Total Liabilities</h5>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {formatValue(totalLiabilities)}
                </div>
                <div className={`text-sm ${liabilityChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {liabilityChange >= 0 ? '+' : ''}{formatValue(Math.abs(liabilityChange))} this quarter
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Timeframe */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h4 className="text-lg font-semibold text-gray-900">Net Worth Growth</h4>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-l-lg ${
                  viewMode === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('breakdown')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-r-lg ${
                  viewMode === 'breakdown' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Breakdown
              </button>
            </div>
          </div>
          
          <div className="flex border border-gray-300 rounded-lg">
            {(['6M', '1Y', '2Y', '5Y', 'ALL'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${timeframe === '6M' ? 'rounded-l-lg' : timeframe === 'ALL' ? 'rounded-r-lg' : ''}`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Growth Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Growth Over {selectedTimeframe}</h5>
              <p className="text-sm text-gray-600">Since {oldestEntry?.date.toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGrowth >= 0 ? '+' : ''}{formatValue(Math.abs(totalGrowth))}
              </div>
              <div className={`text-sm ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(totalGrowthPercent)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        /* Chart View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Interactive net worth chart coming soon</p>
              <p className="text-sm text-gray-500 mt-1">Showing growth over {selectedTimeframe}</p>
            </div>
          </div>
          
          {/* Chart Data Points */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {filteredHistory.slice(-5).map((entry, index) => (
              <div key={entry.id} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  {entry.date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                </div>
                <div className={`font-bold ${entry.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatValue(Math.abs(entry.netWorth))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Breakdown View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Breakdown */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 text-green-600 mr-2" />
              Assets Breakdown
            </h4>
            
            <div className="space-y-4">
              {ASSET_CATEGORIES.map((asset) => {
                const Icon = asset.icon;
                const percentage = totalAssets > 0 ? (asset.value / totalAssets) * 100 : 0;
                
                return (
                  <div key={asset.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${asset.color}20` }}
                      >
                        <Icon size={18} style={{ color: asset.color }} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}% of assets</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatValue(asset.value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Assets</span>
                <span className="text-xl font-bold text-green-600">{formatValue(totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities Breakdown */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Minus className="w-5 h-5 text-red-600 mr-2" />
              Liabilities Breakdown
            </h4>
            
            <div className="space-y-4">
              {LIABILITY_CATEGORIES.map((liability) => {
                const Icon = liability.icon;
                const percentage = totalLiabilities > 0 ? (liability.value / totalLiabilities) * 100 : 0;
                
                return (
                  <div key={liability.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${liability.color}20` }}
                      >
                        <Icon size={18} style={{ color: liability.color }} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{liability.name}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}% of liabilities</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatValue(liability.value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Liabilities</span>
                <span className="text-xl font-bold text-red-600">{formatValue(totalLiabilities)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Historical Net Worth</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Liabilities</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Worth</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.reverse().map((entry, index) => {
                const prevEntry = filteredHistory[index + 1];
                const change = prevEntry ? entry.netWorth - prevEntry.netWorth : 0;
                const changePercent = prevEntry && prevEntry.netWorth !== 0 ? 
                  ((change / Math.abs(prevEntry.netWorth)) * 100) : 0;
                const entryAssets = Object.values(entry.assets).reduce((sum, value) => sum + value, 0);
                const entryLiabilities = Object.values(entry.liabilities).reduce((sum, value) => sum + value, 0);
                
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {formatValue(entryAssets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {formatValue(entryLiabilities)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {formatValue(Math.abs(entry.netWorth))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {prevEntry ? (
                        <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change >= 0 ? '+' : ''}{formatValue(Math.abs(change))}
                          <div className="text-xs">
                            ({formatPercent(changePercent)})
                          </div>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}