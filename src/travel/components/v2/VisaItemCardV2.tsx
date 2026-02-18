/**
 * VisaItemCardV2 Component
 * Display visa items in list with expiry warnings
 * Color-coded expiry alerts based on days remaining
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface VisaItemCardV2Props {
  country: string;
  flag: string;
  visaType: string;
  issueDate: string;
  expiryDate: string;
  onClick: () => void;
}

export const VisaItemCardV2: React.FC<VisaItemCardV2Props> = ({
  country,
  flag,
  visaType,
  issueDate,
  expiryDate,
  onClick,
}) => {
  const colors = useThemeColors();

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDateStr: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry(expiryDate);
  const isExpiringSoon = daysLeft < 30;
  const isExpired = daysLeft < 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '12px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        borderLeft: '4px solid #C18B5E',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#5C4A3A' }}>
          {flag} {country}
        </div>
        <div
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            background: '#E8DCC8',
            color: '#6B5847',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          {visaType}
        </div>
      </div>

      {/* Dates */}
      <div style={{ fontSize: '13px', color: '#6B5847', marginBottom: '4px' }}>
        📅 {new Date(issueDate).toLocaleDateString()} - {new Date(expiryDate).toLocaleDateString()}
      </div>

      {/* Expiry Warning */}
      <div
        style={{
          fontSize: '12px',
          color: isExpired ? '#DC2626' : (isExpiringSoon ? '#EA580C' : '#9B8B7A'),
          fontWeight: isExpiringSoon || isExpired ? 600 : 400,
        }}
      >
        {isExpired ? '❌ Expired' : (isExpiringSoon ? `⚠️ Expires in ${daysLeft} days` : `✅ Valid for ${daysLeft} days`)}
      </div>
    </div>
  );
};
