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
  liability?: boolean;
}

interface AccountCardV2Props {
  account: Account;
  onClick: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
  institutionName?: string;
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
}) => {
  const utilization =
    account.type === 'credit' && account.creditLimit
      ? Math.min((Math.abs(account.balance) / account.creditLimit) * 100, 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
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
