import { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  X,
  Save
} from 'lucide-react';
import type { DebtAccount, PayoffStrategy } from '../types/finance';

const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card', icon: '💳', color: '#EF4444' },
  { value: 'student_loan', label: 'Student Loan', icon: '🎓', color: '#3B82F6' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠', color: '#10B981' },
  { value: 'loan', label: 'Personal Loan', icon: '💰', color: '#F59E0B' },
  { value: 'other', label: 'Other Debt', icon: '📋', color: '#8B5CF6' }
];

const MOCK_DEBTS: DebtAccount[] = [
  {
    id: '1',
    accountId: 'acc1',
    type: 'credit_card',
    balance: 5420.50,
    interestRate: 18.99,
    minimumPayment: 125.00,
    dueDate: new Date('2024-02-15'),
    creditLimit: 8000,
    payoffStrategies: []
  },
  {
    id: '2',
    accountId: 'acc2',
    type: 'credit_card',
    balance: 2850.00,
    interestRate: 24.99,
    minimumPayment: 85.00,
    dueDate: new Date('2024-02-20'),
    creditLimit: 5000,
    payoffStrategies: []
  },
  {
    id: '3',
    accountId: 'acc3',
    type: 'student_loan',
    balance: 28500.00,
    interestRate: 6.5,
    minimumPayment: 310.00,
    dueDate: new Date('2024-02-10'),
    payoffStrategies: []
  }
];

interface DebtPaymentPlan {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface StrategyComparison {
  name: string;
  totalPayments: number;
  totalInterest: number;
  monthsToPayoff: number;
  monthlySavings?: number;
}

export default function DebtPayoffCalculator() {
  const [debts, setDebts] = useState<DebtAccount[]>(MOCK_DEBTS);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtAccount | null>(null);
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [selectedStrategy, setSelectedStrategy] = useState<'snowball' | 'avalanche' | 'custom'>('avalanche');
  const [debtForm, setDebtForm] = useState({
    type: 'credit_card' as const,
    balance: '',
    interestRate: '',
    minimumPayment: '',
    creditLimit: '',
    accountName: ''
  });

  const calculatePaymentSchedule = (debt: DebtAccount, monthlyPayment: number): DebtPaymentPlan[] => {
    const schedule: DebtPaymentPlan[] = [];
    let remainingBalance = debt.balance;
    let month = 1;
    const monthlyRate = debt.interestRate / 100 / 12;

    while (remainingBalance > 0.01 && month <= 360) { // Max 30 years
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
      
      if (principalPayment <= 0) break; // Payment too low to cover interest
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance)
      });
      
      month++;
    }

    return schedule;
  };

  const calculateDebtStrategy = (strategy: 'snowball' | 'avalanche' | 'custom'): StrategyComparison => {
    const totalMinimums = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const totalExtraPayment = extraPayment;
    const totalAvailable = totalMinimums + totalExtraPayment;

    let sortedDebts = [...debts];
    
    if (strategy === 'snowball') {
      // Pay smallest balance first
      sortedDebts.sort((a, b) => a.balance - b.balance);
    } else if (strategy === 'avalanche') {
      // Pay highest interest rate first
      sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
    }

    let totalInterestPaid = 0;
    let totalPayments = 0;
    let maxMonths = 0;
    let remainingExtra = totalExtraPayment;
    
    const debtPayoffs = sortedDebts.map(debt => {
      let paymentAmount = debt.minimumPayment;
      
      // Apply extra payment to first debt in strategy order
      if (remainingExtra > 0) {
        paymentAmount += remainingExtra;
        remainingExtra = 0;
      }
      
      const schedule = calculatePaymentSchedule(debt, paymentAmount);
      const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
      const totalPaid = schedule.reduce((sum, payment) => sum + payment.payment, 0);
      
      totalInterestPaid += totalInterest;
      totalPayments += totalPaid;
      maxMonths = Math.max(maxMonths, schedule.length);
      
      return { debt, schedule, totalInterest, totalPaid };
    });

    return {
      name: strategy === 'snowball' ? 'Debt Snowball' : 
            strategy === 'avalanche' ? 'Debt Avalanche' : 'Custom Strategy',
      totalPayments,
      totalInterest: totalInterestPaid,
      monthsToPayoff: maxMonths,
      monthlySavings: 0 // Calculate vs minimum payments
    };
  };

  const getDebtTypeInfo = (type: string) => {
    return DEBT_TYPES.find(t => t.value === type) || DEBT_TYPES[0];
  };

  const getCreditUtilization = (debt: DebtAccount) => {
    if (debt.creditLimit && debt.creditLimit > 0) {
      return (debt.balance / debt.creditLimit) * 100;
    }
    return 0;
  };

  const handleAddDebt = () => {
    setEditingDebt(null);
    setDebtForm({
      type: 'credit_card',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      creditLimit: '',
      accountName: ''
    });
    setShowAddDebt(true);
  };

  const handleSaveDebt = () => {
    if (!debtForm.balance || !debtForm.interestRate || !debtForm.minimumPayment) return;

    const debtData: DebtAccount = {
      id: editingDebt?.id || Date.now().toString(),
      accountId: editingDebt?.accountId || `acc-${Date.now()}`,
      type: debtForm.type,
      balance: parseFloat(debtForm.balance),
      interestRate: parseFloat(debtForm.interestRate),
      minimumPayment: parseFloat(debtForm.minimumPayment),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      creditLimit: debtForm.creditLimit ? parseFloat(debtForm.creditLimit) : undefined,
      payoffStrategies: editingDebt?.payoffStrategies || []
    };

    if (editingDebt) {
      setDebts(debts.map(d => d.id === editingDebt.id ? debtData : d));
    } else {
      setDebts([...debts, debtData]);
    }

    setShowAddDebt(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (debtId: string) => {
    if (confirm('Delete this debt account?')) {
      setDebts(debts.filter(d => d.id !== debtId));
    }
  };

  // Calculate strategy comparisons
  const snowballStrategy = calculateDebtStrategy('snowball');
  const avalancheStrategy = calculateDebtStrategy('avalanche');
  const strategies = [snowballStrategy, avalancheStrategy];

  // Calculate totals
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const weightedAverageRate = debts.length > 0 ? 
    debts.reduce((sum, debt) => sum + (debt.interestRate * debt.balance), 0) / totalDebt : 0;
  const highestRateDebt = debts.reduce((highest, debt) => 
    debt.interestRate > highest.interestRate ? debt : highest, debts[0] || { interestRate: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-red-600" />
            Debt Payoff Calculator
          </h3>
          <p className="text-gray-600">Strategic debt elimination planning and tracking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCalculator(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 size={16} className="mr-2" />
            Compare Strategies
          </button>
          <button
            onClick={handleAddDebt}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Debt
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Debt</p>
              <p className="text-2xl font-bold text-red-900">${totalDebt.toLocaleString()}</p>
            </div>
            <CreditCard className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Min Payments</p>
              <p className="text-2xl font-bold text-orange-900">${totalMinimumPayments.toFixed(0)}</p>
              <p className="text-xs text-orange-700">per month</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Avg Interest Rate</p>
              <p className="text-2xl font-bold text-yellow-900">{weightedAverageRate.toFixed(1)}%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Debt Accounts</p>
              <p className="text-2xl font-bold text-green-900">{debts.length}</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Strategy Recommendation */}
      {strategies.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">Recommended Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategies.map((strategy, index) => {
                  const isBest = index === 0; // Avalanche is usually better for total interest
                  return (
                    <div key={strategy.name} className={`p-4 rounded-lg border ${
                      isBest ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{strategy.name}</h5>
                        {isBest && <Award className="w-4 h-4 text-green-600" />}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Interest:</span>
                          <span className="font-medium">${strategy.totalInterest.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payoff Time:</span>
                          <span className="font-medium">{strategy.monthsToPayoff} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Paid:</span>
                          <span className="font-medium">${strategy.totalPayments.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt List */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Calculator className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No debts tracked</h4>
          <p className="text-gray-600 mb-6">Add your debts to create a payoff strategy</p>
          <button
            onClick={handleAddDebt}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add First Debt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {debts
            .sort((a, b) => b.interestRate - a.interestRate) // Sort by highest interest rate
            .map((debt) => {
              const typeInfo = getDebtTypeInfo(debt.type);
              const utilization = getCreditUtilization(debt);
              const schedule = calculatePaymentSchedule(debt, debt.minimumPayment);
              const payoffMonths = schedule.length;
              const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
              
              return (
                <div key={debt.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <span className="text-2xl">{typeInfo.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{typeInfo.label}</h4>
                        <p className="text-gray-600">{debt.interestRate}% APR</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Min Payment: ${debt.minimumPayment.toFixed(0)}</span>
                          {debt.creditLimit && (
                            <>
                              <span>•</span>
                              <span>Limit: ${debt.creditLimit.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingDebt(debt);
                          setDebtForm({
                            type: debt.type,
                            balance: debt.balance.toString(),
                            interestRate: debt.interestRate.toString(),
                            minimumPayment: debt.minimumPayment.toString(),
                            creditLimit: debt.creditLimit?.toString() || '',
                            accountName: ''
                          });
                          setShowAddDebt(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Balance & Utilization */}
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Current Balance</h5>
                        <div className="text-3xl font-bold text-red-600">
                          ${debt.balance.toLocaleString()}
                        </div>
                      </div>
                      
                      {debt.creditLimit && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Credit Utilization</span>
                            <span className={`text-sm font-medium ${
                              utilization > 80 ? 'text-red-600' :
                              utilization > 30 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                utilization > 80 ? 'bg-red-500' :
                                utilization > 30 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payoff Timeline */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700">With Minimum Payments</h5>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {payoffMonths} months
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.floor(payoffMonths / 12)} years, {payoffMonths % 12} months
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">
                          ${totalInterest.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-600">total interest</div>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700">Recommendations</h5>
                      <div className="space-y-2">
                        {debt.interestRate > 20 && (
                          <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                            <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                            <div className="text-sm">
                              <div className="font-medium text-red-800">High Interest Rate</div>
                              <div className="text-red-700">Consider balance transfer or aggressive payoff</div>
                            </div>
                          </div>
                        )}
                        
                        {utilization > 80 && (
                          <div className="flex items-start space-x-2 p-2 bg-orange-50 rounded-lg">
                            <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                            <div className="text-sm">
                              <div className="font-medium text-orange-800">High Utilization</div>
                              <div className="text-orange-700">May impact credit score</div>
                            </div>
                          </div>
                        )}
                        
                        {debt.interestRate < 10 && (
                          <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                            <CheckCircle size={16} className="text-green-600 mt-0.5" />
                            <div className="text-sm">
                              <div className="font-medium text-green-800">Low Interest Rate</div>
                              <div className="text-green-700">Consider minimum payments</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Add/Edit Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDebt ? 'Edit Debt Account' : 'Add New Debt'}
              </h3>
              <button
                onClick={() => setShowAddDebt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debt Type
                </label>
                <select
                  value={debtForm.type}
                  onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {DEBT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtForm.balance}
                    onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })}
                    placeholder="5000.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtForm.interestRate}
                    onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
                    placeholder="18.99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Payment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtForm.minimumPayment}
                    onChange={(e) => setDebtForm({ ...debtForm, minimumPayment: e.target.value })}
                    placeholder="125.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtForm.creditLimit}
                    onChange={(e) => setDebtForm({ ...debtForm, creditLimit: e.target.value })}
                    placeholder="8000.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddDebt(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDebt}
                disabled={!debtForm.balance || !debtForm.interestRate || !debtForm.minimumPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingDebt ? 'Update Debt' : 'Add Debt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Debt Payoff Strategy Calculator</h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Monthly Payment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                    placeholder="500.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Additional amount beyond minimum payments
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy
                  </label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="avalanche">Debt Avalanche (Highest Interest First)</option>
                    <option value="snowball">Debt Snowball (Smallest Balance First)</option>
                    <option value="custom">Custom Strategy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategies.map((strategy, index) => (
                  <div key={strategy.name} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">{strategy.name}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payoff Time:</span>
                        <span className="font-medium">{strategy.monthsToPayoff} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Interest:</span>
                        <span className="font-medium text-red-600">${strategy.totalInterest.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Payments:</span>
                        <span className="font-medium">${strategy.totalPayments.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Strategy Comparison</h5>
                <p className="text-sm text-blue-700">
                  The <strong>Debt Avalanche</strong> method typically saves more money in interest, 
                  while the <strong>Debt Snowball</strong> method provides psychological wins with quicker payoffs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}