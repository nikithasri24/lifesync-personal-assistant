/**
 * ShoppingHeaderV2 Component
 * Page header with terracotta gradient and shopping stats
 * iOS-style design for shopping page
 */

import React from 'react';
import { Mic, ScanLine, Filter } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { gradients } from '../../../styles/colors';

export interface ShoppingHeaderV2Props {
  title: string;
  subtitle: string;
  itemsCount: number;
  completedCount: number;
  totalCost: number;
  onVoiceClick?: () => void;
  onBarcodeClick?: () => void;
  onFilterClick?: () => void;
  className?: string;
}

export const ShoppingHeaderV2: React.FC<ShoppingHeaderV2Props> = ({
  title,
  subtitle,
  itemsCount,
  completedCount,
  totalCost,
  onVoiceClick,
  onBarcodeClick,
  onFilterClick,
  className = '',
}) => {
  const colors = useThemeColors();

  return (
    <div
      className={`sticky top-0 z-10 px-5 pt-9 pb-4 ${className}`}
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 1px 3px rgba(139, 111, 71, 0.08)',
      }}
    >
      <div className="relative">
        <h1
          className="text-[34px] font-bold mb-1.5 leading-tight"
          style={{
            background: gradients.text,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </h1>
        <p
          className="text-[15px]"
          style={{ color: colors.text.tertiary }}
        >
          {subtitle}
        </p>

        {/* Header Action Buttons */}
        <div className="absolute top-1 right-0 flex gap-3">
          {onVoiceClick && (
            <button
              type="button"
              onClick={onVoiceClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Voice input"
            >
              <Mic className="w-[18px] h-[18px]" style={{ color: colors.badge.text }} />
            </button>
          )}
          {onBarcodeClick && (
            <button
              type="button"
              onClick={onBarcodeClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Scan barcode"
            >
              <ScanLine className="w-[18px] h-[18px]" style={{ color: colors.badge.text }} />
            </button>
          )}
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Filter items"
            >
              <Filter className="w-[18px] h-[18px]" style={{ color: colors.badge.text }} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border.light}` }}>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl" aria-hidden="true">📋</span>
          <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-2xl" aria-hidden="true">✓</span>
          <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
            {completedCount} done
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-2xl" aria-hidden="true">💰</span>
          <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
            ${totalCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShoppingHeaderV2;
