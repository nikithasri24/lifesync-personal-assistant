/**
 * Add Pantry Item Modal Component
 * Modal form for adding items to pantry inventory
 * Terracotta themed with bottom sheet style
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PantryItem } from '../../../types';
import { validatePantryCategory } from '../../utils/typeValidators';

interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    quantity: number;
    unit?: string;
    category: PantryItem['category'];
    expirationDate?: Date;
    location?: string;
    lowStockThreshold?: number;
    isLowStock?: boolean;
  }) => Promise<void>;
}

export function AddPantryItemModal({ isOpen, onClose, onSave }: AddPantryItemModalProps): React.JSX.Element | null {
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

  const [pantryForm, setPantryForm] = useState({
    name: '',
    quantity: '1',
    unit: '',
    category: 'pantry' as PantryItem['category'],
    expiration: ''
  });
  const [pantryFormLocation, setPantryFormLocation] = useState('');
  const [pantryFormThreshold, setPantryFormThreshold] = useState('');

  const handleSubmit = async (): Promise<void> => {
    const qty = Number(pantryForm.quantity) || 0;
    const exp = pantryForm.expiration ? new Date(pantryForm.expiration) : undefined;
    const threshold = pantryFormThreshold ? Number(pantryFormThreshold) : undefined;

    await onSave({
      name: pantryForm.name.trim(),
      quantity: qty,
      unit: pantryForm.unit.trim() || undefined,
      category: pantryForm.category,
      expirationDate: exp,
      location: pantryFormLocation || undefined,
      lowStockThreshold: threshold,
      isLowStock: threshold ? qty <= threshold : undefined
    });

    // Reset form
    setPantryForm({ name: '', quantity: '1', unit: '', category: 'pantry', expiration: '' });
    setPantryFormLocation('');
    setPantryFormThreshold('');
    onClose();
  };

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
            Add Pantry Item
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
        <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Item Name */}
          <div>
            <label className={labelClassName} style={{ color: colors.text.secondary }}>
              Item Name *
            </label>
            <input
              type="text"
              value={pantryForm.name}
              onChange={(e) => setPantryForm(s => ({ ...s, name: e.target.value }))}
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
              placeholder="e.g., Rice"
              required
              autoFocus
            />
          </div>

          {/* Quantity, Unit, Category */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Quantity
              </label>
              <input
                type="number"
                min={0}
                value={pantryForm.quantity}
                onChange={(e) => setPantryForm(s => ({ ...s, quantity: e.target.value }))}
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
              <input
                type="text"
                value={pantryForm.unit}
                onChange={(e) => setPantryForm(s => ({ ...s, unit: e.target.value }))}
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
                placeholder="lbs"
              />
            </div>
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Category
              </label>
              <select
                value={pantryForm.category}
                onChange={(e) => setPantryForm(s => ({ ...s, category: validatePantryCategory(e.target.value) }))}
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
                <option value="produce">Produce</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="pantry">Pantry</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className={labelClassName} style={{ color: colors.text.secondary }}>
              Expiration Date
            </label>
            <input
              type="date"
              value={pantryForm.expiration}
              onChange={(e) => setPantryForm(s => ({ ...s, expiration: e.target.value }))}
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

          {/* Location and Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Location (optional)
              </label>
              <input
                type="text"
                value={pantryFormLocation}
                onChange={(e) => setPantryFormLocation(e.target.value)}
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
                placeholder="e.g., Pantry Shelf 2"
              />
            </div>
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                min={0}
                value={pantryFormThreshold}
                onChange={(e) => setPantryFormThreshold(e.target.value)}
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
                placeholder="2"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
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
              type="button"
              onClick={() => { void handleSubmit(); }}
              className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                color: 'white',
                border: 'none',
              }}
            >
              Add to Pantry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
