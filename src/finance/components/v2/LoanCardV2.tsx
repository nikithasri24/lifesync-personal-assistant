/**
 * LoanCardV2 Component
 * Display loan cards with payment schedules and balances
 */

import React from 'react';

interface Loan {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate?: string;
  loanType?: string;
}

interface LoanCardV2Props {
  loan: Loan;
  onClick: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getLoanIcon = (loanType?: string): string => {
  const icons: Record<string, string> = {
    mortgage: '🏠',
    auto: '🚗',
    student: '🎓',
    personal: '💳',
    business: '🏢',
  };
  return icons[loanType?.toLowerCase() || 'personal'] || '💰';
};

export const LoanCardV2: React.FC<LoanCardV2Props> = ({ loan, onClick }) => {
  const paidOff = loan.principalAmount - loan.currentBalance;
  const percentage = (paidOff / loan.principalAmount) * 100;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        borderLeft: '4px solid #F59E0B',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>{getLoanIcon(loan.loanType)}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
                {loan.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9B8B7A', marginTop: '2px' }}>
                {loan.interestRate}% APR
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '2px' }}>
            Balance
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#5C4A3A' }}>
            {formatCurrency(loan.currentBalance)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: '#E8DCC8',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50 0%, #388E3C 100%)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Payment Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #E8DCC8',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '2px' }}>
            Monthly Payment
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#5C4A3A' }}>
            {formatCurrency(loan.monthlyPayment)}
          </div>
        </div>
        {loan.nextPaymentDate && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '2px' }}>
              Next Payment
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B' }}>
              {new Date(loan.nextPaymentDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progress Status */}
      <div
        style={{
          fontSize: '12px',
          color: '#4CAF50',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        {Math.round(percentage)}% paid off • {formatCurrency(paidOff)} of{' '}
        {formatCurrency(loan.principalAmount)}
      </div>
    </div>
  );
};
