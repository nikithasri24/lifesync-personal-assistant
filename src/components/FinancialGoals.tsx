import { useState } from 'react';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  PiggyBank,
  CreditCard,
  Home,
  GraduationCap,
  Plane,
  Car,
  Heart,
  Gift,
  Award,
  Play,
  Pause,
  X
} from 'lucide-react';
import type { FinancialGoal, GoalStatus } from '../types/finance';

const GOAL_TYPES = [
  { value: 'savings', label: 'Emergency Fund', icon: PiggyBank, color: '#10B981' },
  { value: 'debt_payoff', label: 'Debt Payoff', icon: CreditCard, color: '#EF4444' },
  { value: 'investment', label: 'Investment Goal', icon: TrendingUp, color: '#3B82F6' },
  { value: 'other', label: 'Other Goal', icon: Target, color: '#8B5CF6' }
];

const GOAL_TEMPLATES = [
  { name: 'Emergency Fund', type: 'savings', targetAmount: 10000, description: '3-6 months of expenses' },
  { name: 'House Down Payment', type: 'savings', targetAmount: 50000, description: '20% down payment' },
  { name: 'Credit Card Debt', type: 'debt_payoff', targetAmount: 5000, description: 'Pay off high-interest debt' },
  { name: 'Retirement Fund', type: 'investment', targetAmount: 100000, description: 'Long-term retirement savings' },
  { name: 'Vacation Fund', type: 'other', targetAmount: 3000, description: 'Annual vacation budget' },
  { name: 'New Car', type: 'savings', targetAmount: 25000, description: 'Reliable transportation' }
];

const MOCK_GOALS: FinancialGoal[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    description: '6 months of living expenses',
    type: 'savings',
    targetAmount: 15000,
    currentAmount: 8750,
    targetDate: new Date('2024-12-31'),
    status: 'active',
    autoContribute: {
      enabled: true,
      amount: 500,
      frequency: 'monthly'
    },
    milestones: [
      { id: '1', amount: 5000, description: 'First milestone', achievedDate: new Date('2024-01-15') },
      { id: '2', amount: 10000, description: 'Second milestone' }
    ],
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'House Down Payment',
    description: '20% down payment for first home',
    type: 'savings',
    targetAmount: 60000,
    currentAmount: 24500,
    targetDate: new Date('2025-06-01'),
    status: 'active',
    autoContribute: {
      enabled: true,
      amount: 1200,
      frequency: 'monthly'
    },
    milestones: [
      { id: '1', amount: 15000, description: 'Quarter way there', achievedDate: new Date('2023-12-01') },
      { id: '2', amount: 30000, description: 'Halfway point' },
      { id: '3', amount: 45000, description: 'Three quarters' }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Credit Card Debt',
    description: 'Pay off remaining credit card balance',
    type: 'debt_payoff',
    targetAmount: 4200,
    currentAmount: 2800,
    targetDate: new Date('2024-08-01'),
    status: 'active',
    autoContribute: {
      enabled: true,
      amount: 400,
      frequency: 'monthly'
    },
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date()
  }
];

export default function FinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>(MOCK_GOALS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    name: '',
    description: '',
    type: 'savings' as FinancialGoal['type'],
    targetAmount: '',
    targetDate: '',
    autoContribute: {
      enabled: false,
      amount: '',
      frequency: 'monthly' as const
    }
  });

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[0];
  };

  const getGoalProgress = (goal: FinancialGoal) => {
    if (goal.type === 'debt_payoff') {
      return (goal.currentAmount / goal.targetAmount) * 100;
    }
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getGoalStatusColor = (goal: FinancialGoal) => {
    const progress = getGoalProgress(goal);
    const timeRemaining = new Date(goal.targetDate).getTime() - new Date().getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (daysRemaining < 30 && progress < 80) return 'text-red-600 bg-red-50 border-red-200';
    if (progress >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (progress >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTimeToGoal = (goal: FinancialGoal) => {
    const timeRemaining = new Date(goal.targetDate).getTime() - new Date().getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining < 30) return `${daysRemaining} days`;
    if (daysRemaining < 365) return `${Math.ceil(daysRemaining / 30)} months`;
    return `${Math.ceil(daysRemaining / 365)} years`;
  };

  const calculateMonthlyTarget = (goal: FinancialGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const timeRemaining = new Date(goal.targetDate).getTime() - new Date().getTime();
    const monthsRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24 * 30));
    return monthsRemaining > 0 ? remaining / monthsRemaining : 0;
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      name: '',
      description: '',
      type: 'savings',
      targetAmount: '',
      targetDate: '',
      autoContribute: {
        enabled: false,
        amount: '',
        frequency: 'monthly'
      }
    });
    setShowCreateModal(true);
  };

  const handleTemplateSelect = (template: any) => {
    setGoalForm({
      name: template.name,
      description: template.description,
      type: template.type,
      targetAmount: template.targetAmount.toString(),
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      autoContribute: {
        enabled: false,
        amount: '',
        frequency: 'monthly'
      }
    });
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const handleSaveGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.targetDate) return;

    const goalData: FinancialGoal = {
      id: editingGoal?.id || Date.now().toString(),
      name: goalForm.name,
      description: goalForm.description,
      type: goalForm.type,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: editingGoal?.currentAmount || 0,
      targetDate: new Date(goalForm.targetDate),
      status: 'active',
      autoContribute: goalForm.autoContribute.enabled ? {
        enabled: true,
        amount: parseFloat(goalForm.autoContribute.amount) || 0,
        frequency: goalForm.autoContribute.frequency
      } : undefined,
      milestones: editingGoal?.milestones || [],
      createdAt: editingGoal?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? goalData : g));
    } else {
      setGoals([...goals, goalData]);
    }

    setShowCreateModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Delete this goal?')) {
      setGoals(goals.filter(g => g.id !== goalId));
    }
  };

  const toggleGoalStatus = (goalId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          status: goal.status === 'active' ? 'paused' : 'active',
          updatedAt: new Date()
        };
      }
      return goal;
    }));
  };

  const addContribution = (goalId: string, amount: number) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount),
          updatedAt: new Date()
        };
      }
      return goal;
    }));
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => getGoalProgress(g) >= 100);
  const totalGoalValue = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="w-8 h-8 mr-3 text-purple-600" />
            Financial Goals
          </h3>
          <p className="text-gray-600">Set and track your financial objectives</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Award size={16} className="mr-2" />
            Templates
          </button>
          <button
            onClick={handleCreateGoal}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Active Goals</p>
              <p className="text-2xl font-bold text-purple-900">{activeGoals.length}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Completed</p>
              <p className="text-2xl font-bold text-green-900">{completedGoals.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Saved</p>
              <p className="text-2xl font-bold text-blue-900">${totalProgress.toLocaleString()}</p>
            </div>
            <PiggyBank className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Target Value</p>
              <p className="text-2xl font-bold text-orange-900">${totalGoalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Target className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No goals yet</h4>
          <p className="text-gray-600 mb-6">Set your first financial goal to start building your future</p>
          <button
            onClick={handleCreateGoal}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const typeInfo = getGoalTypeInfo(goal.type);
            const Icon = typeInfo.icon;
            const progress = getGoalProgress(goal);
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthlyTarget = calculateMonthlyTarget(goal);
            const timeToGoal = getTimeToGoal(goal);
            const statusColor = getGoalStatusColor(goal);
            
            return (
              <div key={goal.id} className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${statusColor}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      <Icon size={24} style={{ color: typeInfo.color }} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{goal.name}</h4>
                      <p className="text-gray-600 mb-2">{goal.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          Target: {goal.targetDate.toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{timeToGoal} remaining</span>
                        {goal.autoContribute?.enabled && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              Auto: ${goal.autoContribute.amount}/{goal.autoContribute.frequency}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleGoalStatus(goal.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        goal.status === 'active' 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={goal.status === 'active' ? 'Pause goal' : 'Resume goal'}
                    >
                      {goal.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setGoalForm({
                          name: goal.name,
                          description: goal.description || '',
                          type: goal.type,
                          targetAmount: goal.targetAmount.toString(),
                          targetDate: goal.targetDate.toISOString().split('T')[0],
                          autoContribute: {
                            enabled: !!goal.autoContribute?.enabled,
                            amount: goal.autoContribute?.amount.toString() || '',
                            frequency: goal.autoContribute?.frequency || 'monthly'
                          }
                        });
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900">
                      ${goal.currentAmount.toLocaleString()}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-700">
                        ${goal.targetAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">target</div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-4 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: typeInfo.color
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium" style={{ color: typeInfo.color }}>
                        {progress.toFixed(1)}% complete
                      </span>
                      <span className="text-sm text-gray-600">
                        ${remaining.toLocaleString()} remaining
                      </span>
                    </div>
                  </div>

                  {monthlyTarget > 0 && goal.status === 'active' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">Monthly Target</h5>
                          <p className="text-sm text-gray-600">To reach your goal on time</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold" style={{ color: typeInfo.color }}>
                            ${monthlyTarget.toLocaleString()}
                          </div>
                          <button
                            onClick={() => {
                              const amount = prompt('Enter contribution amount:', monthlyTarget.toString());
                              if (amount && !isNaN(parseFloat(amount))) {
                                addContribution(goal.id, parseFloat(amount));
                              }
                            }}
                            className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
                          >
                            Add Contribution
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Milestones</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {goal.milestones.map((milestone) => {
                          const isAchieved = goal.currentAmount >= milestone.amount;
                          return (
                            <div key={milestone.id} className={`flex items-center space-x-2 p-2 rounded-lg ${
                              isAchieved ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                            }`}>
                              {isAchieved ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className="text-sm font-medium">
                                ${milestone.amount.toLocaleString()} - {milestone.description}
                              </span>
                              {milestone.achievedDate && (
                                <span className="text-xs text-gray-500 ml-auto">
                                  {milestone.achievedDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Goal Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_TEMPLATES.map((template, index) => {
                  const typeInfo = getGoalTypeInfo(template.type);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="p-2 rounded-lg group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${typeInfo.color}20` }}
                        >
                          <Icon size={20} style={{ color: typeInfo.color }} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <p className="text-lg font-bold" style={{ color: typeInfo.color }}>
                            ${template.targetAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  placeholder="Emergency Fund"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="6 months of living expenses"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={goalForm.type}
                    onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {GOAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Automatic Contributions
                  </label>
                  <input
                    type="checkbox"
                    checked={goalForm.autoContribute.enabled}
                    onChange={(e) => setGoalForm({
                      ...goalForm,
                      autoContribute: { ...goalForm.autoContribute, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 focus:ring-purple-500"
                  />
                </div>

                {goalForm.autoContribute.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={goalForm.autoContribute.amount}
                        onChange={(e) => setGoalForm({
                          ...goalForm,
                          autoContribute: { ...goalForm.autoContribute, amount: e.target.value }
                        })}
                        placeholder="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                      <select
                        value={goalForm.autoContribute.frequency}
                        onChange={(e) => setGoalForm({
                          ...goalForm,
                          autoContribute: { ...goalForm.autoContribute, frequency: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                )}
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
                onClick={handleSaveGoal}
                disabled={!goalForm.name || !goalForm.targetAmount || !goalForm.targetDate}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}