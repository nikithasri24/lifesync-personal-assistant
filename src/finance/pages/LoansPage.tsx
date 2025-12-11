/**
 * LoansPage Component
 * Main page for loan tracking and management
 */

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { LoanCard } from '../components/loans/LoanCard';
import { LoanEditor } from '../components/loans/LoanEditor';
import { LoanPaymentModal } from '../components/loans/LoanPaymentModal';
import type { Loan, LoanInput, LoanPaymentInput } from '../types';
import {
  useLoansQuery,
  useUpsertLoanMutation,
  useDeleteLoanMutation,
  useUpsertLoanPaymentMutation,
} from '../hooks/useFinanceQuery';
import { formatCurrency } from '../utils/currency';
import { calculateInterestPaidToDate, calculatePrincipalPaidToDate } from '../utils/loanCalculations';
import { logger } from '../../services/logger';

const LoansPage: React.FC = () => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: loans = [], isLoading, error } = useLoansQuery();
  const upsertLoanMutation = useUpsertLoanMutation();
  const deleteLoanMutation = useDeleteLoanMutation();
  const upsertPaymentMutation = useUpsertLoanPaymentMutation();

  const handleAddLoan = () => {
    setSelectedLoan(null);
    setIsEditorOpen(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsEditorOpen(true);
  };

  const handleSaveLoan = async (loanInput: LoanInput) => {
    try {
      await upsertLoanMutation.mutateAsync(loanInput);
      setIsEditorOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      logger.error('LoansPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleSaveLoan', loanInput });
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    try {
      await deleteLoanMutation.mutateAsync(loanId);
    } catch (error) {
      logger.error('LoansPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleDeleteLoan', loanId });
    }
  };

  const handleAddPayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (payment: LoanPaymentInput) => {
    if (!selectedLoan) return;

    try {
      await upsertPaymentMutation.mutateAsync({
        loanId: selectedLoan.id,
        payment,
      });

      // Update the loan's current balance
      await upsertLoanMutation.mutateAsync({
        ...selectedLoan,
        currentBalance: payment.balanceAfter,
      });

      setIsPaymentModalOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      logger.error('LoansPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleSavePayment', payment });
    }
  };

  // Calculate summary stats
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalBalance = activeLoans.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalMonthlyPayment = activeLoans.reduce((sum, l) => sum + l.monthlyPayment + l.extraPayment, 0);

  // Calculate interest paid from database records AND calculated from loan parameters
  const totalInterestPaid = loans.reduce((sum, l) => {
    // Use database value if available, otherwise calculate based on loan parameters
    const dbInterestPaid = l.interestPaid || 0;
    const calculatedInterestPaid = calculateInterestPaidToDate(l);

    // Use whichever is greater (in case manual payments were recorded)
    return sum + Math.max(dbInterestPaid, calculatedInterestPaid);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading loans</p>
          <p className="text-sm text-primary opacity-60">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Loan Tracker</h1>
        <button
          onClick={handleAddLoan}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Loan
        </button>
      </div>

      {/* Summary Cards */}
      {activeLoans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
            <p className="text-sm text-primary opacity-60 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-primary opacity-60 mt-1">
              {activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
            <p className="text-sm text-primary opacity-60 mb-1">Monthly Payments</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalMonthlyPayment)}</p>
            <p className="text-xs text-primary opacity-60 mt-1">Total across all loans</p>
          </div>

          <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
            <p className="text-sm text-primary opacity-60 mb-1">Interest Paid</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalInterestPaid)}</p>
            <p className="text-xs text-primary opacity-60 mt-1">Lifetime total</p>
          </div>
        </div>
      )}

      {/* Loans Grid */}
      {loans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-primary mb-2">No loans yet</h3>
          <p className="text-primary opacity-60 mb-4">
            Start tracking your loans to monitor payments and payoff progress
          </p>
          <button
            onClick={handleAddLoan}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Your First Loan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onEdit={handleEditLoan}
              onAddPayment={handleAddPayment}
            />
          ))}
        </div>
      )}

      {/* Loan Editor Modal */}
      {isEditorOpen && (
        <LoanEditor
          loan={selectedLoan || undefined}
          onSave={handleSaveLoan}
          onCancel={() => {
            setIsEditorOpen(false);
            setSelectedLoan(null);
          }}
        />
      )}

      {/* Payment Recording Modal */}
      {isPaymentModalOpen && selectedLoan && (
        <LoanPaymentModal
          loan={selectedLoan}
          onSave={handleSavePayment}
          onCancel={() => {
            setIsPaymentModalOpen(false);
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
};

export default LoansPage;
