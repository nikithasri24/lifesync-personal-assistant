/**
 * Edit Item Modal Component
 * Modal form for editing existing shopping list items
 * Terracotta themed with bottom sheet style
 */

import React, { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItemForm } from '../../types/forms';
import type { Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { validateCategory, validatePriority } from '../../utils/typeValidators';

interface EditItemModalProps {
  isOpen: boolean;
  formData: ShoppingItemForm;
  stores: Store[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (updates: Partial<ShoppingItemForm>) => void;
  onDelete?: () => void;
}

export function EditItemModal({
  isOpen,
  formData,
  stores,
  onClose,
  onSubmit,
  onFormChange,
  onDelete,
}: EditItemModalProps) {
  const colors = useThemeColors();

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const inputClassName = `w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none`;
  const labelClassName = `block text-sm font-semibold mb-2`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile only) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Edit Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.badge.bg;
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <form onSubmit={onSubmit} className="p-6 space-y-5">
            {/* Item Name */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                className={inputClassName}
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
                placeholder="e.g., Organic Bananas"
                required
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => onFormChange({ quantity: parseInt(e.target.value) || 1 })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                />
              </div>
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => onFormChange({ unit: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                >
                  <option value="pcs">pieces</option>
                  <option value="lbs">pounds</option>
                  <option value="oz">ounces</option>
                  <option value="bottles">bottles</option>
                  <option value="cartons">cartons</option>
                  <option value="boxes">boxes</option>
                  <option value="bags">bags</option>
                  <option value="gallons">gallons</option>
                  <option value="liters">liters</option>
                </select>
              </div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => onFormChange({ category: validateCategory(e.target.value) })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                >
                  {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
                    <option key={category} value={category}>
                      {icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => onFormChange({ priority: validatePriority(e.target.value) })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Store */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Preferred Store
              </label>
              <select
                value={formData.preferredStore}
                onChange={(e) => onFormChange({ preferredStore: e.target.value })}
                className={inputClassName}
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
              >
                <option value="">AI will decide</option>
                {stores.map(store => {
                  const storeType = STORE_TYPES.find(st => st.value === store.type);
                  return (
                    <option key={store.id} value={store.id}>
                      {storeType?.icon} {store.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Price and Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Est. Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedPrice}
                  onChange={(e) => onFormChange({ estimatedPrice: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                  placeholder="$0.00"
                />
              </div>
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => onFormChange({ brand: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                  placeholder="e.g., Organic Valley"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                className={inputClassName}
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                  color: colors.text.primary,
                  minHeight: '80px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
                placeholder="Any special notes or preferences..."
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              {/* Delete Button (if onDelete provided) */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `2px solid ${colors.status.error}`,
                    color: colors.status.error,
                  }}
                  aria-label="Delete item"
                >
                  <Trash2 size={18} />
                  Delete Item
                </button>
              )}

              {/* Save and Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `2px solid ${colors.border.medium}`,
                    color: colors.text.secondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
