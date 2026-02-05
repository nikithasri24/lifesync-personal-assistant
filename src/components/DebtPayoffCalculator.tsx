import { useState } from 'react';
import { Calculator, Plus, BarChart3 } from 'lucide-react';
import type { DebtAccount } from '../types/finance';
import { calculatePaymentSchedule, calculateDebtStrategy, getDebtTypeInfo, getCreditUtilization } from './DebtPayoffCalculator/utils';
import DebtSummaryCards from './DebtPayoffCalculator/DebtSummaryCards';
import StrategyRecommendation from './DebtPayoffCalculator/StrategyRecommendation';
import DebtCard from './DebtPayoffCalculator/DebtCard';
import DebtFormModal from './DebtPayoffCalculator/DebtFormModal';
import type { DebtFormData } from './DebtPayoffCalculator/DebtFormModal';
import StrategyCalculatorModal from './DebtPayoffCalculator/StrategyCalculatorModal';
import ConfirmDialog from './DebtPayoffCalculator/ConfirmDialog';

export default function DebtPayoffCalculator() {
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtAccount | null>(null);
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [selectedStrategy, setSelectedStrategy] = useState<'snowball' | 'avalanche' | 'custom'>('avalanche');
  const [deleteConfirmDebtId, setDeleteConfirmDebtId] = useState<string | null>(null);
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    type: 'credit_card',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    creditLimit: '',
    accountName: ''
  });

  const handleAddDebt = (): void => {
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

  const handleSaveDebt = (): void => {
    if (!debtForm.balance || !debtForm.interestRate || !debtForm.minimumPayment) return;

    const debtData: DebtAccount = {
      id: editingDebt?.id ?? Date.now().toString(),
      accountId: editingDebt?.accountId ?? `acc-${Date.now()}`,
      type: debtForm.type,
      balance: parseFloat(debtForm.balance),
      interestRate: parseFloat(debtForm.interestRate),
      minimumPayment: parseFloat(debtForm.minimumPayment),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      creditLimit: debtForm.creditLimit ? parseFloat(debtForm.creditLimit) : undefined,
      payoffStrategies: editingDebt?.payoffStrategies ?? []
    };

    setDebts(prev =>
      editingDebt
        ? prev.map(d => d.id === editingDebt.id ? debtData : d)
        : [...prev, debtData]
    );

    setShowAddDebt(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (debtId: string): void => {
    setDeleteConfirmDebtId(debtId);
  };

  const confirmDelete = (): void => {
    if (deleteConfirmDebtId) {
      setDebts(prev => prev.filter(d => d.id !== deleteConfirmDebtId));
      setDeleteConfirmDebtId(null);
    }
  };

  const snowballStrategy = calculateDebtStrategy(debts, extraPayment, 'snowball');
  const avalancheStrategy = calculateDebtStrategy(debts, extraPayment, 'avalanche');
  const strategies = [snowballStrategy, avalancheStrategy];

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const weightedAverageRate = debts.length > 0 ?
    debts.reduce((sum, debt) => sum + (debt.interestRate * debt.balance), 0) / totalDebt : 0;

  return (
    <div className="space-y-6">
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
            aria-label="Add debt account"
          >
            <Plus size={18} className="mr-2" />
            Add Debt
          </button>
        </div>
      </div>

      <DebtSummaryCards
        totalDebt={totalDebt}
        totalMinimumPayments={totalMinimumPayments}
        weightedAverageRate={weightedAverageRate}
        debtCount={debts.length}
      />

      <StrategyRecommendation strategies={strategies} />

      {debts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Calculator className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No debts tracked</h4>
          <p className="text-gray-600 mb-6">Add your debts to create a payoff strategy</p>
          <button
            onClick={handleAddDebt}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            aria-label="Add first debt account"
          >
            <Plus size={20} className="mr-2" />
            Add First Debt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {debts
            .sort((a, b) => b.interestRate - a.interestRate)
            .map((debt) => {
              const typeInfo = getDebtTypeInfo(debt.type);
              const utilization = getCreditUtilization(debt);
              const schedule = calculatePaymentSchedule(debt, debt.minimumPayment);

              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  typeInfo={typeInfo}
                  utilization={utilization}
                  schedule={schedule}
                  onEdit={() => {
                    setEditingDebt(debt);
                    setDebtForm({
                      type: debt.type,
                      balance: debt.balance.toString(),
                      interestRate: debt.interestRate.toString(),
                      minimumPayment: debt.minimumPayment.toString(),
                      creditLimit: debt.creditLimit?.toString() ?? '',
                      accountName: ''
                    });
                    setShowAddDebt(true);
                  }}
                  onDelete={() => handleDeleteDebt(debt.id)}
                />
              );
            })}
        </div>
      )}

      {showAddDebt && (
        <DebtFormModal
          editingDebt={editingDebt}
          debtForm={debtForm}
          onFormChange={setDebtForm}
          onSave={handleSaveDebt}
          onClose={() => setShowAddDebt(false)}
        />
      )}

      {showCalculator && (
        <StrategyCalculatorModal
          strategies={strategies}
          extraPayment={extraPayment}
          selectedStrategy={selectedStrategy}
          onExtraPaymentChange={setExtraPayment}
          onStrategyChange={setSelectedStrategy}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {deleteConfirmDebtId && (
        <ConfirmDialog
          title="Delete Debt Account"
          message="Delete this debt account?"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmDebtId(null)}
        />
      )}
    </div>
  );
}
