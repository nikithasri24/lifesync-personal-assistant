/**
 * MetricCardV2 Component
 * Display financial metrics with gradient values
 * Used across Dashboard, Net Worth, Goals, etc.
 */

import React from 'react';

type MetricType = 'neutral' | 'positive' | 'negative';

interface MetricCardV2Props {
  label: string;
  value: string | number;
  type?: MetricType;
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCardV2: React.FC<MetricCardV2Props> = ({
  label,
  value,
  type = 'neutral',
  subtitle,
  onClick,
}) => {
  const getValueGradient = (): string => {
    switch (type) {
      case 'positive':
        return 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
      case 'negative':
        return 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)';
      default:
        return 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`transition-transform ${onClick ? 'cursor-pointer hover:scale-102 active:scale-98' : ''}`}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          color: '#9B8B7A',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          background: getValueGradient(),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: subtitle ? '4px' : 0,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: '#9B8B7A' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
