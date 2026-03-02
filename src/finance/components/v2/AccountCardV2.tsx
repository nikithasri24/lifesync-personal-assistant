/**
 * AccountCardV2 Component
 * Display account cards with type icons, balance, and utilization
 */

import React from 'react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institutionId?: string;
  creditLimit?: number;
  apr?: number;
  promoAprEndDate?: string;
  liability?: boolean;
}

interface MonthlySnapshot {
  income: number;
  expenses: number;
  net: number;
}

interface AccountCardV2Props {
  account: Account;
  onClick?: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
  institutionName?: string;
  monthlySnapshot?: MonthlySnapshot;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getAccountIcon = (type: string): string => {
  const icons: Record<string, string> = {
    checking: '💳',
    savings: '🏦',
    credit: '💳',
    brokerage: '📈',
    investment: '📊',
    '401k': '🏢',
    '403b': '🏢',
    traditional_ira: '🎯',
    roth_ira: '🎯',
    sep_ira: '🎯',
    simple_ira: '🎯',
    hsa: '🏥',
    loan: '🏠',
  };
  return icons[type] || '💰';
};

export const AccountCardV2: React.FC<AccountCardV2Props> = ({
  account,
  onClick,
  showOwnerBadge = false,
  owner,
  institutionName,
  monthlySnapshot,
}) => {
  const utilization =
    account.type === 'credit' && account.creditLimit
      ? Math.min((Math.abs(account.balance) / account.creditLimit) * 100, 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className={`relative transition-transform ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.98]' : 'opacity-75'}`}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        borderLeft: '4px solid #D4A574',
      }}
    >
      {/* Owner Badge */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            background:
              'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
            {getAccountIcon(account.type)} {account.name}
          </div>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginTop: '2px' }}>
            {account.type.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#5C4A3A' }}>
          {formatCurrency(account.balance)}
        </div>
      </div>

      {/* Institution */}
      {institutionName && (
        <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '4px' }}>
          {institutionName}
        </div>
      )}

      {/* Monthly Snapshot */}
      {monthlySnapshot && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #E8DCC8',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#9B8B7A', marginBottom: '2px' }}>IN</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4CAF50' }}>
              +{formatCurrency(monthlySnapshot.income)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#9B8B7A', marginBottom: '2px' }}>OUT</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E57373' }}>
              -{formatCurrency(monthlySnapshot.expenses)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#9B8B7A', marginBottom: '2px' }}>NET</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: monthlySnapshot.net >= 0 ? '#4CAF50' : '#E57373' }}>
              {monthlySnapshot.net >= 0 ? '+' : ''}{formatCurrency(monthlySnapshot.net)}
            </div>
          </div>
        </div>
      )}

      {/* 0% Promo APR expiry badge */}
      {account.promoAprEndDate && (() => {
        const endDate = new Date(account.promoAprEndDate);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const monthStr = endDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        const isExpiringSoon = daysLeft <= 90;
        const isExpired = daysLeft < 0;

        return (
          <div style={{
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            background: isExpired ? '#FEE2E2' : isExpiringSoon ? '#FEF3C7' : '#DCFCE7',
            color: isExpired ? '#DC2626' : isExpiringSoon ? '#D97706' : '#16A34A',
          }}>
            {isExpired ? '⚠️' : isExpiringSoon ? '⏰' : '✅'}
            {isExpired ? `0% APR expired ${monthStr}` : `0% APR ends ${monthStr}`}
          </div>
        );
      })()}

      {/* Credit Card Utilization */}
      {account.type === 'credit' && account.creditLimit && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #E8DCC8',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '6px' }}>
            Utilization: {Math.round(utilization)}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#E8DCC8',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${utilization}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
