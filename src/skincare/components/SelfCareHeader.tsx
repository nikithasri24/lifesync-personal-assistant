import React from 'react';
import { Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SelfCareHeaderProps {
  onAddProduct?: () => void;
  onAddCategory?: () => void;
  activeView: 'routine' | 'schedule' | 'products' | 'setup';
}

/**
 * Header for Self Care page with terracotta gradient theme
 */
export function SelfCareHeader({
  onAddProduct,
  onAddCategory,
  activeView,
}: SelfCareHeaderProps): React.ReactElement {
  const colors = useThemeColors();

  const getActionButton = () => {
    if (activeView === 'products' && onAddProduct) {
      return (
        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold transition hover:bg-white/90"
          style={{ color: colors.text.primary }}
          aria-label="Add product"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      );
    }

    if (activeView === 'setup' && onAddCategory) {
      return (
        <button
          type="button"
          onClick={onAddCategory}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold transition hover:bg-white/90"
          style={{ color: colors.text.primary }}
          aria-label="Add category"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      );
    }

    return null;
  };

  return (
    <header
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">✨ Self Care</h1>
          <p className="text-sm text-white/90">
            Your skincare routines, products, and personal care schedule
          </p>
        </div>
        {getActionButton()}
      </div>
    </header>
  );
}
