/**
 * LoansPage Component
 * Main page for loan tracking and management
 */

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { LoanCardV2, LoanFormModalV2, type LoanFormData } from '@/finance/components/v2';
import { LoanPaymentModal } from '../components/loans/LoanPaymentModal';
import type { Loan, LoanPaymentInput } from '../types';
import {
  useLoansQuery,
  useUpsertLoanMutation,
  useDeleteLoanMutation,
  useUpsertLoanPaymentMutation,
  useFinanceMergedConnectionQuery,
} from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../utils/currency';
import { calculateInterestPaidToDate } from '../utils/loanCalculations';
import { logger } from '../../services/logger';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';

const LoansPage: React.FC = () => {
  const colors = useThemeColors();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const { data: loans = [], isLoading, error } = useLoansQuery();
  const upsertLoanMutation = useUpsertLoanMutation();
  const deleteLoanMutation = useDeleteLoanMutation();
  const upsertPaymentMutation = useUpsertLoanPaymentMutation();

  const handleAddLoan = () => {
    setSelectedLoan(null);
    setShowModal(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  const handleSaveLoan = async (formData: LoanFormData) => {
    try {
      await upsertLoanMutation.mutateAsync({
        id: selectedLoan?.id,
        name: formData.name,
        loanType: formData.loanType,
        principalAmount: formData.principalAmount,
        currentBalance: formData.currentBalance,
        interestRate: formData.interestRate,
        monthlyPayment: formData.monthlyPayment,
        nextPaymentDate: formData.nextPaymentDate,
        loanTerm: formData.loanTerm,
        notes: formData.notes,
        userId: selectedLoan?.userId || user?.id,
      });
      setShowModal(false);
      setSelectedLoan(null);
    } catch (error) {
      logger.error('LoansPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleSaveLoan', formData });
      throw error; // Let modal handle error display
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLoan(null);
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

  // Calculate summary stats - no filtering in merged mode, always show all
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

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🏠</span>
            Loans
          </h1>
          <button
            onClick={handleAddLoan}
            className="px-4 py-3 rounded-xl font-semibold text-white transition-opacity flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
            aria-label="Add loan"
          >
            <Plus className="w-5 h-5" />
            Add Loan
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-xl border animate-pulse"
                style={{
                  backgroundColor: colors.bg.white,
                  borderColor: colors.border.light,
                }}
              >
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">Error loading loans</p>
            <p className="text-sm" style={{ color: colors.text.secondary }}>{error.message}</p>
          </div>
        )}

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

        {/* Empty State */}
        {!isLoading && !error && loans.length === 0 && (
          <div
            className="p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: colors.border.medium }}
          >
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No loans yet
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Start tracking your loans to monitor payments
            </p>
            <button
              onClick={handleAddLoan}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Add First Loan
            </button>
          </div>
        )}

        {/* Loans Grid */}
        {!isLoading && !error && loans.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {loans.map((loan) => (
              <LoanCardV2
                key={loan.id}
                loan={{
                  id: loan.id,
                  name: loan.name,
                  principalAmount: loan.principalAmount,
                  currentBalance: loan.currentBalance,
                  interestRate: loan.interestRate,
                  monthlyPayment: loan.monthlyPayment,
                  nextPaymentDate: loan.nextPaymentDate,
                  loanType: loan.loanType,
                }}
                onClick={() => handleEditLoan(loan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loan Form Modal */}
      <LoanFormModalV2
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveLoan}
        initialData={selectedLoan ? {
          name: selectedLoan.name,
          loanType: selectedLoan.loanType || 'personal',
          principalAmount: selectedLoan.principalAmount,
          currentBalance: selectedLoan.currentBalance,
          interestRate: selectedLoan.interestRate,
          monthlyPayment: selectedLoan.monthlyPayment,
          nextPaymentDate: selectedLoan.nextPaymentDate,
          loanTerm: selectedLoan.loanTerm,
          notes: selectedLoan.notes,
        } : undefined}
        isPending={upsertLoanMutation.isPending}
      />

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
