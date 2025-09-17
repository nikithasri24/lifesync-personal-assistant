import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Activity,
  Target,
  Calendar,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Settings,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  BarChart,
  DonutChart,
  ProgressRing,
  MetricCard,
  DashboardGrid,
  ChartContainer
} from './DataVisualization';

// Mock data for demonstration
const PORTFOLIO_PERFORMANCE_DATA = [
  { x: 'Jan', y: 45000 },
  { x: 'Feb', y: 47000 },
  { x: 'Mar', y: 44000 },
  { x: 'Apr', y: 48000 },
  { x: 'May', y: 52000 },
  { x: 'Jun', y: 49000 },
  { x: 'Jul', y: 53000 },
  { x: 'Aug', y: 57000 },
  { x: 'Sep', y: 55000 },
  { x: 'Oct', y: 60000 },
  { x: 'Nov', y: 58000 },
  { x: 'Dec', y: 62000 }
];

const EXPENSE_CATEGORIES_DATA = [
  { label: 'Housing', value: 1500, color: '#3B82F6' },
  { label: 'Food', value: 800, color: '#10B981' },
  { label: 'Transportation', value: 600, color: '#F59E0B' },
  { label: 'Healthcare', value: 400, color: '#EF4444' },
  { label: 'Entertainment', value: 300, color: '#8B5CF6' },
  { label: 'Shopping', value: 250, color: '#EC4899' },
  { label: 'Other', value: 200, color: '#6B7280' }
];

const INCOME_SOURCES_DATA = [
  { label: 'Salary', value: 5500, color: '#10B981' },
  { label: 'Freelance', value: 1200, color: '#3B82F6' },
  { label: 'Investments', value: 800, color: '#8B5CF6' },
  { label: 'Side Business', value: 600, color: '#F59E0B' }
];

const MONTHLY_CASH_FLOW_DATA = [
  { label: 'Jan', value: 2500 },
  { label: 'Feb', value: 3200 },
  { label: 'Mar', value: 2800 },
  { label: 'Apr', value: 3500 },
  { label: 'May', value: 4100 },
  { label: 'Jun', value: 3800 },
  { label: 'Jul', value: 4200 },
  { label: 'Aug', value: 3900 },
  { label: 'Sep', value: 4500 },
  { label: 'Oct', value: 4800 },
  { label: 'Nov', value: 4200 },
  { label: 'Dec', value: 5100 }
];

const ASSET_ALLOCATION_DATA = [
  { label: 'Stocks', value: 35000, color: '#3B82F6' },
  { label: 'Bonds', value: 15000, color: '#10B981' },
  { label: 'Real Estate', value: 25000, color: '#F59E0B' },
  { label: 'Cash', value: 8000, color: '#6B7280' },
  { label: 'Crypto', value: 5000, color: '#8B5CF6' }
];

const SAVINGS_GOALS_DATA = [
  { label: 'Emergency Fund', current: 8500, target: 10000, color: '#10B981' },
  { label: 'Vacation', current: 3200, target: 5000, color: '#3B82F6' },
  { label: 'New Car', current: 12000, target: 25000, color: '#F59E0B' },
  { label: 'Home Down Payment', current: 45000, target: 80000, color: '#8B5CF6' }
];

interface AdvancedFinancialChartsProps {
  timeframe?: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  animated?: boolean;
}

export default function AdvancedFinancialCharts({ 
  timeframe = '1Y', 
  animated = true 
}: AdvancedFinancialChartsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate data refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRefreshCount(prev => prev + 1);
      setIsLoading(false);
    }, 1000);
  };

  // Calculate summary metrics
  const totalPortfolioValue = ASSET_ALLOCATION_DATA.reduce((sum, item) => sum + item.value, 0);
  const monthlyIncome = INCOME_SOURCES_DATA.reduce((sum, item) => sum + item.value, 0);
  const monthlyExpenses = EXPENSE_CATEGORIES_DATA.reduce((sum, item) => sum + item.value, 0);
  const netWorth = totalPortfolioValue + 15000; // Add checking/savings
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Financial Analytics Dashboard
          </h3>
          <p className="text-gray-600">Advanced visualization of your financial data</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeframe === period
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <DashboardGrid>
        <MetricCard
          title="Net Worth"
          value={`$${netWorth.toLocaleString()}`}
          change={8.5}
          changeLabel="vs last month"
          icon={TrendingUp}
          color="green"
          animated={animated}
        />
        
        <MetricCard
          title="Monthly Income"
          value={`$${monthlyIncome.toLocaleString()}`}
          change={3.2}
          changeLabel="vs last month"
          icon={DollarSign}
          color="blue"
          animated={animated}
        />
        
        <MetricCard
          title="Monthly Expenses"
          value={`$${monthlyExpenses.toLocaleString()}`}
          change={-1.8}
          changeLabel="vs last month"
          icon={CreditCard}
          color="red"
          animated={animated}
        />
        
        <MetricCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          change={2.1}
          changeLabel="vs target"
          icon={Target}
          color="purple"
          animated={animated}
        />
      </DashboardGrid>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance */}
        <ChartContainer
          title="Portfolio Performance"
          subtitle="12-month trend"
          actions={
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Live</span>
            </div>
          }
        >
          <LineChart
            data={PORTFOLIO_PERFORMANCE_DATA}
            height={250}
            color="#10B981"
            animated={animated}
          />
        </ChartContainer>

        {/* Monthly Cash Flow */}
        <ChartContainer
          title="Monthly Cash Flow"
          subtitle="Net income after expenses"
        >
          <BarChart
            data={MONTHLY_CASH_FLOW_DATA.map(item => ({
              ...item,
              color: item.value > 4000 ? '#10B981' : item.value > 3000 ? '#F59E0B' : '#EF4444'
            }))}
            height={250}
            showValues={true}
            animated={animated}
          />
        </ChartContainer>

        {/* Expense Categories */}
        <ChartContainer
          title="Expense Breakdown"
          subtitle="Monthly spending by category"
        >
          <DonutChart
            data={EXPENSE_CATEGORIES_DATA}
            size={250}
            thickness={30}
            showLegend={true}
            animated={animated}
          />
        </ChartContainer>

        {/* Asset Allocation */}
        <ChartContainer
          title="Asset Allocation"
          subtitle="Portfolio diversification"
        >
          <DonutChart
            data={ASSET_ALLOCATION_DATA}
            size={250}
            thickness={30}
            showLegend={true}
            animated={animated}
          />
        </ChartContainer>
      </div>

      {/* Savings Goals Progress */}
      <ChartContainer
        title="Savings Goals Progress"
        subtitle="Track your financial milestones"
        className="col-span-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAVINGS_GOALS_DATA.map((goal, index) => (
            <div key={index} className="text-center">
              <ProgressRing
                value={goal.current}
                max={goal.target}
                size={120}
                thickness={10}
                color={goal.color}
                animated={animated}
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold text-gray-900 mb-1">{goal.label}</h4>
              <p className="text-sm text-gray-600">
                ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ${(goal.target - goal.current).toLocaleString()} remaining
              </p>
            </div>
          ))}
        </div>
      </ChartContainer>

      {/* Income vs Expenses Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Income Sources"
          subtitle="Monthly income breakdown"
        >
          <BarChart
            data={INCOME_SOURCES_DATA.map(item => ({
              label: item.label,
              value: item.value,
              color: item.color
            }))}
            height={200}
            horizontal={true}
            showValues={true}
            animated={animated}
          />
        </ChartContainer>

        <ChartContainer
          title="Top Expense Categories"
          subtitle="Highest spending areas"
        >
          <BarChart
            data={EXPENSE_CATEGORIES_DATA
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map(item => ({
                label: item.label,
                value: item.value,
                color: item.color
              }))}
            height={200}
            horizontal={true}
            showValues={true}
            animated={animated}
          />
        </ChartContainer>
      </div>

      {/* Financial Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartContainer
          title="Emergency Fund Health"
          subtitle="Months of expenses covered"
        >
          <div className="text-center">
            <ProgressRing
              value={6.2}
              max={12}
              size={150}
              thickness={12}
              color="#10B981"
              animated={animated}
              className="mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-gray-900">6.2 months</p>
            <p className="text-sm text-gray-600">Target: 6-12 months</p>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Debt-to-Income Ratio"
          subtitle="Healthy below 36%"
        >
          <div className="text-center">
            <ProgressRing
              value={28}
              max={100}
              size={150}
              thickness={12}
              color="#F59E0B"
              animated={animated}
              className="mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-gray-900">28%</p>
            <p className="text-sm text-gray-600">Good range</p>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Investment Diversity"
          subtitle="Portfolio balance score"
        >
          <div className="text-center">
            <ProgressRing
              value={85}
              max={100}
              size={150}
              thickness={12}
              color="#8B5CF6"
              animated={animated}
              className="mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-gray-900">85/100</p>
            <p className="text-sm text-gray-600">Well diversified</p>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}