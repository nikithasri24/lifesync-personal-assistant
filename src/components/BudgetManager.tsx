import { useState } from 'react';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Brain
} from 'lucide-react';
import SmartBudgetingRecommendations from './SmartBudgetingRecommendations';

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
}

const MOCK_BUDGETS: Budget[] = [
  {
    id: '1',
    category: 'groceries',
    limit: 600,
    spent: 445.50,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    alertThreshold: 80
  },
  {
    id: '2',
    category: 'dining',
    limit: 200,
    spent: 185.75,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    alertThreshold: 75
  },
  {
    id: '3',
    category: 'transportation',
    limit: 300,
    spent: 125.20,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    alertThreshold: 85
  },
  {
    id: '4',
    category: 'entertainment',
    limit: 150,
    spent: 165.40,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    alertThreshold: 80
  }
];

const CATEGORY_INFO = {
  groceries: { name: 'Groceries', color: '#10B981', icon: '🛒' },
  dining: { name: 'Dining Out', color: '#F59E0B', icon: '🍽️' },
  transportation: { name: 'Transportation', color: '#3B82F6', icon: '🚗' },
  entertainment: { name: 'Entertainment', color: '#8B5CF6', icon: '🎬' },
  housing: { name: 'Housing', color: '#EF4444', icon: '🏠' },
  utilities: { name: 'Utilities', color: '#06B6D4', icon: '⚡' },
  healthcare: { name: 'Healthcare', color: '#EC4899', icon: '🏥' },
  shopping: { name: 'Shopping', color: '#84CC16', icon: '🛍️' }
};

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [activeTab, setActiveTab] = useState<'budgets' | 'smart'>('budgets');
  const [budgetForm, setBudgetForm] = useState({
    category: 'groceries',
    limit: '',
    period: 'monthly' as const,
    alertThreshold: '80'
  });

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.limit) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= budget.alertThreshold) return 'warning';
    return 'good';
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getTotalBudget = () => budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const getTotalSpent = () => budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const getOverBudgetCount = () => budgets.filter(budget => budget.spent > budget.limit).length;

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setBudgetForm({
      category: 'groceries',
      limit: '',
      period: 'monthly',
      alertThreshold: '80'
    });
    setShowCreateModal(true);
  };

  const handleSaveBudget = () => {
    if (!budgetForm.limit) return;

    const budgetData: Budget = {
      id: editingBudget?.id || Date.now().toString(),
      category: budgetForm.category,
      limit: parseFloat(budgetForm.limit),
      spent: editingBudget?.spent || 0,
      period: budgetForm.period,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      alertThreshold: parseInt(budgetForm.alertThreshold)
    };

    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === editingBudget.id ? budgetData : b));
    } else {
      setBudgets([...budgets, budgetData]);
    }

    setShowCreateModal(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = (budgetId: string) => {
    if (confirm('Delete this budget?')) {
      setBudgets(budgets.filter(b => b.id !== budgetId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Budget Manager</h3>
          <p className="text-gray-600">Track and manage your spending limits</p>
        </div>
        {activeTab === 'budgets' && (
          <button
            onClick={handleCreateBudget}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Budget
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'budgets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target size={16} />
            <span>Budget Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'smart'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Brain size={16} />
            <span>Smart Recommendations</span>
          </button>
        </nav>
      </div>

      {/* Budget Overview Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Budget</p>
              <p className="text-2xl font-bold text-blue-900">${getTotalBudget().toLocaleString()}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Spent</p>
              <p className="text-2xl font-bold text-green-900">${getTotalSpent().toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Remaining</p>
              <p className="text-2xl font-bold text-purple-900">${(getTotalBudget() - getTotalSpent()).toLocaleString()}</p>
            </div>
            <PieChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Over Budget</p>
              <p className="text-2xl font-bold text-red-900">{getOverBudgetCount()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Target className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No budgets yet</h4>
          <p className="text-gray-600 mb-6">Create your first budget to start tracking your spending</p>
          <button
            onClick={handleCreateBudget}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const categoryInfo = CATEGORY_INFO[budget.category as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.groceries;
            const percentage = (budget.spent / budget.limit) * 100;
            const status = getBudgetStatus(budget);
            const remaining = budget.limit - budget.spent;
            
            return (
              <div key={budget.id} className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${getBudgetStatusColor(status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{categoryInfo.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{categoryInfo.name}</h4>
                      <p className="text-sm text-gray-500">{budget.period} budget</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setBudgetForm({
                          category: budget.category,
                          limit: budget.limit.toString(),
                          period: budget.period,
                          alertThreshold: budget.alertThreshold.toString()
                        });
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      ${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold ${
                      status === 'exceeded' ? 'text-red-600' :
                      status === 'warning' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        status === 'exceeded' ? 'bg-red-500' :
                        status === 'warning' ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                    {percentage > 100 && (
                      <div 
                        className="h-3 bg-red-600 opacity-50"
                        style={{ width: `${percentage - 100}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Status and Remaining */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {status === 'exceeded' ? (
                      <AlertTriangle size={16} className="text-red-600" />
                    ) : status === 'warning' ? (
                      <AlertTriangle size={16} className="text-orange-600" />
                    ) : (
                      <CheckCircle size={16} className="text-green-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      status === 'exceeded' ? 'text-red-700' :
                      status === 'warning' ? 'text-orange-700' :
                      'text-green-700'
                    }`}>
                      {status === 'exceeded' ? `Over by $${Math.abs(remaining).toLocaleString()}` :
                       status === 'warning' ? 'Approaching limit' :
                       'On track'}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {remaining >= 0 ? `$${remaining.toLocaleString()} left` : `$${Math.abs(remaining).toLocaleString()} over`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Limit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.limit}
                    onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                    placeholder="500.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={budgetForm.period}
                    onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold ({budgetForm.alertThreshold}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={budgetForm.alertThreshold}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alertThreshold: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50%</span>
                  <span>95%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                disabled={!budgetForm.limit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Smart Recommendations Tab */}
      {activeTab === 'smart' && (
        <SmartBudgetingRecommendations />
      )}
    </div>
  );
}