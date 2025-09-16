import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calculator,
  Play,
  Pause,
  RefreshCw,
  Download,
  Settings,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';

interface CashFlowItem {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  startDate: Date;
  endDate?: Date;
  category: string;
  isActive: boolean;
  variability: number; // 0-100% how much this can vary
}

interface CashFlowProjection {
  date: Date;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeBalance: number;
  breakdown: {
    recurringIncome: number;
    recurringExpenses: number;
    oneTimeItems: number;
  };
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  modifications: {
    itemId: string;
    newAmount: number;
    reason: string;
  }[];
  isActive: boolean;
}

const MOCK_CASH_FLOW_ITEMS: CashFlowItem[] = [
  {
    id: '1',
    name: 'Salary',
    type: 'income',
    amount: 5500,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    category: 'salary',
    isActive: true,
    variability: 5
  },
  {
    id: '2',
    name: 'Freelance Work',
    type: 'income',
    amount: 800,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    category: 'freelance',
    isActive: true,
    variability: 30
  },
  {
    id: '3',
    name: 'Rent',
    type: 'expense',
    amount: 1800,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    category: 'housing',
    isActive: true,
    variability: 0
  },
  {
    id: '4',
    name: 'Groceries',
    type: 'expense',
    amount: 600,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    category: 'groceries',
    isActive: true,
    variability: 20
  },
  {
    id: '5',
    name: 'Car Payment',
    type: 'expense',
    amount: 450,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2027-01-01'),
    category: 'transportation',
    isActive: true,
    variability: 0
  },
  {
    id: '6',
    name: 'Annual Bonus',
    type: 'income',
    amount: 8000,
    frequency: 'yearly',
    startDate: new Date('2024-12-01'),
    category: 'bonus',
    isActive: true,
    variability: 25
  },
  {
    id: '7',
    name: 'Vacation',
    type: 'expense',
    amount: 3000,
    frequency: 'yearly',
    startDate: new Date('2024-07-01'),
    category: 'entertainment',
    isActive: true,
    variability: 40
  }
];

const SCENARIOS: Scenario[] = [
  {
    id: '1',
    name: 'Job Loss',
    description: 'What if I lose my primary income?',
    modifications: [
      { itemId: '1', newAmount: 0, reason: 'Salary eliminated' }
    ],
    isActive: false
  },
  {
    id: '2',
    name: 'Promotion',
    description: '20% salary increase scenario',
    modifications: [
      { itemId: '1', newAmount: 6600, reason: '20% salary increase' }
    ],
    isActive: false
  },
  {
    id: '3',
    name: 'Economic Downturn',
    description: 'Reduced income and increased expenses',
    modifications: [
      { itemId: '1', newAmount: 4400, reason: '20% salary cut' },
      { itemId: '2', newAmount: 400, reason: '50% freelance reduction' },
      { itemId: '4', newAmount: 750, reason: '25% increase in groceries' }
    ],
    isActive: false
  }
];

export default function CashFlowForecasting() {
  const [cashFlowItems, setCashFlowItems] = useState<CashFlowItem[]>(MOCK_CASH_FLOW_ITEMS);
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [forecastMonths, setForecastMonths] = useState<number>(12);
  const [startingBalance, setStartingBalance] = useState<number>(15000);
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [showProjections, setShowProjections] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState<number>(5000);

  const getFrequencyMultiplier = (frequency: string, months: number) => {
    switch (frequency) {
      case 'weekly': return months * 4.33;
      case 'bi-weekly': return months * 2.17;
      case 'monthly': return months;
      case 'quarterly': return months / 3;
      case 'yearly': return months / 12;
      case 'one-time': return 1;
      default: return 0;
    }
  };

  const calculateProjections = () => {
    const projections: CashFlowProjection[] = [];
    let cumulativeBalance = startingBalance;
    
    // Apply scenario modifications if selected
    let modifiedItems = [...cashFlowItems];
    if (selectedScenario) {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      if (scenario) {
        scenario.modifications.forEach(mod => {
          const itemIndex = modifiedItems.findIndex(item => item.id === mod.itemId);
          if (itemIndex !== -1) {
            modifiedItems[itemIndex] = {
              ...modifiedItems[itemIndex],
              amount: mod.newAmount
            };
          }
        });
      }
    }

    for (let month = 0; month < forecastMonths; month++) {
      const projectionDate = new Date();
      projectionDate.setMonth(projectionDate.getMonth() + month);
      
      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      let recurringIncome = 0;
      let recurringExpenses = 0;
      let oneTimeItems = 0;

      modifiedItems.forEach(item => {
        if (!item.isActive) return;
        
        // Check if item is active for this month
        if (item.endDate && projectionDate > item.endDate) return;
        if (projectionDate < item.startDate) return;

        let monthlyAmount = 0;
        const variabilityFactor = 1 + (Math.random() - 0.5) * (item.variability / 100);
        
        if (item.frequency === 'monthly') {
          monthlyAmount = item.amount * variabilityFactor;
        } else if (item.frequency === 'yearly') {
          // Distribute yearly amounts
          if (projectionDate.getMonth() === item.startDate.getMonth()) {
            monthlyAmount = item.amount * variabilityFactor;
          }
        } else if (item.frequency === 'quarterly') {
          // Every 3 months
          if ((projectionDate.getMonth() - item.startDate.getMonth()) % 3 === 0) {
            monthlyAmount = item.amount * variabilityFactor;
          }
        } else if (item.frequency === 'weekly') {
          monthlyAmount = (item.amount * 4.33) * variabilityFactor;
        } else if (item.frequency === 'bi-weekly') {
          monthlyAmount = (item.amount * 2.17) * variabilityFactor;
        }

        if (item.type === 'income') {
          monthlyIncome += monthlyAmount;
          if (item.frequency === 'monthly' || item.frequency === 'weekly' || item.frequency === 'bi-weekly') {
            recurringIncome += monthlyAmount;
          } else {
            oneTimeItems += monthlyAmount;
          }
        } else {
          monthlyExpenses += monthlyAmount;
          if (item.frequency === 'monthly' || item.frequency === 'weekly' || item.frequency === 'bi-weekly') {
            recurringExpenses += monthlyAmount;
          } else {
            oneTimeItems -= monthlyAmount;
          }
        }
      });

      const netFlow = monthlyIncome - monthlyExpenses;
      cumulativeBalance += netFlow;

      projections.push({
        date: projectionDate,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        netFlow,
        cumulativeBalance,
        breakdown: {
          recurringIncome,
          recurringExpenses,
          oneTimeItems
        }
      });
    }

    setProjections(projections);
  };

  useEffect(() => {
    calculateProjections();
  }, [cashFlowItems, selectedScenario, forecastMonths, startingBalance]);

  const formatValue = (value: number) => {
    if (!showProjections) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const getLowestBalance = () => {
    return Math.min(...projections.map(p => p.cumulativeBalance));
  };

  const getHighestBalance = () => {
    return Math.max(...projections.map(p => p.cumulativeBalance));
  };

  const getAverageMonthlyFlow = () => {
    if (projections.length === 0) return 0;
    return projections.reduce((sum, p) => sum + p.netFlow, 0) / projections.length;
  };

  const getCashoutDate = () => {
    const cashoutProjection = projections.find(p => p.cumulativeBalance <= 0);
    return cashoutProjection?.date;
  };

  const getAlertMonths = () => {
    return projections.filter(p => p.cumulativeBalance <= alertThreshold).length;
  };

  const totalProjectedIncome = projections.reduce((sum, p) => sum + p.income, 0);
  const totalProjectedExpenses = projections.reduce((sum, p) => sum + p.expenses, 0);
  const endingBalance = projections[projections.length - 1]?.cumulativeBalance || startingBalance;
  const lowestBalance = getLowestBalance();
  const cashoutDate = getCashoutDate();
  const averageFlow = getAverageMonthlyFlow();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-blue-600" />
            Cash Flow Forecasting
          </h3>
          <p className="text-gray-600">Predict your financial future and plan ahead</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showProjections ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showProjections ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={calculateProjections}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            Recalculate
          </button>
        </div>
      </div>

      {/* Forecast Settings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Forecast Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Balance
            </label>
            <input
              type="number"
              value={startingBalance}
              onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Period (Months)
            </label>
            <select
              value={forecastMonths}
              onChange={(e) => setForecastMonths(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
              <option value={36}>36 Months</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Threshold
            </label>
            <input
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario
            </label>
            <select
              value={selectedScenario || ''}
              onChange={(e) => setSelectedScenario(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Base Case</option>
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Ending Balance</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(endingBalance)}</p>
              <p className="text-xs text-green-700">in {forecastMonths} months</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Avg Monthly Flow</p>
              <p className={`text-2xl font-bold ${averageFlow >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                {averageFlow >= 0 ? '+' : ''}{formatValue(averageFlow)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Lowest Balance</p>
              <p className={`text-2xl font-bold ${lowestBalance >= 0 ? 'text-orange-900' : 'text-red-600'}`}>
                {formatValue(Math.abs(lowestBalance))}
              </p>
              <p className="text-xs text-orange-700">minimum projected</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 border ${
          cashoutDate ? 'from-red-50 to-red-100 border-red-200' : 'from-purple-50 to-purple-100 border-purple-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${cashoutDate ? 'text-red-800' : 'text-purple-800'}`}>
                {cashoutDate ? 'Cashout Risk' : 'Financial Runway'}
              </p>
              <p className={`text-2xl font-bold ${cashoutDate ? 'text-red-900' : 'text-purple-900'}`}>
                {cashoutDate ? cashoutDate.toLocaleDateString() : '∞'}
              </p>
              <p className={`text-xs ${cashoutDate ? 'text-red-700' : 'text-purple-700'}`}>
                {cashoutDate ? 'projected cashout' : 'sustainable'}
              </p>
            </div>
            {cashoutDate ? (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-purple-600" />
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(cashoutDate || getAlertMonths() > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-2">Cash Flow Alerts</h4>
              <div className="space-y-2">
                {cashoutDate && (
                  <div className="text-sm text-red-700">
                    ⚠️ <strong>Cashout Risk:</strong> Projected to run out of money on {cashoutDate.toLocaleDateString()}
                  </div>
                )}
                {getAlertMonths() > 0 && (
                  <div className="text-sm text-orange-700">
                    📊 <strong>Low Balance Alert:</strong> {getAlertMonths()} months projected below ${alertThreshold.toLocaleString()} threshold
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  💡 <strong>Suggestions:</strong> Consider reducing expenses, increasing income, or building emergency reserves
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Analysis */}
      {selectedScenario && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">Active Scenario Analysis</h4>
              {(() => {
                const scenario = scenarios.find(s => s.id === selectedScenario);
                return scenario ? (
                  <div>
                    <p className="text-blue-700 mb-2"><strong>{scenario.name}:</strong> {scenario.description}</p>
                    <div className="space-y-1">
                      {scenario.modifications.map((mod, index) => {
                        const item = cashFlowItems.find(i => i.id === mod.itemId);
                        return (
                          <div key={index} className="text-sm text-blue-600">
                            • {item?.name}: {mod.reason} (${mod.newAmount.toLocaleString()})
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Projection</h4>
        
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-6">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Interactive cash flow chart coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Showing {forecastMonths} month projection</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{formatValue(totalProjectedIncome)}</div>
            <div className="text-sm text-gray-600">Total Projected Income</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{formatValue(totalProjectedExpenses)}</div>
            <div className="text-sm text-gray-600">Total Projected Expenses</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className={`text-lg font-bold ${totalProjectedIncome - totalProjectedExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatValue(Math.abs(totalProjectedIncome - totalProjectedExpenses))}
            </div>
            <div className="text-sm text-gray-600">Net Cash Flow</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Monthly Projections</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Flow</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projections.map((projection, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${
                  projection.cumulativeBalance <= alertThreshold ? 'bg-red-50' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {projection.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                    {formatValue(projection.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                    {formatValue(projection.expenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {projection.netFlow >= 0 ? '+' : ''}{formatValue(Math.abs(projection.netFlow))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={`${
                      projection.cumulativeBalance <= 0 ? 'text-red-600' :
                      projection.cumulativeBalance <= alertThreshold ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {formatValue(Math.abs(projection.cumulativeBalance))}
                      {projection.cumulativeBalance <= alertThreshold && (
                        <AlertTriangle className="w-4 h-4 inline ml-1 text-orange-500" />
                      )}
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